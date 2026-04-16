<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;
use Dokan\TryAura\Database\UsageManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Gemini REST controller.
 *
 * @since 1.0.0
 */
class GenerateController {
	/**
	 * REST API namespace.
	 *
	 * @since 1.0.0
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'generate/v1';

	/**
	 * Class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/image',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_generation' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'tryonNonce'     => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'prompt'         => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'images'         => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'string',
						),
					),
					'generated_from' => array(
						'type'              => 'string',
						'default'           => 'tryon',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'object_id'      => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'object_type'    => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Handle generation request.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function handle_generation( WP_REST_Request $request ) {
		$nonce = $request->get_param( 'tryonNonce' );

		if ( ! wp_verify_nonce( $nonce, 'tryon_nonce' ) ) {
			return new WP_REST_Response( array( 'message' => __( 'Unauthorized access.', 'tryaura' ) ), 401 );
		}

		$prompt     = $request->get_param( 'prompt' );
		$ref_images = $request->get_param( 'images' ) ?? array();

		$settings = get_option( 'tryaura_settings', array() );
		$provider = isset( $settings['google']['provider'] ) ? $settings['google']['provider'] : 'google';
		$api_key  = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$model    = isset( $settings['google']['imageModel'] ) && ! empty( $settings['google']['imageModel'] ) ? $settings['google']['imageModel'] : 'gemini-2.5-flash-image';

		if ( 'openrouter' === $provider ) {
			return $this->generate_via_openrouter( $api_key, $model, $prompt, $ref_images, $request );
		}

		return $this->generate_via_gemini( $api_key, $model, $prompt, $ref_images, $request );
	}

	/**
	 * Generate image via Gemini direct API.
	 *
	 * @since 1.1.0
	 *
	 * @param string          $api_key    API key.
	 * @param string          $model      Model ID.
	 * @param string          $prompt     Generation prompt.
	 * @param array           $ref_images Reference images (base64).
	 * @param WP_REST_Request $request    Original request.
	 *
	 * @return WP_REST_Response
	 */
	private function generate_via_gemini( string $api_key, string $model, string $prompt, array $ref_images, WP_REST_Request $request ) {
		$api_url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

		$prepared_images = array();
		foreach ( $ref_images as $base64_data ) {
			if ( preg_match( '/^data:image\/(\w+);base64,/', $base64_data, $type ) ) {
				$base64_data = substr( $base64_data, strpos( $base64_data, ',' ) + 1 );
				$mime_type   = 'image/' . $type[1];
			} else {
				$mime_type = 'image/jpeg';
			}
			$prepared_images[] = array(
				'mime_type' => $mime_type,
				'data'      => $base64_data,
			);
		}

		$parts = array( array( 'text' => $prompt ) );
		foreach ( $prepared_images as $img ) {
			$parts[] = array(
				'inline_data' => array(
					'mime_type' => $img['mime_type'],
					'data'      => $img['data'],
				),
			);
		}

		$body = array(
			'contents'         => array( array( 'parts' => $parts ) ),
			'generationConfig' => array( 'responseModalities' => array( 'IMAGE' ) ),
		);

		$response = wp_remote_post(
			$api_url,
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array( 'Content-Type' => 'application/json' ),
				'timeout' => 120,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_REST_Response( array( 'error' => $response->get_error_message() ), 500 );
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $data['error'] ) ) {
			return new WP_REST_Response( $data['error'], 400 );
		}

		$image = $data['candidates'][0]['content']['parts'][0]['inlineData']['data'] ?? null;
		$usage = $data['usageMetadata'] ?? null;

		if ( $image ) {
			( new UsageManager() )->log_usage(
				array(
					'type'           => 'image',
					'model'          => $model,
					'prompt'         => $prompt,
					'input_tokens'   => $usage['promptTokenCount'] ?? 0,
					'output_tokens'  => $usage['candidatesTokenCount'] ?? $usage['responseTokenCount'] ?? 0,
					'total_tokens'   => $usage['totalTokenCount'] ?? 0,
					'generated_from' => $request->get_param( 'generated_from' ) ?? 'tryon',
					'object_id'      => $request->get_param( 'object_id' ) ?? 0,
					'object_type'    => $request->get_param( 'object_type' ) ?? '',
					'status'         => 'success',
				)
			);
		}

		return new WP_REST_Response(
			array(
				'image' => $image,
				'usage' => $usage,
			),
			200
		);
	}

	/**
	 * Generate image via OpenRouter API.
	 *
	 * @since 1.1.0
	 *
	 * @param string          $api_key    API key.
	 * @param string          $model      Model ID (OpenRouter slug).
	 * @param string          $prompt     Generation prompt.
	 * @param array           $ref_images Reference images (base64).
	 * @param WP_REST_Request $request    Original request.
	 *
	 * @return WP_REST_Response
	 */
	private function generate_via_openrouter( string $api_key, string $model, string $prompt, array $ref_images, WP_REST_Request $request ) {
		$content = array();

		// Add text prompt.
		$content[] = array(
			'type' => 'text',
			'text' => $prompt,
		);

		// Add reference images as image_url content parts.
		foreach ( $ref_images as $base64_data ) {
			$content[] = array(
				'type'      => 'image_url',
				'image_url' => array(
					'url' => $base64_data,
				),
			);
		}

		$body = array(
			'model'      => $model,
			'messages'   => array(
				array(
					'role'    => 'user',
					'content' => $content,
				),
			),
			'modalities' => array( 'image' ),
		);

		$response = wp_remote_post(
			'https://openrouter.ai/api/v1/chat/completions',
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_key,
				),
				'timeout' => 120,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_REST_Response( array( 'error' => $response->get_error_message() ), 500 );
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $data['error'] ) ) {
			$error_msg = isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'OpenRouter image generation failed.', 'tryaura' );
			return new WP_REST_Response( array( 'error' => $error_msg ), 400 );
		}

		// Extract image from OpenRouter response.
		$image      = null;
		$usage_data = $data['usage'] ?? null;
		$choices    = $data['choices'] ?? array();

		if ( ! empty( $choices[0]['message']['images'] ) ) {
			// Images returned as data URLs (base64).
			$image_url = $choices[0]['message']['images'][0];
			// Strip the data URL prefix to get raw base64.
			if ( preg_match( '/^data:image\/\w+;base64,(.+)$/', $image_url, $matches ) ) {
				$image = $matches[1];
			} else {
				$image = $image_url;
			}
		}

		if ( $image ) {
			( new UsageManager() )->log_usage(
				array(
					'type'           => 'image',
					'model'          => $model,
					'prompt'         => $prompt,
					'input_tokens'   => $usage_data['prompt_tokens'] ?? 0,
					'output_tokens'  => $usage_data['completion_tokens'] ?? 0,
					'total_tokens'   => $usage_data['total_tokens'] ?? 0,
					'generated_from' => $request->get_param( 'generated_from' ) ?? 'tryon',
					'object_id'      => $request->get_param( 'object_id' ) ?? 0,
					'object_type'    => $request->get_param( 'object_type' ) ?? '',
					'status'         => 'success',
				)
			);
		}

		return new WP_REST_Response(
			array(
				'image' => $image,
				'usage' => $usage_data,
			),
			200
		);
	}

	/**
	 * Check if the current user has permission to generate images.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return current_user_can( 'read' );
	}
}

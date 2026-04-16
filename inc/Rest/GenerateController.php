<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;
use Dokan\TryAura\Database\UsageManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * OpenRouter REST controller.
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
		$provider = isset( $settings['openrouter'] ) && is_array( $settings['openrouter'] ) ? $settings['openrouter'] : ( isset( $settings['google'] ) ? $settings['google'] : array() );
		$api_key  = isset( $provider['apiKey'] ) ? $provider['apiKey'] : '';

		if ( empty( $api_key ) ) {
			return new WP_REST_Response( array( 'message' => __( 'Missing OpenRouter API key.', 'tryaura' ) ), 400 );
		}

		$model   = isset( $provider['imageModel'] ) && ! empty( $provider['imageModel'] ) ? $provider['imageModel'] : 'google/gemini-2.5-flash-image';
		$api_url = 'https://openrouter.ai/api/v1/chat/completions';

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

		$parts = array(
			array(
				'type' => 'text',
				'text' => $prompt,
			),
		);
		foreach ( $prepared_images as $img ) {
			$parts[] = array(
				'type'      => 'image_url',
				'image_url' => array(
					'url' => 'data:' . $img['mime_type'] . ';base64,' . $img['data'],
				),
			);
		}

		$body = array(
			'model'      => $model,
			'messages'   => array(
				array(
					'role'    => 'user',
					'content' => $parts,
				),
			),
			'modalities' => array( 'image', 'text' ),
			'stream'     => false,
		);

		$response = wp_remote_post(
			$api_url,
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
			return new WP_REST_Response( $data['error'], 400 );
		}

		$image_data_url = $data['choices'][0]['message']['images'][0]['image_url']['url'] ?? $data['choices'][0]['message']['images'][0]['imageUrl']['url'] ?? null;
		$image          = null;

		if ( is_string( $image_data_url ) && 0 === strpos( $image_data_url, 'data:' ) ) {
			$image = substr( $image_data_url, strpos( $image_data_url, ',' ) + 1 );
		}

		$usage = $data['usage'] ?? null;

		if ( $image ) {
			( new UsageManager() )->log_usage(
				array(
					'type'           => 'image',
					'model'          => $model,
					'prompt'         => $prompt,
					'input_tokens'   => $usage['prompt_tokens'] ?? 0,
					'output_tokens'  => $usage['completion_tokens'] ?? 0,
					'total_tokens'   => $usage['total_tokens'] ?? 0,
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

<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Gemini REST controller.
 */
class GenerateController {
	/**
	 * REST API namespace.
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'generate/v1';

	/**
	 * Class constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/image',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_generation' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * Handle generation request.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function handle_generation( WP_REST_Request $request ) {
		$params     = $request->get_json_params();
		$prompt     = $params['prompt'] ?? '';
		$ref_images = $params['images'] ?? array();

		$api_key = get_option( 'try_aura_api_key', '' );

		$model   = 'gemini-2.5-flash-image';
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
		return new WP_REST_Response(
			array(
				'image' => $image,
				'usage' => $usage,
			),
			200
		);
	}

	/**
	 * Check if the current user is logged in.
	 */
	public function permissions_check() {
		return is_user_logged_in();
	}
}

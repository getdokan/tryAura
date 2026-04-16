<?php

namespace Dokan\TryAura\Rest;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Dokan\TryAura\Database\UsageManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Video Generation REST controller.
 *
 * Handles async video generation via both Gemini (predictLongRunning)
 * and OpenRouter (/api/v1/videos) APIs.
 *
 * @since 1.1.0
 */
class VideoGenerateController {

	/**
	 * REST API namespace.
	 *
	 * @since 1.1.0
	 *
	 * @var string
	 */
	protected string $namespace = 'tryaura/v1';

	/**
	 * Class constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.1.0
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/video/generate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_generate' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'nonce'        => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'model'        => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'prompt'       => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'duration'     => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'resolution'   => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'aspect_ratio' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'images'       => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'string',
						),
					),
					'object_id'    => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'object_type'  => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/video/status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'handle_status' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'job_id'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'provider' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/video/save',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_save' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'nonce'       => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'video_url'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'esc_url_raw',
					),
					'object_id'   => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'object_type' => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Handle video generation submission.
	 *
	 * Routes to the correct provider API based on saved settings.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_generate( WP_REST_Request $request ) {
		$nonce = $request->get_param( 'nonce' );

		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_REST_Response( array( 'message' => __( 'Unauthorized access.', 'tryaura' ) ), 401 );
		}

		$settings = get_option( 'tryaura_settings', array() );
		$provider = isset( $settings['google']['provider'] ) ? $settings['google']['provider'] : 'google';
		$api_key  = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';

		if ( empty( $api_key ) ) {
			return new WP_Error( 'missing_api_key', __( 'API key is not configured.', 'tryaura' ), array( 'status' => 400 ) );
		}

		$model        = $request->get_param( 'model' );
		$prompt       = $request->get_param( 'prompt' );
		$duration     = $request->get_param( 'duration' );
		$resolution   = $request->get_param( 'resolution' );
		$aspect_ratio = $request->get_param( 'aspect_ratio' );
		$images       = $request->get_param( 'images' ) ?? array();

		if ( 'openrouter' === $provider ) {
			return $this->submit_openrouter( $api_key, $model, $prompt, $duration, $resolution, $aspect_ratio, $images );
		}

		return $this->submit_gemini( $api_key, $model, $prompt, $resolution, $aspect_ratio, $images );
	}

	/**
	 * Submit video generation to OpenRouter.
	 *
	 * @since 1.1.0
	 *
	 * @param string $api_key      API key.
	 * @param string $model        Model ID.
	 * @param string $prompt       Generation prompt.
	 * @param string $duration     Video duration.
	 * @param string $resolution   Video resolution.
	 * @param string $aspect_ratio Aspect ratio.
	 * @param array  $images       Reference images.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function submit_openrouter( string $api_key, string $model, string $prompt, string $duration, string $resolution, string $aspect_ratio, array $images ) {
		$body = array(
			'model'  => $model,
			'prompt' => $prompt,
		);

		if ( ! empty( $duration ) ) {
			$body['duration'] = (int) $duration;
		}

		if ( ! empty( $resolution ) ) {
			$body['resolution'] = $resolution;
		}

		if ( ! empty( $aspect_ratio ) ) {
			$body['aspect_ratio'] = $aspect_ratio;
		}

		if ( ! empty( $images ) ) {
			$body['images'] = array_map(
				function ( $img ) {
					return array( 'url' => $img );
				},
				$images
			);
		}

		$response = wp_remote_post(
			'https://openrouter.ai/api/v1/videos',
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_key,
				),
				'timeout' => 60,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', $response->get_error_message(), array( 'status' => 500 ) );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$data        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status_code >= 400 ) {
			$error_msg = isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'OpenRouter video generation failed.', 'tryaura' );
			return new WP_Error( 'api_error', $error_msg, array( 'status' => $status_code ) );
		}

		$job_id = isset( $data['id'] ) ? $data['id'] : '';

		if ( empty( $job_id ) ) {
			return new WP_Error( 'no_job_id', __( 'No job ID returned from OpenRouter.', 'tryaura' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response(
			array(
				'jobId'    => $job_id,
				'provider' => 'openrouter',
			),
			202
		);
	}

	/**
	 * Submit video generation to Gemini (predictLongRunning).
	 *
	 * @since 1.1.0
	 *
	 * @param string $api_key      API key.
	 * @param string $model        Model ID.
	 * @param string $prompt       Generation prompt.
	 * @param string $resolution   Video resolution.
	 * @param string $aspect_ratio Aspect ratio.
	 * @param array  $images       Reference images.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function submit_gemini( string $api_key, string $model, string $prompt, string $resolution, string $aspect_ratio, array $images ) {
		$api_url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:predictLongRunning?key={$api_key}";

		$instance = array(
			'prompt' => $prompt,
		);

		if ( ! empty( $images ) ) {
			$instance['image'] = array(
				'bytesBase64Encoded' => preg_replace( '/^data:image\/\w+;base64,/', '', $images[0] ),
				'mimeType'           => 'image/jpeg',
			);

			if ( preg_match( '/^data:image\/(\w+);base64,/', $images[0], $type ) ) {
				$instance['image']['mimeType'] = 'image/' . $type[1];
			}
		}

		$parameters = array();

		if ( ! empty( $aspect_ratio ) ) {
			$parameters['aspectRatio'] = $aspect_ratio;
		}

		if ( ! empty( $resolution ) ) {
			$parameters['resolution'] = $resolution;
		}

		$body = array(
			'instances' => array( $instance ),
		);

		if ( ! empty( $parameters ) ) {
			$body['parameters'] = $parameters;
		}

		$response = wp_remote_post(
			$api_url,
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array( 'Content-Type' => 'application/json' ),
				'timeout' => 60,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', $response->get_error_message(), array( 'status' => 500 ) );
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $data['error'] ) ) {
			$error_msg = isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'Gemini video generation failed.', 'tryaura' );
			return new WP_Error( 'api_error', $error_msg, array( 'status' => 400 ) );
		}

		$operation_name = isset( $data['name'] ) ? $data['name'] : '';

		if ( empty( $operation_name ) ) {
			return new WP_Error( 'no_operation', __( 'No operation ID returned from Gemini.', 'tryaura' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response(
			array(
				'jobId'    => $operation_name,
				'provider' => 'google',
			),
			202
		);
	}

	/**
	 * Handle video generation status polling.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_status( WP_REST_Request $request ) {
		$job_id   = $request->get_param( 'job_id' );
		$provider = $request->get_param( 'provider' );

		$settings = get_option( 'tryaura_settings', array() );
		$api_key  = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';

		if ( empty( $api_key ) ) {
			return new WP_Error( 'missing_api_key', __( 'API key is not configured.', 'tryaura' ), array( 'status' => 400 ) );
		}

		if ( 'openrouter' === $provider ) {
			return $this->poll_openrouter( $api_key, $job_id );
		}

		return $this->poll_gemini( $api_key, $job_id );
	}

	/**
	 * Poll OpenRouter for video generation status.
	 *
	 * @since 1.1.0
	 *
	 * @param string $api_key API key.
	 * @param string $job_id  Job ID.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function poll_openrouter( string $api_key, string $job_id ) {
		$response = wp_remote_get(
			"https://openrouter.ai/api/v1/videos/{$job_id}",
			array(
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
				),
				'timeout' => 30,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', $response->get_error_message(), array( 'status' => 500 ) );
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		$status    = isset( $data['status'] ) ? $data['status'] : 'unknown';
		$video_url = '';

		if ( 'completed' === $status && ! empty( $data['unsigned_urls'] ) ) {
			$video_url = $data['unsigned_urls'][0];
		}

		$result = array( 'status' => $status );

		if ( ! empty( $video_url ) ) {
			$result['videoUrl'] = $video_url;
		}

		if ( 'failed' === $status && ! empty( $data['error'] ) ) {
			$result['error'] = is_array( $data['error'] ) ? $data['error']['message'] : $data['error'];
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Poll Gemini for video generation status.
	 *
	 * @since 1.1.0
	 *
	 * @param string $api_key        API key.
	 * @param string $operation_name Operation name.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function poll_gemini( string $api_key, string $operation_name ) {
		$api_url = "https://generativelanguage.googleapis.com/v1beta/{$operation_name}?key={$api_key}";

		$response = wp_remote_get(
			$api_url,
			array(
				'timeout' => 30,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', $response->get_error_message(), array( 'status' => 500 ) );
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $data['error'] ) ) {
			return new WP_REST_Response(
				array(
					'status' => 'failed',
					'error'  => isset( $data['error']['message'] ) ? $data['error']['message'] : __( 'Generation failed.', 'tryaura' ),
				),
				200
			);
		}

		$done = isset( $data['done'] ) && $data['done'];

		if ( $done ) {
			$video_uri = '';

			// Extract video URI from Gemini response.
			if ( isset( $data['response']['generateVideoResponse']['generatedSamples'][0]['video']['uri'] ) ) {
				$video_uri = $data['response']['generateVideoResponse']['generatedSamples'][0]['video']['uri'];
			}

			return new WP_REST_Response(
				array(
					'status'   => 'completed',
					'videoUrl' => $video_uri,
				),
				200
			);
		}

		return new WP_REST_Response(
			array( 'status' => 'in_progress' ),
			200
		);
	}

	/**
	 * Handle saving a generated video to the media library.
	 *
	 * @since 1.1.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_save( WP_REST_Request $request ) {
		$nonce = $request->get_param( 'nonce' );

		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_REST_Response( array( 'message' => __( 'Unauthorized access.', 'tryaura' ) ), 401 );
		}

		$video_url   = $request->get_param( 'video_url' );
		$object_id   = $request->get_param( 'object_id' );
		$object_type = $request->get_param( 'object_type' );

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// For Gemini URIs that need the API key appended.
		$settings = get_option( 'tryaura_settings', array() );
		$api_key  = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$provider = isset( $settings['google']['provider'] ) ? $settings['google']['provider'] : 'google';

		$download_args = array( 'timeout' => 300 );

		if ( 'openrouter' === $provider ) {
			$download_args['headers'] = array(
				'Authorization' => 'Bearer ' . $api_key,
			);
		} elseif ( strpos( $video_url, 'googleapis.com' ) !== false && ! empty( $api_key ) ) {
			// Append API key for Gemini video URIs.
			$separator = ( strpos( $video_url, '?' ) !== false ) ? '&' : '?';
			$video_url = $video_url . $separator . 'key=' . $api_key;
		}

		$tmp_file = download_url( $video_url, 300 );

		if ( is_wp_error( $tmp_file ) ) {
			return new WP_Error( 'download_failed', $tmp_file->get_error_message(), array( 'status' => 500 ) );
		}

		$file_array = array(
			'name'     => 'tryaura-video-' . wp_generate_uuid4() . '.mp4',
			'tmp_name' => $tmp_file,
		);

		$attachment_id = media_handle_sideload( $file_array, 0 );

		if ( is_wp_error( $attachment_id ) ) {
			wp_delete_file( $tmp_file );
			return new WP_Error( 'save_failed', $attachment_id->get_error_message(), array( 'status' => 500 ) );
		}

		// Log usage.
		( new UsageManager() )->log_usage(
			array(
				'type'           => 'video',
				'model'          => isset( $settings['google']['videoModel'] ) ? $settings['google']['videoModel'] : '',
				'prompt'         => '',
				'input_tokens'   => 0,
				'output_tokens'  => 0,
				'total_tokens'   => 0,
				'generated_from' => 'admin',
				'object_id'      => $object_id ? $object_id : 0,
				'object_type'    => $object_type ? $object_type : '',
				'status'         => 'success',
			)
		);

		return new WP_REST_Response(
			array(
				'attachment_id' => $attachment_id,
				'url'           => wp_get_attachment_url( $attachment_id ),
			),
			200
		);
	}

	/**
	 * Check if the current user has permission for video generation.
	 *
	 * @since 1.1.0
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return current_user_can( 'edit_posts' );
	}
}

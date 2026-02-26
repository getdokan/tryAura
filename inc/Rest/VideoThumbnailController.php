<?php

namespace Dokan\TryAura\Rest;

use Dokan\TryAura\TryAura;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Video Thumbnail REST controller.
 *
 * @since 1.0.0
 */
class VideoThumbnailController {
	/**
	 * REST API namespace.
	 *
	 * @since 1.0.0
	 *
	 * @var string api namespace.
	 */
	protected string $namespace = 'tryaura/v1';

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
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/generate-thumbnail',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_generate_thumbnail' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'platform' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'url'      => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'esc_url_raw',
					),
					'image'    => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Handle thumbnail generation request.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_generate_thumbnail( WP_REST_Request $request ) {
		$platform = $request->get_param( 'platform' );
		$url      = $request->get_param( 'url' );
		$image    = $request->get_param( 'image' );

		$attachment_id = 0;

		if ( ! empty( $image ) && strpos( $image, 'data:image/' ) === 0 ) {
			// Save from base64 (site-stored generated thumbnail)
			$attachment_id = $this->save_base64_image( $image, $url );
		} elseif ( 'youtube' === $platform ) {
			// Fetch from YouTube
			$attachment_id = $this->fetch_youtube_thumbnail( $url );
		}

		if ( is_wp_error( $attachment_id ) ) {
			return $attachment_id;
		}

		if ( ! $attachment_id ) {
			return new WP_Error( 'failed', __( 'Could not generate thumbnail.', 'tryaura' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response(
			array(
				'attachment_id' => $attachment_id,
				'url'           => wp_get_attachment_image_url( $attachment_id, 'thumbnail' ),
			),
			200
		);
	}

	/**
	 * Save base64 image as attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param string $base64_data Base64 encoded image.
	 * @param string $video_url   Original video URL for naming.
	 *
	 * @return int|WP_Error
	 */
	private function save_base64_image( string $base64_data, string $video_url ) {
		if ( preg_match( '/^data:image\/(\w+);base64,/', $base64_data, $type ) ) {
			$base64_data = substr( $base64_data, strpos( $base64_data, ',' ) + 1 );
			$ext         = strtolower( $type[1] ); // jpg, png, etc.
		} else {
			return new WP_Error( 'invalid_image', __( 'Invalid image data.', 'tryaura' ) );
		}

		$image_data = base64_decode( $base64_data );
		if ( ! $image_data ) {
			return new WP_Error( 'decode_failed', __( 'Could not decode image.', 'tryaura' ) );
		}

		$filename = 'video-thumb-' . md5( $video_url ) . '.' . $ext;
		$upload   = wp_upload_bits( $filename, null, $image_data );

		if ( $upload['error'] ) {
			return new WP_Error( 'upload_failed', $upload['error'] );
		}

		return $this->create_attachment( $upload['file'], $upload['type'] );
	}

	/**
	 * Fetch YouTube thumbnail and save as attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url YouTube video URL.
	 *
	 * @return int|WP_Error
	 */
	private function fetch_youtube_thumbnail( string $url ) {
		$video_id = TryAura::container()->get( 'woocommerce' )->get_youtube_id( $url );
		if ( ! $video_id ) {
			return new WP_Error( 'invalid_youtube_url', __( 'Invalid YouTube URL.', 'tryaura' ) );
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		// Try maxresdefault first, then hqdefault
		$thumbnail_urls = array(
			"https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg",
			"https://img.youtube.com/vi/{$video_id}/hqdefault.jpg",
		);

		$tmp = '';
		foreach ( $thumbnail_urls as $thumb_url ) {
			$tmp = download_url( $thumb_url );
			if ( ! is_wp_error( $tmp ) ) {
				break;
			}
		}

		if ( is_wp_error( $tmp ) ) {
			return $tmp;
		}

		$file_array = array(
			'name'     => "youtube-{$video_id}.jpg",
			'tmp_name' => $tmp,
		);

		$id = media_handle_sideload( $file_array, 0 );

		if ( is_wp_error( $id ) ) {
			wp_delete_file( $tmp );
		}

		return $id;
	}

	/**
	 * Create attachment from file.
	 *
	 * @since 1.0.0
	 *
	 * @param string $file      File path.
	 * @param string $mime_type Mime type.
	 *
	 * @return int|WP_Error
	 */
	private function create_attachment( string $file, string $mime_type ) {
		$attachment = array(
			'post_mime_type' => $mime_type,
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $file ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		$attach_id = wp_insert_attachment( $attachment, $file );

		if ( is_wp_error( $attach_id ) ) {
			return $attach_id;
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attach_data = wp_generate_attachment_metadata( $attach_id, $file );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		return $attach_id;
	}

	/**
	 * Check if the current user can edit products.
	 *
	 * @since 1.0.0
	 */
	public function permissions_check() {
		return current_user_can( 'edit_products' );
	}
}

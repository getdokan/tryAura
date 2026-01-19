<?php

namespace Dokan\TryAura\WooCommerce\Frontend;

use Dokan\TryAura\WooCommerce\Admin\ProductGalleryVideo as AdminProductVideo;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Handles Product Gallery Video functionality on the frontend.
 */
class ProductVideoGallery {

	/**
	 * Class constructor.
	 */
	public function __construct() {
		// Use filters for better theme compatibility.
		add_filter( 'woocommerce_single_product_image_thumbnail_html', array( $this, 'render_video_gallery_item' ), 10, 2 );

		// Enqueue scripts and styles.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Render video gallery item when the attachment has video data.
	 *
	 * @param string $html          The original HTML.
	 * @param int    $attachment_id The attachment ID.
	 *
	 * @return string Modified HTML.
	 */
	public function render_video_gallery_item( string $html, int $attachment_id ): string {
		global $product;

		if ( ! $product ) {
			return $html;
		}

		$video_data = get_post_meta( $product->get_id(), AdminProductVideo::VIDEO_META_KEY, true );

		if ( empty( $video_data ) || ! is_array( $video_data ) || ! isset( $video_data[ $attachment_id ] ) ) {
			return $html;
		}

		$video = $video_data[ $attachment_id ];

		if ( empty( $video['url'] ) ) {
			return $html;
		}

		$thumbnail_url = ! empty( $video['thumbnailUrl'] ) ? $video['thumbnailUrl'] : '';

		if ( empty( $thumbnail_url ) && 'youtube' === $video['platform'] ) {
			$video_id      = $this->get_youtube_id( $video['url'] );
			$thumbnail_url = $video_id ? "https://img.youtube.com/vi/{$video_id}/hqdefault.jpg" : '';
		}

		if ( empty( $thumbnail_url ) ) {
			$thumbnail_url = wp_get_attachment_image_url( $attachment_id, 'woocommerce_thumbnail' );
		}

		if ( empty( $thumbnail_url ) ) {
			$thumbnail_url = wc_placeholder_img_src();
		}

		// Add video-related data attributes to the existing gallery item
		$html = preg_replace(
			'/class=["\']/',
			'data-try-aura-video-url="' . esc_url( $video['url'] ) . '" data-try-aura-video-platform="' . esc_attr( $video['platform'] ) . '" $0try-aura-video-item try-aura-video-thumbnail ',
			$html,
			1
		);

		// Insert video icon overlay before the closing tag of the gallery image wrapper
		$video_overlay = '<div class="try-aura-video-icon-overlay"><svg viewBox="0 0 24 24" width="48" height="48" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg></div>';

		if ( strpos( $html, '</' ) !== false ) {
			$html = preg_replace( '/<\/[a-z0-9]+>\s*$/i', $video_overlay . '$0', $html );
		}

		return $html;
	}

	/**
	 * Enqueue frontend assets.
	 */
	public function enqueue_assets(): void {
		if ( ! is_product() ) {
			return;
		}

		wp_enqueue_style( 'try-aura-product-video-frontend', plugins_url( 'assets/css/product-video.css', TRYAURA_FILE ), array( 'wp-components' ), TRYAURA_PLUGIN_VERSION );
		wp_enqueue_script( 'try-aura-product-video-frontend', plugins_url( 'assets/js/product-video.js', TRYAURA_FILE ), array( 'jquery', 'wp-element', 'wp-components', 'wp-i18n' ), TRYAURA_PLUGIN_VERSION, true );

		global $post;

		if ( ! $post ) {
			return;
		}

		$video_data = get_post_meta( $post->ID, AdminProductVideo::VIDEO_META_KEY, true );

		wp_localize_script(
			'try-aura-product-video-frontend',
			'tryAuraVideoData',
			array(
				'video' => $video_data,
			)
		);
	}

	/**
	 * Extract YouTube video ID from URL.
	 *
	 * @param string $url YouTube URL.
	 *
	 * @return string|false
	 */
	private function get_youtube_id( string $url ) {
		preg_match( '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $url, $match );
		return isset( $match[1] ) ? $match[1] : false;
	}
}

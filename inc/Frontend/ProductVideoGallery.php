<?php

namespace Dokan\TryAura\Frontend;

use Dokan\TryAura\Admin\ProductGalleryVideo as AdminProductVideo;

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
		add_action( 'woocommerce_product_thumbnails', array( $this, 'render_video_thumbnail' ), 30 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue frontend assets.
	 */
	public function enqueue_assets(): void {
		if ( ! is_product() ) {
			return;
		}

		wp_enqueue_style( 'try-aura-product-video-frontend', plugins_url( 'assets/css/product-video.css', TRYAURA_FILE ), array(), TRYAURA_PLUGIN_VERSION );
		wp_enqueue_script( 'try-aura-product-video-frontend', plugins_url( 'assets/js/product-video.js', TRYAURA_FILE ), array( 'jquery' ), TRYAURA_PLUGIN_VERSION, true );

		global $post;
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
	 * Render video thumbnail in the product gallery.
	 */
	public function render_video_thumbnail(): void {
		global $product;

		if ( ! $product ) {
			return;
		}

		$video_data = get_post_meta( $product->get_id(), AdminProductVideo::VIDEO_META_KEY, true );

		if ( empty( $video_data ) || empty( $video_data['url'] ) ) {
			return;
		}

		$thumbnail_url = ! empty( $video_data['thumbnailUrl'] ) ? $video_data['thumbnailUrl'] : '';

		if ( empty( $thumbnail_url ) && 'youtube' === $video_data['platform'] ) {
			$video_id      = $this->get_youtube_id( $video_data['url'] );
			$thumbnail_url = $video_id ? "https://img.youtube.com/vi/{$video_id}/hqdefault.jpg" : '';
		}

		if ( empty( $thumbnail_url ) ) {
			$thumbnail_url = wc_placeholder_img_src();
		}

		$html = sprintf(
			'<div class="woocommerce-product-gallery__image try-aura-video-thumbnail" data-video-url="%s" data-video-platform="%s">',
			esc_url( $video_data['url'] ),
			esc_attr( $video_data['platform'] )
		);
		$html .= sprintf(
			'<a href="%s">',
			esc_url( $thumbnail_url )
		);
		$html .= sprintf(
			'<img src="%s" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="%s">',
			esc_url( $thumbnail_url ),
			__( 'Product Video', 'try-aura' )
		);
		$html .= '<div class="try-aura-video-icon-overlay"><svg viewBox="0 0 24 24" width="48" height="48" fill="white"><path d="M8 5v14l11-7z"/></svg></div>';
		$html .= '</a></div>';

		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
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

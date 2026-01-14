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
	 * Virtual ID prefix for videos.
	 */
	private const VIRTUAL_ID_PREFIX = -999000;

	/**
	 * Class constructor.
	 */
	public function __construct() {
		// Use filters for better theme compatibility.
		add_filter( 'woocommerce_product_get_gallery_image_ids', array( $this, 'inject_video_ids' ), 10, 2 );
		add_filter( 'woocommerce_single_product_image_thumbnail_html', array( $this, 'render_video_gallery_item' ), 10, 2 );

		// Enqueue scripts and styles.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Inject virtual IDs for videos into the product gallery.
	 *
	 * @param array       $image_ids Array of image attachment IDs.
	 * @param \WC_Product $product   The product object.
	 *
	 * @return array Modified array of IDs.
	 */
	public function inject_video_ids( array $image_ids, $product ): array {
		$video_data = get_post_meta( $product->get_id(), AdminProductVideo::VIDEO_META_KEY, true );

		if ( empty( $video_data ) ) {
			return $image_ids;
		}

		$videos = is_array( $video_data ) && ( empty( $video_data ) || isset( $video_data[0] ) ) ? $video_data : array( $video_data );

		foreach ( $videos as $index => $video ) {
			if ( ! empty( $video['url'] ) ) {
				// Use a negative ID to avoid conflicts with real attachments.
				$image_ids[] = self::VIRTUAL_ID_PREFIX - $index;
			}
		}

		return $image_ids;
	}

	/**
	 * Render video gallery item when the virtual ID is encountered.
	 *
	 * @param string $html          The original HTML.
	 * @param int    $attachment_id The attachment ID.
	 *
	 * @return string Modified HTML.
	 */
	public function render_video_gallery_item( string $html, int $attachment_id ): string {
		if ( $attachment_id > self::VIRTUAL_ID_PREFIX ) {
			return $html;
		}

		global $product;

		if ( ! $product ) {
			return $html;
		}

		$video_data = get_post_meta( $product->get_id(), AdminProductVideo::VIDEO_META_KEY, true );

		if ( empty( $video_data ) ) {
			return $html;
		}

		$videos = is_array( $video_data ) && ( empty( $video_data ) || isset( $video_data[0] ) ) ? $video_data : array( $video_data );
		$index  = self::VIRTUAL_ID_PREFIX - $attachment_id;

		if ( ! isset( $videos[ $index ] ) ) {
			return $html;
		}

		$video = $videos[ $index ];

		if ( empty( $video['url'] ) ) {
			return $html;
		}

		$thumbnail_url = ! empty( $video['thumbnailUrl'] ) ? $video['thumbnailUrl'] : '';

		if ( empty( $thumbnail_url ) && 'youtube' === $video['platform'] ) {
			$video_id      = $this->get_youtube_id( $video['url'] );
			$thumbnail_url = $video_id ? "https://img.youtube.com/vi/{$video_id}/hqdefault.jpg" : '';
		}

		if ( empty( $thumbnail_url ) ) {
			$thumbnail_url = wc_placeholder_img_src();
		}

		$html = sprintf(
			'<div class="woocommerce-product-gallery__image try-aura-video-thumbnail" data-thumb="%s" data-video-url="%s" data-video-platform="%s">',
			esc_url( $thumbnail_url ),
			esc_url( $video['url'] ),
			esc_attr( $video['platform'] )
		);
		$html .= sprintf(
			'<a href="%s" class="try-aura-video-link">',
			esc_url( $thumbnail_url )
		);
		$html .= sprintf(
			'<img src="%s" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="%s" data-src="%s" data-large_image="%s" data-large_image_width="1000" data-large_image_height="1000">',
			esc_url( $thumbnail_url ),
			__( 'Product Video', 'try-aura' ),
			esc_url( $thumbnail_url ),
			esc_url( $thumbnail_url )
		);
		$html .= '<div class="try-aura-video-icon-overlay"><svg viewBox="0 0 24 24" width="48" height="48" fill="white"><path d="M8 5v14l11-7z"/></svg></div>';
		$html .= '</a></div>';

		return $html;
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

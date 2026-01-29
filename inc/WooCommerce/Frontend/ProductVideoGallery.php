<?php

namespace Dokan\TryAura\WooCommerce\Frontend;

use Dokan\TryAura\TryAura;
use Dokan\TryAura\WooCommerce\Admin\ProductGalleryVideo as AdminProductVideo;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Handles Product Gallery Video functionality on the frontend.
 *
 * @since PLUGIN_SINCE
 */
class ProductVideoGallery {

	/**
	 * Class constructor.
	 *
	 * @since PLUGIN_SINCE
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
	 * @since PLUGIN_SINCE
	 *
	 * @param string $html          The original HTML.
	 * @param int    $attachment_id The attachment ID.
	 *
	 * @return string Modified HTML.
	 */
	public function render_video_gallery_item( $html, $attachment_id ) {
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
			$video_id      = TryAura::container()->get( 'woocommerce' )->get_youtube_id( $video['url']);
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
	 *
	 * @since PLUGIN_SINCE
	 */
	public function enqueue_assets(): void {
		if ( ! is_product() ) {
			return;
		}

		$script_path = 'build/frontend/product-video/index.js';
		$style_path  = 'build/frontend/product-video/style-index.css';
		$asset_path  = TRYAURA_DIR . '/build/frontend/product-video/index.asset.php';

		$deps    = array( 'jquery', 'wp-element', 'wp-components', 'wp-i18n' );
		$version = TRYAURA_PLUGIN_VERSION;

		if ( file_exists( $asset_path ) ) {
			$asset   = include $asset_path;
			$deps    = array_unique( array_merge( $deps, $asset['dependencies'] ?? array() ) );
			$version = $asset['version'] ?? $version;
		}

		if ( file_exists( TRYAURA_DIR . '/' . $style_path ) ) {
			wp_enqueue_style( 'try-aura-product-video-frontend', plugins_url( $style_path, TRYAURA_FILE ), array( 'wp-components' ), $version );
		}

		wp_enqueue_script( 'try-aura-product-video-frontend', plugins_url( $script_path, TRYAURA_FILE ), $deps, $version, true );

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
}

<?php

namespace Dokan\TryAura\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Handles Product Gallery Video functionality in the admin.
 */
class ProductGalleryVideo {

	/**
	 * Meta key for storing product video data.
	 */
	public const VIDEO_META_KEY = '_try_aura_product_video';

	/**
	 * Class constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save_video_meta' ) );
	}

	/**
	 * Enqueue admin assets for the product edit page.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_assets( string $hook ): void {
		if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'product' !== $screen->post_type ) {
			return;
		}

		global $post;
		$product_id = $post ? $post->ID : 0;

		$video_data = get_post_meta( $product_id, self::VIDEO_META_KEY, true );

		$settings    = get_option( 'try_aura_settings', array() );
		$api_key     = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$image_model = isset( $settings['google']['imageModel'] ) ? $settings['google']['imageModel'] : '';

		$script_path = 'build/admin/product-video-gallery/index.js';
		$style_path  = 'build/admin/product-video-gallery/style-index.css';
		$asset_path  = TRYAURA_DIR . '/build/admin/product-video-gallery/index.asset.php';

		$deps    = array( 'jquery', 'wp-element', 'wp-components', 'wp-data', 'wp-i18n' );
		$version = TRYAURA_PLUGIN_VERSION;

		if ( file_exists( $asset_path ) ) {
			$asset   = include $asset_path;
			$deps    = array_unique( array_merge( $deps, $asset['dependencies'] ?? array() ) );
			$version = $asset['version'] ?? $version;
		}

		wp_enqueue_style( 'try-aura-components' );
		wp_enqueue_style( 'try-aura-product-video', plugins_url( $style_path, TRYAURA_FILE ), array(), $version );
		wp_enqueue_script( 'try-aura-product-video', plugins_url( $script_path, TRYAURA_FILE ), $deps, $version, true );

		wp_localize_script(
			'try-aura-product-video',
			'tryAuraVideo',
			array(
				'restUrl'    => esc_url_raw( rest_url() ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
				'productId'  => $product_id,
				'videoData'  => $video_data ? $video_data : null,
				'apiKey'     => $api_key,
				'imageModel' => $image_model,
			)
		);
	}

	/**
	 * Save video meta when product is saved.
	 *
	 * @param int $post_id The product ID.
	 */
	public function save_video_meta( int $post_id ): void {
		if ( isset( $_POST['try_aura_video_data'] ) ) {
			$video_data = json_decode( stripslashes( $_POST['try_aura_video_data'] ), true );
			update_post_meta( $post_id, self::VIDEO_META_KEY, $video_data );
		}
	}
}

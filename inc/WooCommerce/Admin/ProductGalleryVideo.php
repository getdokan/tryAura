<?php

namespace Dokan\TryAura\WooCommerce\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Handles Product Gallery Video functionality in the admin.
 *
 * @since PLUGIN_SINCE
 */
class ProductGalleryVideo {

	/**
	 * Meta key for storing product video data.
	 *
	 * @since PLUGIN_SINCE
	 */
	public const VIDEO_META_KEY = '_try_aura_product_video';

	/**
	 * Class constructor.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save_video_meta' ) );

		add_action( 'woocommerce_admin_after_product_gallery_item', array( $this, 'get_gallery_product_video_btn' ), 10, 2 );
	}

	/**
	 * Print nonce field.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function maybe_print_nonce(): void {
		static $nonce_printed = false;

		if ( ! $nonce_printed ) {
			wp_nonce_field( 'try_aura_save_video_data', 'try_aura_video_data_nonce' );
			$nonce_printed = true;
		}
	}

	/**
	 * Get button for gallery image.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param int $post_id       Post ID.
	 * @param int $attachment_id Attachment id.
	 */
	public function get_gallery_product_video_btn( $post_id, $attachment_id ): void {
		$this->maybe_print_nonce();

		$product_video_data = get_post_meta( $post_id, self::VIDEO_META_KEY, true );
		$settings           = array();

		if ( ! empty( $product_video_data[ $attachment_id ] ) && is_array( $product_video_data[ $attachment_id ] ) ) {
			$settings = $product_video_data[ $attachment_id ];
		}

		if ( empty( $settings ) ) {
			return;
		}

		$classes = ' try-aura-edit-video';
		$icon_class = 'dashicons-edit';
		?>
		<div class="tryaura try-aura-product-video-wrapp">
			<a href="#" class="try-aura-btn try-aura-product-gallery-video flex items-center justify-center bg-primary text-white no-underline <?php echo esc_attr( $classes ); ?>" data-attachment-id="<?php echo esc_attr( $attachment_id ); ?>">
				<span class="dashicons <?php echo esc_attr( $icon_class ); ?> text-[18px]! w-4.5! h-4.5! flex! items-center! justify-center!"></span>
			</a>
			<input type="hidden" class="try-aura-video-data-input" name="try_aura_video_data[<?php echo esc_attr( $attachment_id ); ?>]" value='<?php echo wp_json_encode( $settings ); ?>'>
		</div>
		<?php
	}


	/**
	 * Enqueue admin assets for the product edit page.
	 *
	 * @since PLUGIN_SINCE
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

		add_action( 'post_submitbox_misc_actions', array( $this, 'maybe_print_nonce' ) );

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
				'videoText'  => __( 'Video', 'try-aura' ),
				'addVideoText' => __( 'Add video', 'try-aura' ),
				'apiKey'     => $api_key,
				'imageModel' => $image_model,
			)
		);
	}

	/**
	 * Save video meta when product is saved.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param int $post_id The product ID.
	 */
	public function save_video_meta( int $post_id ): void {
		if ( ! isset( $_POST['try_aura_video_data_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['try_aura_video_data_nonce'] ) ), 'try_aura_save_video_data' ) ) {
			return;
		}

		$video_data = isset( $_POST['try_aura_video_data'] ) ? wp_unslash( $_POST['try_aura_video_data'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$product_settings = array();

		foreach ( (array) $video_data as $attachment_id => $settings ) {
			$settings = json_decode( $settings, true );
			if ( ! empty( $settings['url'] ) ) {
				$product_settings[ (int) $attachment_id ] = map_deep( $settings, 'sanitize_text_field' );
			}
		}

		if ( empty( $product_settings ) ) {
			delete_post_meta( $post_id, self::VIDEO_META_KEY );
		} else {
			update_post_meta( $post_id, self::VIDEO_META_KEY, $product_settings );
		}
	}
}

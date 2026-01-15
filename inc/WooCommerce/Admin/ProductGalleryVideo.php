<?php

namespace Dokan\TryAura\WooCommerce\Admin;

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

		add_filter( 'admin_post_thumbnail_html', array( $this, 'get_main_image_video_btn' ), 10, 3 );
		add_action( 'woocommerce_admin_after_product_gallery_item', array( $this, 'get_gallery_product_video_btn' ), 10, 2 );
	}

	/**
	 * Get button for gallery image.
	 *
	 * @param int $post_id       Post ID.
	 * @param int $attachment_id Attachment id.
	 */
	public function get_gallery_product_video_btn( $post_id, $attachment_id ): void {
		$product_video_data = get_post_meta( $post_id, self::VIDEO_META_KEY, true );
		$settings           = array();

		if ( ! empty( $product_video_data[ $attachment_id ] ) && is_array( $product_video_data[ $attachment_id ] ) ) {
			$settings = $product_video_data[ $attachment_id ];
		}

		$classes = ! empty( $settings ) ? ' try-aura-edit-video' : ' try-aura-add-video';
		$icon_class = ! empty( $settings ) ? 'dashicons-edit' : 'dashicons-plus';
		?>
		<div class="tryaura try-aura-product-video-wrapp absolute bottom-0 left-0 right-0 z-10">
			<a href="#" class="try-aura-btn try-aura-product-gallery-video flex items-center justify-center gap-[5px] bg-[var(--color-primary)] text-white no-underline py-[5px] text-[11px] font-semibold leading-none hover:bg-[var(--color-primary-dark)] <?php echo esc_attr( $classes ); ?>" data-attachment-id="<?php echo esc_attr( $attachment_id ); ?>">
				<span class="dashicons <?php echo esc_attr( $icon_class ); ?> !text-[14px] !w-[14px] !h-[14px] !flex !items-center !justify-center"></span>
				<?php esc_html_e( 'Video', 'try-aura' ); ?>
			</a>
			<input type="hidden" class="try-aura-video-data-input" name="try_aura_video_data[<?php echo esc_attr( $attachment_id ); ?>]" value='<?php echo wp_json_encode( $settings ); ?>'>
		</div>
		<?php
	}

	/**
	 * Get button for main product image.
	 *
	 * @param string $content       Image content.
	 * @param int    $post_id       Post ID.
	 * @param int    $attachment_id Attachment ID.
	 * @return string
	 */
	public function get_main_image_video_btn( $content, $post_id, $attachment_id ): string {
		if ( 'product' !== get_post_type( $post_id ) ) {
			return $content;
		}

		ob_start();
		$this->get_gallery_product_video_btn( $post_id, $attachment_id );
		return $content . ob_get_clean();
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
				'videoText'  => __( 'Video', 'try-aura' ),
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
			$video_data = (array) $_POST['try_aura_video_data'];
			$product_settings = array();

			foreach ( $video_data as $attachment_id => $settings ) {
				$settings = json_decode( wp_unslash( $settings ), true );
				if ( ! empty( $settings['url'] ) ) {
					$product_settings[ $attachment_id ] = $settings;
				}
			}

			update_post_meta( $post_id, self::VIDEO_META_KEY, $product_settings );
		}
	}
}

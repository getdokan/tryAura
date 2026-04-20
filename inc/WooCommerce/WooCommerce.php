<?php

namespace Dokan\TryAura\WooCommerce;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * WooCommerce Integration class.
 *
 * @since 1.0.0
 */
class WooCommerce {

	/**
	 * Meta key for try-on visibility.
	 *
	 * @since 1.0.0
	 */
	public const TRY_ON_META_KEY = '_tryaura_try_on_enabled';

	/**
	 * Class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		// Add product list column.
		add_filter( 'manage_edit-product_columns', array( $this, 'add_product_column' ) );
		add_action( 'manage_product_posts_custom_column', array( $this, 'render_product_column' ), 10, 2 );

		// Enqueue admin scripts for the toggle.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

		// AJAX handler for the toggle.
		add_action( 'wp_ajax_tryaura_toggle_try_on', array( $this, 'toggle_try_on_ajax' ) );

		// Action Scheduler handler for bulk update.
		add_action( 'tryaura_bulk_update_products_try_on', array( $this, 'bulk_update_products_try_on' ), 10, 2 );
	}

	/**
	 * Add "Try-on" column to product list.
	 *
	 * @since 1.0.0
	 *
	 * @param array $columns The existing columns.
	 *
	 * @return array Modified columns.
	 */
	public function add_product_column( array $columns ): array {
		$new_columns = array();
		foreach ( $columns as $key => $column ) {
			$new_columns[ $key ] = $column;
			if ( 'featured' === $key ) {
				$new_columns['tryaura_try_on'] = __( 'Try-on', 'tryaura' );
			}
		}
		return $new_columns;
	}

	/**
	 * Render the "Try-on" column content.
	 *
	 * @since 1.0.0
	 *
	 * @param string $column The column name.
	 * @param int    $product_id The product ID.
	 **/
	public function render_product_column( string $column, int $product_id ): void {
		if ( 'tryaura_try_on' !== $column ) {
			return;
		}

		$enabled = get_post_meta( $product_id, self::TRY_ON_META_KEY, true );
		// Default to disabled if not set.
		if ( empty( $enabled ) ) {
			$enabled = 'no';
		}

		$checked = 'yes' === $enabled;

		$switch_template = TRYAURA_DIR . '/templates/products/tryon-switch.php';
		if ( file_exists( $switch_template ) ) {
			include $switch_template;
		}
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook The current admin page hook suffix.
	 */
	public function enqueue_admin_assets( string $hook ): void {
		if ( 'edit.php' !== $hook ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'product' !== $screen->post_type ) {
			return;
		}

		$asset_file = TRYAURA_DIR . '/build/admin/woocommerce-products-list.asset.php';
		$deps       = array( 'jquery' );
		$version    = '1.0.0';

		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file;
			$deps    = $asset['dependencies'] ?? $deps;
			$version = $asset['version'] ?? $version;
		}

		$script_url = plugins_url( 'build/admin/woocommerce-products-list.js', TRYAURA_FILE );
		wp_enqueue_script( 'tryaura-woo-products', $script_url, $deps, $version, true );

		wp_localize_script(
			'tryaura-woo-products',
			'tryAuraWoo',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'tryaura_toggle_nonce' ),
			)
		);

		wp_register_style( 'tryaura-woo-products', false, array(), $version );
		wp_enqueue_style( 'tryaura-woo-products' );
		wp_add_inline_style( 'tryaura-woo-products', $this->get_admin_products_inline_css() );
	}

	/**
	 * Get scoped CSS for the product list try-on toggle.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	private function get_admin_products_inline_css(): string {
		return '
			.column-tryaura_try_on {
				width: 88px;
				text-align: center;
			}

			.tryaura-try-on {
				display: inline-flex;
				align-items: center;
				justify-content: center;
			}

			.tryaura-try-on__input {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			.tryaura-try-on__track {
				position: relative;
				display: inline-block;
				width: 32px;
				height: 18px;
				background: #8c8f94;
				border-radius: 999px;
				transition: background-color 0.2s ease;
				cursor: pointer;
			}

			.tryaura-try-on__track::after {
				content: "";
				position: absolute;
				top: 2px;
				left: 2px;
				width: 14px;
				height: 14px;
				background: #fff;
				border-radius: 50%;
				box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
				transition: transform 0.2s ease;
			}

			.tryaura-try-on__input:checked + .tryaura-try-on__track {
				background: #2271b1;
			}

			.tryaura-try-on__input:checked + .tryaura-try-on__track::after {
				transform: translateX(14px);
			}

			.tryaura-try-on__input:focus + .tryaura-try-on__track {
				box-shadow: 0 0 0 1px #fff, 0 0 0 3px #2271b1;
			}

			.tryaura-try-on__input:disabled + .tryaura-try-on__track {
				opacity: 0.7;
				cursor: not-allowed;
			}
		';
	}

	/**
	 * Toggle try-on visibility via AJAX.
	 *
	 * @since 1.0.0
	 */
	public function toggle_try_on_ajax(): void {
		check_ajax_referer( 'tryaura_toggle_nonce', 'nonce' );

		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'tryaura' ) ) );
		}

		$product_id = isset( $_POST['product_id'] ) ? intval( $_POST['product_id'] ) : 0;
		$enabled    = isset( $_POST['enabled'] ) && 'true' === sanitize_text_field( wp_unslash( $_POST['enabled'] ) ) ? 'yes' : 'no';

		if ( ! $product_id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid product ID.', 'tryaura' ) ) );
		}

		update_post_meta( $product_id, self::TRY_ON_META_KEY, $enabled );

		wp_send_json_success( array( 'enabled' => $enabled ) );
	}

	/**
	 * Bulk update products try-on visibility.
	 *
	 * @param array  $product_ids Array of product IDs.
	 * @param string $enabled 'yes' or 'no'.
	 */
	public function bulk_update_products_try_on( array $product_ids, string $enabled ): void {
		if ( empty( $product_ids ) ) {
			return;
		}

		foreach ( $product_ids as $product_id ) {
			update_post_meta( $product_id, self::TRY_ON_META_KEY, $enabled );
		}
	}

	/**
	 * Extract YouTube video ID from URL.
	 *
	 * @since 1.0.0
	 *
	 * @param string $url URL.
	 *
	 * @return string|bool
	 */
	public function get_youtube_id( string $url ) {
		$pattern = '/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i';
		if ( preg_match( $pattern, $url, $match ) ) {
			return $match[1];
		}
		return false;
	}
}

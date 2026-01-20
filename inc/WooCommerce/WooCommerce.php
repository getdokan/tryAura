<?php

namespace Dokan\TryAura\WooCommerce;

use Dokan\TryAura\WooCommerce\Frontend\TryOn;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * WooCommerce Integration class.
 *
 * @since PLUGIN_SINCE
 */
class WooCommerce {

	/**
	 * Meta key for try-on visibility.
	 *
	 * @since PLUGIN_SINCE
	 */
	public const TRY_ON_META_KEY = '_try_aura_try_on_enabled';

	/**
	 * Class constructor.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		if ( ! $this->is_woocommerce_active() ) {
			return;
		}

		// Frontend try-on script on product pages.
		new TryOn();

		// Add product list column.
		add_filter( 'manage_edit-product_columns', array( $this, 'add_product_column' ) );
		add_action( 'manage_product_posts_custom_column', array( $this, 'render_product_column' ), 10, 2 );

		// Enqueue admin scripts for the toggle.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

		// AJAX handler for the toggle.
		add_action( 'wp_ajax_try_aura_toggle_try_on', array( $this, 'toggle_try_on_ajax' ) );

		// Action Scheduler handler for bulk update.
		add_action( 'try_aura_bulk_update_products_try_on', array( $this, 'bulk_update_products_try_on' ), 10, 2 );
	}

	/**
	 * Check if WooCommerce is active.
	 *
	 * @since PLUGIN_SINCE
	 */
	private function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * Add "Try-on" column to product list.
	 *
	 * @since PLUGIN_SINCE
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
				$new_columns['try_aura_try_on'] = __( 'Try-on', 'try-aura' );
			}
		}
		return $new_columns;
	}

	/**
	 * Render the "Try-on" column content.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param string $column The column name.
	 * @param int    $product_id The product ID.
	 **/
	public function render_product_column( string $column, int $product_id ): void {
		if ( 'try_aura_try_on' !== $column ) {
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
	 * @since PLUGIN_SINCE
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
		wp_enqueue_script( 'try-aura-woo-products', $script_url, $deps, $version, true );

		wp_localize_script(
			'try-aura-woo-products',
			'tryAuraWoo',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'try_aura_toggle_nonce' ),
			)
		);

		$css_path = TRYAURA_DIR . '/build/admin/style-woocommerce-products-list.css';
		if ( file_exists( $css_path ) ) {
			$css_url = plugins_url( 'build/admin/style-woocommerce-products-list.css', TRYAURA_FILE );
			wp_enqueue_style( 'try-aura-woo-products', $css_url, array(), $version );
		}
	}

	/**
	 * Toggle try-on visibility via AJAX.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function toggle_try_on_ajax(): void {
		check_ajax_referer( 'try_aura_toggle_nonce', 'nonce' );

		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'try-aura' ) ) );
		}

		$product_id = isset( $_POST['product_id'] ) ? intval( $_POST['product_id'] ) : 0;
		$enabled    = isset( $_POST['enabled'] ) && 'true' === $_POST['enabled'] ? 'yes' : 'no';

		if ( ! $product_id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid product ID.', 'try-aura' ) ) );
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
}

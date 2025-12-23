<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * WooCommerce Integration class.
 */
class WooCommerce {

	/**
	 * Meta key for try-on visibility.
	 */
	public const TRY_ON_META_KEY = '_try_aura_try_on_enabled';

	/**
	 * Class constructor.
	 */
	public function __construct() {
		if ( ! $this->is_woocommerce_active() ) {
			return;
		}

		// Add product list column.
		add_filter( 'manage_edit-product_columns', array( $this, 'add_product_column' ) );
		add_action( 'manage_product_posts_custom_column', array( $this, 'render_product_column' ), 10, 2 );

		// Enqueue admin scripts for the toggle.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

		// AJAX handler for the toggle.
		add_action( 'wp_ajax_try_aura_toggle_try_on', array( $this, 'toggle_try_on_ajax' ) );
	}

	/**
	 * Check if WooCommerce is active.
	 */
	private function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * Add "Try-on" column to product list.
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
	 * @param string $column The column name.
	 * @param int    $product_id The product ID.
	 **/
	public function render_product_column( string $column, int $product_id ): void {
		if ( 'try_aura_try_on' !== $column ) {
			return;
		}

		$enabled = get_post_meta( $product_id, self::TRY_ON_META_KEY, true );
		// Default to enabled if not set.
		if ( '' === $enabled ) {
			$enabled = 'yes';
		}

		$checked = 'yes' === $enabled;

		$switch_template = plugin_dir_path( __DIR__ ) . 'templates/products/tryon-switch.php';
		if ( file_exists( $switch_template ) ) {
			include $switch_template;
		}
	}

	/**
	 * Enqueue admin assets.
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

		$asset_file = plugin_dir_path( __DIR__ ) . 'build/admin/woocommerce-products-list.asset.php';
		$deps       = array( 'jquery' );
		$version    = '1.0.0';

		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file;
			$deps    = $asset['dependencies'] ?? $deps;
			$version = $asset['version'] ?? $version;
		}

		$script_url = plugin_dir_url( __DIR__ ) . 'build/admin/woocommerce-products-list.js';
		wp_enqueue_script( 'try-aura-woo-products', $script_url, $deps, $version, true );

		wp_localize_script(
			'try-aura-woo-products',
			'tryAuraWoo',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'try_aura_toggle_nonce' ),
			)
		);

		$css_path = plugin_dir_path( __DIR__ ) . 'build/admin/style-woocommerce-products-list.css';
		if ( file_exists( $css_path ) ) {
			$css_url = plugin_dir_url( __DIR__ ) . 'build/admin/style-woocommerce-products-list.css';
			wp_enqueue_style( 'try-aura-woo-products', $css_url, array(), $version );
		}
	}

	/**
	 * Toggle try-on visibility via AJAX.
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
}

<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers and enqueues the Frontend Try-On UI assets on single product pages.
 */
class TryOn {
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Enqueue the Try-On UI only on WooCommerce single product pages.
	 */
	public function enqueue(): void {
		if ( ! function_exists( 'is_product' ) || ! is_product() ) {
			return;
		}

		$product_id = get_the_ID();
		if ( ! $product_id ) {
			return;
		}

		$enabled = get_post_meta( $product_id, WooCommerce::TRY_ON_META_KEY, true );
		// Default to enabled if not set.
		if ( 'no' === $enabled ) {
			return;
		}

		$asset_file = plugin_dir_path( __DIR__ ) . 'build/frontend/tryon/index.asset.php';
		$deps       = array( 'wp-element' );
		$version    = '1.0.0';

		if ( file_exists( $asset_file ) ) {
			$asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps  = $asset['dependencies'] ?? $deps;
			if ( ! in_array( 'wp-element', $deps, true ) ) {
				$deps[] = 'wp-element';
			}
			$version = $asset['version'] ?? $version;
		}

		$script_url = plugin_dir_url( __DIR__ ) . 'build/frontend/tryon/index.js';

		wp_register_script( 'try-aura-tryon', $script_url, $deps, $version, true );

		// Enqueue compiled Tailwind CSS for frontend if available.
		$css_path = plugin_dir_path( __DIR__ ) . 'build/frontend/tryon/style-index.css';
		if ( file_exists( $css_path ) ) {
			$css_url = plugin_dir_url( __DIR__ ) . 'build/frontend/tryon/style-index.css';
			wp_register_style( 'try-aura-tryon', $css_url, array(), filemtime( $css_path ) );
			wp_enqueue_style( 'try-aura-tryon' );
		}

		// Localize data for the frontend app.
		wp_localize_script(
			'try-aura-tryon',
			'tryAura',
			array(
				'restUrl' => esc_url_raw( rest_url() ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				// NOTE: Exposes the saved API key to the frontend. In production, proxy via server.
				'apiKey'  => get_option( 'try_aura_api_key', '' ),
			)
		);

		wp_enqueue_script( 'try-aura-tryon' );
	}
}

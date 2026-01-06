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
		// Default to disabled if not set.
		if ( 'no' === $enabled || empty( $enabled ) ) {
			return;
		}

		// Localize data for the frontend app.
		wp_localize_script(
			'try-aura-tryon',
			'tryAura',
			array(
				'restUrl'   => esc_url_raw( rest_url() ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'productId' => $product_id,
				// NOTE: Exposes the saved API key to the frontend. In production, proxy via server.
				'apiKey'    => get_option( 'try_aura_api_key', '' ),
			)
		);

		wp_enqueue_style( 'try-aura-tryon' );
		wp_enqueue_script( 'try-aura-tryon' );
	}
}

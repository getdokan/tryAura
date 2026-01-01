<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers and enqueues the Frontend Try-On UI assets on single product pages.
 */
class TryOn {
	/**
	 * Class constructor.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
		add_filter( 'woocommerce_login_redirect', array( $this, 'redirect_to_try_on' ), 10, 2 );
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

		// Localize data for the frontend app.
		wp_localize_script(
			'try-aura-tryon',
			'tryAura',
			array(
				'restUrl'   => esc_url_raw( rest_url() ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'productId' => $product_id,
				'loginUrl'  => $this->get_login_url(),
			)
		);

		wp_enqueue_style( 'try-aura-tryon' );
		wp_enqueue_script( 'try-aura-tryon' );
	}

	/**
	 * If WooCommerce is active, redirect to account login page or WordPress login page.
	 *
	 * @return string Login URL.
	 */
	private function get_login_url() {
		if ( function_exists( 'wc_get_page_permalink' ) ) {
			return wc_get_page_permalink( 'myaccount' );
		}

		return wp_login_url();
	}

	/**
	 * Redirect to Try-On page after login if the parameter is set.
	 *
	 * @param string   $redirect the redirect URL.
	 * @param \WP_User $user the logged in user.
	 *
	 * @return string Redirect URL.
	 */
	public function redirect_to_try_on( $redirect, $user ) {
		if ( ! empty( $_REQUEST['tryaura_redirect_to'] ) ) {
			return esc_url_raw( wp_unslash( $_REQUEST['tryaura_redirect_to'] ) );
		}

		return $redirect;
	}
}

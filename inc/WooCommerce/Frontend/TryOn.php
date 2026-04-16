<?php

namespace Dokan\TryAura\WooCommerce\Frontend;

use Dokan\TryAura\TryAura;
use Dokan\TryAura\WooCommerce\WooCommerce;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers and enqueues the Frontend Try-On UI assets on single product pages.
 *
 * @since 1.0.0
 */
class TryOn {
	/**
	 * Class constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
		add_filter( 'woocommerce_login_redirect', array( $this, 'redirect_to_try_on' ), 10, 2 );
	}

	/**
	 * Enqueue the Try-On UI only on WooCommerce single product pages.
	 *
	 * @since 1.0.0
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

		$settings = get_option( 'tryaura_settings', array() );
		$provider = isset( $settings['google']['provider'] ) ? $settings['google']['provider'] : 'google';

		// Localize data for the frontend app.
		wp_localize_script(
			'tryaura-tryon',
			'tryAura',
			array(
				'restUrl'         => esc_url_raw( rest_url() ),
				'tryonNonce'      => wp_create_nonce( 'tryon_nonce' ),
				'redirectNonce'   => wp_create_nonce( 'tryaura_redirect_to_nonce' ),
				'provider'        => $provider,
				'productId'       => $product_id,
				'loginUrl'        => $this->get_login_url(),
				'hasPro'          => (bool) TryAura::is_pro_exists(),
			)
		);

		wp_enqueue_style( 'tryaura-tryon' );
		wp_enqueue_script( 'tryaura-tryon' );
	}

	/**
	 * If WooCommerce is active, redirect to account login page or WordPress login page.
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
	 *
	 * @param string   $redirect the redirect URL.
	 * @param \WP_User $user the logged in user.
	 *
	 * @return string Redirect URL.
	 */
	public function redirect_to_try_on( $redirect, $user ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! empty( sanitize_text_field( wp_unslash( $_GET['tryaura_redirect_to'] ) ) ) ) {
			$nonce = isset( $_GET['_tryaura_nonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_tryaura_nonce'] ) ) : '';

			if ( wp_verify_nonce( $nonce, 'tryaura_redirect_to_nonce' ) && user_can( $user, 'read' )  ) {
				return wp_validate_redirect( sanitize_text_field( wp_unslash( $_GET['tryaura_redirect_to'] ) ), $redirect );
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return $redirect;
	}
}

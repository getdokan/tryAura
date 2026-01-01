<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Admin class for TryAura plugin.
 */
class Admin {
	/**
	 * Option key for storing API key.
	 *
	 * @var string
	 */
	private string $option_key = 'try_aura_api_key';

	/**
	 * Bootstrap admin hooks.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Register the TryAura top-level admin page.
	 */
	public function register_admin_page(): void {
		global $submenu;
		$slug       = 'try-aura';
		$capability = 'manage_options';
		$menu_icon  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNwYXJrbGVzLWljb24gbHVjaWRlLXNwYXJrbGVzIj48cGF0aCBkPSJNMTEuMDE3IDIuODE0YTEgMSAwIDAgMSAxLjk2NiAwbDEuMDUxIDUuNTU4YTIgMiAwIDAgMCAxLjU5NCAxLjU5NGw1LjU1OCAxLjA1MWExIDEgMCAwIDEgMCAxLjk2NmwtNS41NTggMS4wNTFhMiAyIDAgMCAwLTEuNTk0IDEuNTk0bC0xLjA1MSA1LjU1OGExIDEgMCAwIDEtMS45NjYgMGwtMS4wNTEtNS41NThhMiAyIDAgMCAwLTEuNTk0LTEuNTk0bC01LjU1OC0xLjA1MWExIDEgMCAwIDEgMC0xLjk2Nmw1LjU1OC0xLjA1MWEyIDIgMCAwIDAgMS41OTQtMS41OTR6Ii8+PHBhdGggZD0iTTIwIDJ2NCIvPjxwYXRoIGQ9Ik0yMiA0aC00Ii8+PGNpcmNsZSBjeD0iNCIgY3k9IjIwIiByPSIyIi8+PC9zdmc+';

		add_menu_page(
			__( 'TryAura', 'try-aura' ),
			__( 'TryAura', 'try-aura' ),
			$capability,
			$slug,
			array( $this, 'render_page' ),
			$menu_icon,
			56
		);

		$submenu[ $slug ][] = array( __( 'Dashboard', 'try-aura' ), $capability, 'admin.php?page=' . $slug . '#/' );
		$submenu[ $slug ][] = array( __( 'Settings', 'try-aura' ), $capability, 'admin.php?page=' . $slug . '#/settings' );
	}

	/**
	 * Register plugin settings (API key) and expose via REST for JS app.
	 */
	public function register_settings(): void {
		register_setting(
			'try_aura',
			$this->option_key,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
				'show_in_rest'      => array(
					'name'   => $this->option_key,
					'schema' => array( 'type' => 'string' ),
				),
				'auth_callback'     => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Enqueue admin assets only on our settings page.
	 */
	public function enqueue_assets( string $hook ): void {
		if ( 'toplevel_page_try-aura' !== $hook ) {
			return;
		}

		// Localize data for the app.
		wp_localize_script(
			'try-aura-admin',
			'tryAura',
			array(
				'restUrl'   => esc_url_raw( rest_url() ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'apiKey'    => get_option( $this->option_key, '' ),
				'optionKey' => $this->option_key,
			)
		);

		// Ensure WP component styles are present.
		if ( wp_style_is( 'wp-components', 'registered' ) ) {
			wp_enqueue_style( 'wp-components' );
		}

		wp_enqueue_script( 'try-aura-admin' );
		wp_enqueue_style( 'try-aura-admin' );
	}

	/**
	 * Render the main admin page content.
	 */
	public function render_page(): void {
		echo '<div class="wrap">';
		echo '<h1>' . esc_html__( 'TryAura Settings', 'try-aura' ) . '</h1>';
		echo '<div id="try-aura-settings-root" class="tryaura"></div>';
		echo '</div>';
	}
}

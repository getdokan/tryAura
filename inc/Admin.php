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
		add_menu_page(
			__( 'TryAura', 'try-aura' ),
			__( 'TryAura', 'try-aura' ),
			'manage_options',
			'try-aura',
			array( $this, 'render_page' ),
			'dashicons-camera',
			56
		);
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

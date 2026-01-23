<?php

namespace Dokan\TryAura\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Admin class for TryAura plugin.
 *
 * @since PLUGIN_SINCE
 */
class Admin {
	/**
	 * Option key for storing API key.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string
	 */
	private string $option_key = 'try_aura_settings';

	/**
	 * Bootstrap admin hooks.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Register the TryAura top-level admin page.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function register_admin_page(): void {
		global $submenu;
		$slug       = 'try-aura';
		$capability = 'manage_options';
		$menu_icon  = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQzIiBoZWlnaHQ9IjE0MyIgdmlld0JveD0iMCAwIDE0MyAxNDMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMTguMjkgMEgyNC41NEMxMC45OCAwIDAgMTAuOTggMCAyNC41NFYxMTguMzlDMjguMTggODcuNDYgNzMuODUgNjEuNzQgODMuNzUgNTYuMzVDODQuOSA1NS43MyA4Ni4zIDU1Ljk3IDg3LjE3IDU2LjkyQzg4LjIgNTguMDMgODguMTQgNTkuNzcgODcuMDYgNjAuODVDNTkuODUgODguMTkgNDkuMzggMTI5LjgyIDQ2LjY3IDE0Mi44M0gxMTguMjlDMTMxLjgzIDE0Mi44MyAxNDIuODMgMTMxLjg1IDE0Mi44MyAxMTguMjlWMjQuNTRDMTQyLjgzIDEwLjk4IDEzMS44MyAwIDExOC4yOSAwWk0xMjguODYgNDEuNjlDMTIyLjI3IDQyLjY4IDExNi4zIDQ1LjY3IDExMS41NiA1MC4zNkMxMDYuOTEgNTUuMDEgMTAzLjgxIDYxLjEyIDEwMi44MSA2Ny41OEgxMDIuNDlDMTAxLjUyIDYxLjEyIDk4LjQzIDU0Ljk4IDkzLjc5IDUwLjM1Qzg5LjA4IDQ1LjYyIDgzLjEgNDIuNiA3Ni41MiA0MS42VjQxLjNDODMuMTEgNDAuMzEgODkuMDkgMzcuMzIgOTMuODIgMzIuNjNDOTguNTUgMjcuOTQgMTAxLjU5IDIxLjk3IDEwMi41NyAxNS40MUgxMDIuODlDMTAzLjg4IDIxLjg5IDEwNi45NiAyOC4wMSAxMTEuNTkgMzIuNjRDMTE2LjMgMzcuMzcgMTIyLjI3IDQwLjM5IDEyOC44NiA0MS4zOFY0MS43VjQxLjY5WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';

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
	 *
	 * @since PLUGIN_SINCE
	 */
	public function register_settings(): void {
		register_setting(
			'try_aura',
			$this->option_key,
			array(
				'type'          => 'object',
				'default'       => array(),
				'show_in_rest'  => array(
					'name'   => $this->option_key,
					'schema' => array( 'type' => 'object' ),
				),
				'auth_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Enqueue admin assets only on our settings page.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function enqueue_assets( string $hook ): void {
		if ( 'toplevel_page_try-aura' !== $hook ) {
			return;
		}

		$settings    = get_option( $this->option_key, array() );
		$api_key     = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$image_model = isset( $settings['google']['imageModel'] ) ? $settings['google']['imageModel'] : '';
		$video_model = isset( $settings['google']['videoModel'] ) ? $settings['google']['videoModel'] : '';

		// Localize data for the app.
		wp_localize_script(
			'try-aura-admin',
			'tryAura',
			array(
				'restUrl'    => esc_url_raw( rest_url() ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
				'apiKey'     => $api_key,
				'imageModel' => $image_model,
				'videoModel' => $video_model,
				'optionKey'  => $this->option_key,
			)
		);

		// Ensure WP component styles are present.
		if ( wp_style_is( 'wp-components', 'registered' ) ) {
			wp_enqueue_style( 'wp-components' );
		}

		wp_enqueue_script( 'try-aura-ai-models' );

		do_action( 'try_aura_register_admin_dashboard_assets' );

		wp_enqueue_script( 'try-aura-admin' );
		wp_enqueue_style( 'try-aura-admin' );
	}

	/**
	 * Render the main admin page content.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function render_page(): void {
		echo '<div class="wrap">';
		echo '<div id="try-aura-settings-root" class="tryaura"></div>';
		echo '</div>';
	}
}

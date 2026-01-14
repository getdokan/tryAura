<?php

namespace Dokan\TryAura\Admin;

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
	private string $option_key = 'try_aura_settings';

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
		$menu_icon  = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAxOCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOC44MzIwMyIgd2lkdGg9IjIuMzMzMzMiIGhlaWdodD0iMjAiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEwIiB5PSI4LjgzMzk4IiB3aWR0aD0iMi4zMzMzMyIgaGVpZ2h0PSIxMCIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMTAgOC44MzM5OCkiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjE3Ljg5NDUiIHk9IjE2LjI0NjEiIHdpZHRoPSIyLjMzMzMzIiBoZWlnaHQ9IjIwIiB0cmFuc2Zvcm09InJvdGF0ZSgxMzUgMTcuODk0NSAxNi4yNDYxKSIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMy43NTM5MSIgeT0iMTcuODk2NSIgd2lkdGg9IjIuMzMzMzMiIGhlaWdodD0iMjAiIHRyYW5zZm9ybT0icm90YXRlKC0xMzUgMy43NTM5MSAxNy44OTY1KSIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';

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
		wp_enqueue_script( 'try-aura-admin' );
		wp_enqueue_style( 'try-aura-admin' );
	}

	/**
	 * Render the main admin page content.
	 */
	public function render_page(): void {
		echo '<div class="wrap">';
		echo '<div id="try-aura-settings-root" class="tryaura"></div>';
		echo '</div>';
	}
}

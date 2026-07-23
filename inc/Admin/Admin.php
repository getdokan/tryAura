<?php

namespace Dokan\TryAura\Admin;

use Dokan\TryAura\Admin\Promotion;
use Dokan\TryAura\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Admin class for TryAura plugin.
 *
 * @since 1.0.0
 */
class Admin {
	/**
	 * Option key for storing API key.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	private string $option_key = 'tryaura_settings';

	/**
	 * Bootstrap admin hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_menu', array( $this, 'register_admin_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Capture admin notices so the Top Bar renders first on our page.
		add_action( 'admin_notices', array( $this, 'inject_before_notices' ), -9999 );
		add_action( 'admin_notices', array( $this, 'inject_after_notices' ), PHP_INT_MAX );

		add_filter( 'plugin_action_links_' . plugin_basename( TRYAURA_FILE ), array( $this, 'add_settings_action_link' ) );
	}

	/**
	 * Add the "Settings" action link on the All Plugins screen.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param array $links Existing plugin action links.
	 *
	 * @return array
	 */
	public function add_settings_action_link( array $links ): array {
		array_unshift(
			$links,
			sprintf(
				'<a href="%s">%s</a>',
				esc_url( admin_url( 'admin.php?page=tryaura#/settings' ) ),
				esc_html__( 'Settings', 'tryaura' )
			)
		);

		return $links;
	}

	/**
	 * Whether the current admin screen is the TryAura page.
	 *
	 * @since 1.0.5
	 *
	 * @return bool
	 */
	private function is_tryaura_admin_page(): bool {
		$screen = get_current_screen();

		return $screen && 'toplevel_page_tryaura' === $screen->id;
	}

	/**
	 * Open a hidden wrapper before admin notices render.
	 *
	 * WordPress core relocates `.notice` elements to just after the first
	 * `.wp-header-end`. Opening the wrapper (and printing the catcher) before
	 * any notice fires collects them all inside a hidden container, so the
	 * Top Bar can sit at the very top of the page.
	 *
	 * @since 1.0.5
	 *
	 * @return void
	 */
	public function inject_before_notices(): void {
		if ( ! $this->is_tryaura_admin_page() ) {
			return;
		}

		echo '<div class="tryaura-notice-list-hide" id="tryaura__notice-list">';
		echo '<div class="wp-header-end" id="tryaura__notice-catcher"></div>';
	}

	/**
	 * Close the hidden notice wrapper opened in inject_before_notices().
	 *
	 * @since 1.0.5
	 *
	 * @return void
	 */
	public function inject_after_notices(): void {
		if ( ! $this->is_tryaura_admin_page() ) {
			return;
		}

		echo '</div>';
	}

	/**
	 * Register the TryAura top-level admin page.
	 *
	 * @since 1.0.0
	 */
	public function register_admin_page(): void {
		global $submenu;
		$slug       = 'tryaura';
		$capability = 'manage_options';
		$menu_icon  = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQzIiBoZWlnaHQ9IjE0MyIgdmlld0JveD0iMCAwIDE0MyAxNDMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMTguMjkgMEgyNC41NEMxMC45OCAwIDAgMTAuOTggMCAyNC41NFYxMTguMzlDMjguMTggODcuNDYgNzMuODUgNjEuNzQgODMuNzUgNTYuMzVDODQuOSA1NS43MyA4Ni4zIDU1Ljk3IDg3LjE3IDU2LjkyQzg4LjIgNTguMDMgODguMTQgNTkuNzcgODcuMDYgNjAuODVDNTkuODUgODguMTkgNDkuMzggMTI5LjgyIDQ2LjY3IDE0Mi44M0gxMTguMjlDMTMxLjgzIDE0Mi44MyAxNDIuODMgMTMxLjg1IDE0Mi44MyAxMTguMjlWMjQuNTRDMTQyLjgzIDEwLjk4IDEzMS44MyAwIDExOC4yOSAwWk0xMjguODYgNDEuNjlDMTIyLjI3IDQyLjY4IDExNi4zIDQ1LjY3IDExMS41NiA1MC4zNkMxMDYuOTEgNTUuMDEgMTAzLjgxIDYxLjEyIDEwMi44MSA2Ny41OEgxMDIuNDlDMTAxLjUyIDYxLjEyIDk4LjQzIDU0Ljk4IDkzLjc5IDUwLjM1Qzg5LjA4IDQ1LjYyIDgzLjEgNDIuNiA3Ni41MiA0MS42VjQxLjNDODMuMTEgNDAuMzEgODkuMDkgMzcuMzIgOTMuODIgMzIuNjNDOTguNTUgMjcuOTQgMTAxLjU5IDIxLjk3IDEwMi41NyAxNS40MUgxMDIuODlDMTAzLjg4IDIxLjg5IDEwNi45NiAyOC4wMSAxMTEuNTkgMzIuNjRDMTE2LjMgMzcuMzcgMTIyLjI3IDQwLjM5IDEyOC44NiA0MS4zOFY0MS43VjQxLjY5WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';

		add_menu_page(
			__( 'TryAura', 'tryaura' ),
			__( 'TryAura', 'tryaura' ),
			$capability,
			$slug,
			array( $this, 'render_page' ),
			$menu_icon,
			56
		);

		$submenu[ $slug ][] = array( __( 'Dashboard', 'tryaura' ), $capability, 'admin.php?page=' . $slug . '#/' );
		$submenu[ $slug ][] = array( __( 'Settings', 'tryaura' ), $capability, 'admin.php?page=' . $slug . '#/settings' );
	}

	/**
	 * Register plugin settings (API key) and expose via REST for JS app.
	 *
	 * @since 1.0.0
	 */
	public function register_settings(): void {
		register_setting(
			'tryaura',
			$this->option_key,
			array(
				'type'              => 'object',
				'default'           => array(),
				'show_in_rest'      => array(
					'name'   => $this->option_key,
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'google'      => array(
								'type'       => 'object',
								'properties' => array(
									'apiKey'     => array( 'type' => 'string' ),
									'imageModel' => array( 'type' => 'string' ),
									'videoModel' => array( 'type' => 'string' ),
								),
							),
							'woocommerce' => array(
								'type'       => 'object',
								'properties' => array(
									'bulkTryOnEenabled' => array( 'type' => 'boolean' ),
								),
							),
						),
					),
				),
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
				'auth_callback'     => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Sanitize the plugin settings before saving.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $value The unsanitized setting value.
	 *
	 * @return array Sanitized settings array.
	 */
	public function sanitize_settings( $value ): array {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$sanitized = array();

		if ( isset( $value['google'] ) && is_array( $value['google'] ) ) {
			$sanitized['google'] = array(
				'apiKey'     => isset( $value['google']['apiKey'] ) ? sanitize_text_field( $value['google']['apiKey'] ) : '',
				'imageModel' => isset( $value['google']['imageModel'] ) ? sanitize_text_field( $value['google']['imageModel'] ) : '',
				'videoModel' => isset( $value['google']['videoModel'] ) ? sanitize_text_field( $value['google']['videoModel'] ) : '',
			);
		}

		if ( isset( $value['woocommerce'] ) && is_array( $value['woocommerce'] ) ) {
			$sanitized['woocommerce'] = array(
				'bulkTryOnEenabled' => isset( $value['woocommerce']['bulkTryOnEenabled'] ) ? rest_sanitize_boolean( $value['woocommerce']['bulkTryOnEenabled'] ) : false,
			);
		}

		return $sanitized;
	}

	/**
	 * Enqueue admin assets only on our settings page.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_assets( string $hook ): void {
		if ( 'toplevel_page_tryaura' !== $hook ) {
			return;
		}

		$settings    = get_option( $this->option_key, array() );
		$api_key     = isset( $settings['google']['apiKey'] ) ? $settings['google']['apiKey'] : '';
		$image_model = isset( $settings['google']['imageModel'] ) ? $settings['google']['imageModel'] : '';
		$video_model = isset( $settings['google']['videoModel'] ) ? $settings['google']['videoModel'] : '';

		// Localize data for the admin app (admin-only page, requires manage_options).
		wp_localize_script(
			'tryaura-admin',
			'tryAura',
			array(
				'restUrl'                  => esc_url_raw( rest_url() ),
				'nonce'                    => wp_create_nonce( 'wp_rest' ),
				'apiKey'                   => $api_key,
				'imageModel'               => $image_model,
				'videoModel'               => $video_model,
				'optionKey'                => $this->option_key,
				'wcExists'                 => class_exists( 'WooCommerce' ),
				'version'                  => $this->get_plugin_version( TRYAURA_FILE ),
				'hasPro'                   => (bool) TryAura::is_pro_exists(),
				'proVersion'               => TryAura::is_pro_exists() && defined( 'TRYAURAPRO_FILE' ) ? $this->get_plugin_version( TRYAURAPRO_FILE ) : '',
				'upgradeToProUrl'          => Promotion::UPGRADE_URL,
				'showUpgradeBanner'        => Promotion::should_show_upgrade_banner(),
				/**
				 * Controls whether the Gemini API settings page is read-only.
				 *
				 * When true, the Connect button is disabled and the API key
				 * field becomes read-only. Useful for demo environments.
				 *
				 * Usage in functions.php:
				 *   add_filter( 'tryaura_is_gemini_settings_readonly', '__return_true' );
				 *
				 * @since 1.0.0
				 * @param bool $readonly Default false.
				 */
				'isGeminiSettingsReadonly' => (int) apply_filters( 'tryaura_is_gemini_settings_readonly', false ),
			)
		);

		// Ensure WP component styles are present.
		if ( wp_style_is( 'wp-components', 'registered' ) ) {
			wp_enqueue_style( 'wp-components' );
		}

		wp_enqueue_script( 'tryaura-ai-models' );

		do_action( 'tryaura_register_admin_dashboard_assets' );

		wp_enqueue_script( 'tryaura-admin' );
		wp_enqueue_style( 'tryaura-admin' );
	}

	/**
	 * Read a plugin version from its main file header.
	 *
	 * @since 1.0.5
	 *
	 * @param string $plugin_file Absolute path to the plugin main file.
	 *
	 * @return string Version string, or empty string when unreadable.
	 */
	private function get_plugin_version( string $plugin_file ): string {
		$data = get_file_data( $plugin_file, array( 'Version' => 'Version' ), 'plugin' );

		return $data['Version'] ?? '';
	}

	/**
	 * Render the main admin page content.
	 *
	 * @since 1.0.0
	 */
	public function render_page(): void {
		// The Top Bar mounts outside `.wrap` so it can span the full content
		// width, and outside the `.tryaura` Tailwind scope whose importantized
		// utilities would otherwise clobber the plugin-ui components.
		echo '<div id="tryaura-admin-header"></div>';
		echo '<div class="wrap">';
		echo '<div id="tryaura-settings-root" class="tryaura tryaura-admin-page-body"></div>';
		echo '</div>';
	}
}

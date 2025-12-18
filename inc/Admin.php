<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Admin {
    /**
     * Option key for storing API key.
     */
    private string $option_key = 'try_aura_api_key';

    /**
     * Bootstrap admin hooks.
     */
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_admin_page' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
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
            [ $this, 'render_page' ],
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
            [
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
                'show_in_rest'      => [
                    'name'   => $this->option_key,
                    'schema' => [ 'type' => 'string' ],
                ],
                'auth_callback'     => function() {
                    return current_user_can( 'manage_options' );
                },
            ]
        );
    }

    /**
     * Enqueue admin assets only on our settings page.
     */
    public function enqueue_assets( string $hook ): void {
        if ( 'toplevel_page_try-aura' !== $hook ) {
            return;
        }

        $asset_file = plugin_dir_path( __DIR__ ) . 'build/admin/settings/index.asset.php';
        $deps       = [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n', 'wp-api' ];
        $version    = '1.0.0';

        if ( file_exists( $asset_file ) ) {
            $asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
            $deps    = isset( $asset['dependencies'] ) ? $asset['dependencies'] : $deps;
            $version = isset( $asset['version'] ) ? $asset['version'] : $version;
        }

        $script_url = plugin_dir_url( __DIR__ ) . 'build/admin/settings/index.js';

        wp_register_script( 'try-aura-admin', $script_url, $deps, $version, true );

        // Enqueue compiled Tailwind CSS if available.
        $css_path = plugin_dir_path( __DIR__ ) . 'build/admin/settings/style-index.css';
        if ( file_exists( $css_path ) ) {
            $css_url = plugin_dir_url( __DIR__ ) . 'build/admin/settings/style-index.css';
            wp_register_style( 'try-aura-admin', $css_url, [], filemtime( $css_path ) );
            wp_enqueue_style( 'try-aura-admin' );
        }

        // Localize data for the app.
        wp_localize_script( 'try-aura-admin', 'tryAura', [
            'restUrl'  => esc_url_raw( rest_url() ),
            'nonce'    => wp_create_nonce( 'wp_rest' ),
            'apiKey'   => get_option( $this->option_key, '' ),
            'optionKey'=> $this->option_key,
        ] );

        // Ensure WP component styles are present.
        if ( wp_style_is( 'wp-components', 'registered' ) ) {
            wp_enqueue_style( 'wp-components' );
        }

        wp_enqueue_script( 'try-aura-admin' );
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

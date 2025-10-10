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
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue' ] );
    }

    /**
     * Enqueue the Try-On UI only on WooCommerce single product pages.
     */
    public function enqueue(): void {
        if ( ! function_exists( 'is_product' ) || ! is_product() ) {
            return;
        }

        $asset_file = plugin_dir_path( __DIR__ ) . 'build/tryon.asset.php';
        $deps       = [ 'wp-element' ];
        $version    = '1.0.0';

        if ( file_exists( $asset_file ) ) {
            $asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
            $deps    = $asset['dependencies'] ?? $deps;
            if ( ! in_array( 'wp-element', $deps, true ) ) {
                $deps[] = 'wp-element';
            }
            $version = $asset['version'] ?? $version;
        }

        $script_url = plugin_dir_url( __DIR__ ) . 'build/tryon.js';

        wp_register_script( 'try-aura-tryon', $script_url, $deps, $version, true );

        // Localize data for the frontend app.
        wp_localize_script( 'try-aura-tryon', 'tryAura', [
            'restUrl' => esc_url_raw( rest_url() ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
            // NOTE: Exposes the saved API key to the frontend. In production, proxy via server.
            'apiKey'  => get_option( 'try_aura_api_key', '' ),
        ] );

        wp_enqueue_script( 'try-aura-tryon' );
    }
}

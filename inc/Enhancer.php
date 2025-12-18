<?php

namespace Dokan\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers and enqueues the Featured Image AI Enhancer UI assets in the editor.
 */
class Enhancer {
	public function __construct() {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
	}

	/**
	 * Enqueue the enhancer UI only on post edit screens.
	 *
	 * @param string $hook Current admin page hook suffix.
	 */
	public function enqueue( string $hook ): void {
		// Limit to classic/block editor post screens where the featured image modal is used.
		if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

        $components_asset = plugin_dir_path( __DIR__ ) . 'build/components.asset.php';
        $deps       = ['wp-element'];
        $version    = '1.0.0';

        if ( file_exists( $components_asset ) ) {
            $asset   = include $components_asset; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
            $deps    = $asset['dependencies'] ?? $deps;
            $version = $asset['version'] ?? $version;
        }

        $components_script_url = plugin_dir_url( __DIR__ ) . 'build/components.js';
        wp_register_script( 'try-aura-components', $components_script_url, $deps, $version, true );

		$asset_file = plugin_dir_path( __DIR__ ) . 'build/admin/enhancer/index.asset.php';
		$deps       = [ 'wp-element', 'media-views', 'try-aura-components' ];
		$version    = '1.0.0';

		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? $deps;
			// Ensure media-views is present so wp.media is available.
			if ( ! in_array( 'media-views', $deps, true ) ) {
				$deps[] = 'media-views';
			}
			$version = $asset['version'] ?? $version;
		}

		$script_url = plugin_dir_url( __DIR__ ) . 'build/admin/enhancer/index.js';

		wp_register_script( 'try-aura-enhancer', $script_url, $deps, $version, true );

        // Enqueue compiled Tailwind CSS for frontend if available.
        $css_path = plugin_dir_path( __DIR__ ) . 'build/admin/enhancer/style-index.css';
        if ( file_exists( $css_path ) ) {
            $css_url = plugin_dir_url( __DIR__ ) . 'build/admin/enhancer/style-index.css';
            wp_register_style( 'try-aura-enhancer', $css_url, [], filemtime( $css_path ) );
            wp_enqueue_style( 'try-aura-enhancer' );
        }

        $css_path = plugin_dir_path( __DIR__ ) . 'build/style-components.css';
        if ( file_exists( $css_path ) ) {
            $css_url = plugin_dir_url( __DIR__ ) . 'build/style-components.css';
            wp_register_style( 'try-aura-components', $css_url, [], filemtime( $css_path ) );
            wp_enqueue_style( 'try-aura-components' );
        }

		// Pass settings (API key, REST URL, nonce) to the enhancer UI.
		wp_localize_script( 'try-aura-enhancer', 'tryAura', [
			'restUrl'  => esc_url_raw( rest_url() ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'apiKey'   => get_option( 'try_aura_api_key', '' ),
		] );

		wp_enqueue_script( 'try-aura-enhancer' );
		wp_enqueue_script( 'try-aura-components' );
	}
}

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

		$asset_file = plugin_dir_path( __DIR__ ) . 'build/enhancer.asset.php';
		$deps       = [ 'wp-element', 'media-views' ];
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

		$script_url = plugin_dir_url( __DIR__ ) . 'build/enhancer.js';

		wp_register_script( 'try-aura-enhancer', $script_url, $deps, $version, true );

		// Pass settings (API key, REST URL, nonce) to the enhancer UI.
		wp_localize_script( 'try-aura-enhancer', 'tryAura', [
			'restUrl'  => esc_url_raw( rest_url() ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
			'apiKey'   => get_option( 'try_aura_api_key', '' ),
		] );

		wp_enqueue_script( 'try-aura-enhancer' );
	}
}

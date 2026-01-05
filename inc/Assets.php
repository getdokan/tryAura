<?php

namespace Dokan\TryAura;

/**
 * Assets class.
 */
class Assets {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_all_scripts' ), 10 );
	}

	/**
	 * Register all scripts and styles
	 */
	public function register_all_scripts() {
		$styles  = $this->get_styles();
		$scripts = $this->get_scripts();

		$this->register_styles( $styles );
		$this->register_scripts( $scripts );

		do_action( 'tryaura_register_scripts' );
	}

	/**
	 * Get styles.
	 *
	 * @return array
	 */
	private function get_styles() {
		$asset_url  = plugin_dir_url( __DIR__ );
		$asset_path = plugin_dir_path( __DIR__ );
		$styles     = array();

		$css_path = $asset_path . 'build/admin/dashboard/style-index.css';
		if ( file_exists( $css_path ) ) {
			$styles['try-aura-admin'] = array(
				'src'     => $asset_url . 'build/admin/dashboard/style-index.css',
				'deps'    => array('try-aura-components'),
				'version' => filemtime( $css_path ),
			);
		}

		$css_path = $asset_path . 'build/admin/enhancer/style-index.css';
		if ( file_exists( $css_path ) ) {
			$styles['try-aura-enhancer'] = array(
				'src'     => $asset_url . 'build/admin/enhancer/style-index.css',
				'deps'    => array(),
				'version' => filemtime( $css_path ),
			);
		}

		$css_path = $asset_path . 'build/style-components.css';
		if ( file_exists( $css_path ) ) {
			$styles['try-aura-components'] = array(
				'src'     => $asset_url . 'build/style-components.css',
				'deps'    => array(),
				'version' => filemtime( $css_path ),
			);
		}

		$css_path = $asset_path . 'build/frontend/tryon/style-index.css';
		if ( file_exists( $css_path ) ) {
			$styles['try-aura-tryon'] = array(
				'src'     => $asset_url . 'build/frontend/tryon/style-index.css',
				'deps'    => array( 'try-aura-components' ),
				'version' => filemtime( $css_path ),
			);
		}

		return $styles;
	}

	/**
	 * Get scripts.
	 *
	 * @return array
	 */
	public function get_scripts() {
		$asset_url  = plugin_dir_url( __DIR__ );
		$asset_path = plugin_dir_path( __DIR__ );
		$scripts    = array();

		$asset_file = $asset_path . 'build/admin/dashboard/index.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n', 'wp-api' );
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-admin'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/admin/dashboard/index.js',
				'deps'    => $deps,
			);
		}

		$asset_file = $asset_path . 'build/components.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? array( 'wp-element' );
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-components'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/components.js',
				'deps'    => $deps,
			);
		}

		$asset_file = $asset_path . 'build/admin/enhancer/index.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps  = $asset['dependencies'] ?? $deps;
			// Ensure media-views is present so wp.media is available.
			if ( ! in_array( 'media-views', $deps, true ) ) {
				$deps[] = 'media-views';
			}
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-enhancer'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/admin/enhancer/index.js',
				'deps'    => $deps,
			);
		}

		$asset_file = $asset_path . 'build/frontend/tryon/index.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = array_merge( $asset['dependencies'] ?? array(), array( 'wp-element' ) );
			$deps    = array_merge( $deps, array( 'wp-data', 'wp-core-data', 'wp-api-fetch' ) );
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-tryon'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/frontend/tryon/index.js',
				'deps'    => $deps,
			);
		}

		return $scripts;
	}

	/**
	 * Register styles
	 *
	 * @param array $styles Assets to register.
	 *
	 * @return void
	 */
	public function register_styles( $styles ) {
		foreach ( $styles as $handle => $style ) {
			$deps    = isset( $style['deps'] ) ? $style['deps'] : false;
			$version = isset( $style['version'] ) ? $style['version'] : TRYAURA_PLUGIN_VERSION;

			wp_register_style( $handle, $style['src'], $deps, $version );
		}
	}

	/**
	 * Register scripts
	 *
	 * @param array $scripts Assets to register.
	 *
	 * @return void
	 */
	public function register_scripts( $scripts ) {
		foreach ( $scripts as $handle => $script ) {
			$deps      = isset( $script['deps'] ) ? $script['deps'] : false;
			$in_footer = isset( $script['in_footer'] ) ? $script['in_footer'] : true;
			$version   = isset( $script['version'] ) ? $script['version'] : TRYAURA_PLUGIN_VERSION;

			wp_register_script( $handle, $script['src'], $deps, $version, $in_footer );
			wp_set_script_translations( $handle, 'try-aura', plugin_dir_path( TRYAURA_FILE ) . 'languages' );
		}
	}

	/**
	 * Enqueue the scripts
	 *
	 * @param array $scripts Assets to enqueue.
	 *
	 * @return void
	 */
	public function enqueue_scripts( $scripts ) {
		foreach ( $scripts as $handle => $script ) {
			wp_enqueue_script( $handle );
		}
	}
}

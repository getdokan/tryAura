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
		$this->localize_scripts();

		do_action( 'tryaura_register_scripts' );
	}

	/**
	 * Localize scripts with necessary data
	 *
	 * @return void
	 */
	public function localize_scripts() {
		$config = array(
			'aiProviders'       => array(
				'google' => array(
					'veo-3.0-fast-generate-001'      => array(
						'label'        => __( 'veo-3.0-fast-generate-001', 'try-aura' ),
						'identity'     => 'video',
						'inputTypes'   => array( 'text', 'image' ),
						'outputTypes'  => array( 'video' ),
						'supported'    => true,
						'locked'       => false,
						'capabilities' => array(
							'image'        => array(
								'supported' => true,
								'locked'    => false,
							),
							'imageToVideo' => array(
								'supported' => true,
								'locked'    => false,
							),
							'prompt'       => array(
								'supported' => true,
								'locked'    => false,
							),
						),
						'parameters'   => array(
							'aspectRatio'      => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '16:9',
								'values'    => array(
									array(
										'label'  => '16:9',
										'value'  => '16:9',
										'locked' => false,
									),
									array(
										'label'  => '9:16',
										'value'  => '9:16',
										'locked' => false,
									),
								),
							),
							'resolution'       => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '720',
								'values'    => array(
									array(
										'label'  => '720p',
										'value'  => '720',
										'locked' => false,
									),
									array(
										'label'  => '1080p',
										'value'  => '1080',
										'locked' => false,
									),
								),
							),
							'durationSeconds'  => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '8',
								'values'    => array(
									array(
										'label'  => '8 seconds',
										'value'  => '8',
										'locked' => false,
									),
									array(
										'label'  => '6 seconds',
										'value'  => '6',
										'locked' => false,
									),
									array(
										'label'  => '4 seconds',
										'value'  => '4',
										'locked' => false,
									),
								),
							),
							'fps'              => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '24',
								'values'    => array(
									array(
										'label'  => '24 fps',
										'value'  => '24',
										'locked' => false,
									),
								),
							),
							'negativePrompt'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'blurry, low quality, distorted faces',
								'values'    => array(
									'blurry, low quality, distorted faces',
								),
							),
							'seed'             => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '0',
								'values'    => array(
									'0',
								),
							),
							'personGeneration' => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'allow_adult',
								'values'    => array(
									array(
										'label'  => 'Allow Adult',
										'value'  => 'allow_adult',
										'locked' => false,
									),
									array(
										'label'  => 'Disallow',
										'value'  => 'disallow',
										'locked' => false,
									),
								),
							),
							'numberOfVideos'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1',
								'values'    => array(
									array(
										'label'  => '1 video',
										'value'  => '1',
										'locked' => false,
									),
								),
							),
							'enhancePrompt'    => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '',
								'values'    => array(),
							),
							'generateAudio'    => array(
								'supported' => true,
								'locked'    => false,
								'default'   => false,
								'type'      => 'boolean',
							),
						),
					),
					'veo-3.1-fast-generate-001'      => array(
						'label'        => __( 'veo-3.1-fast-generate-001', 'try-aura' ),
						'identity'     => 'video',
						'inputTypes'   => array( 'text', 'image' ),
						'outputTypes'  => array( 'video' ),
						'supported'    => true,
						'locked'       => false,
						'capabilities' => array(
							'image'        => array(
								'supported' => true,
								'locked'    => false,
							),
							'imageToVideo' => array(
								'supported' => true,
								'locked'    => false,
							),
							'prompt'       => array(
								'supported' => true,
								'locked'    => false,
							),
						),
						'parameters'   => array(
							'aspectRatio'      => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '16:9',
								'values'    => array(
									array(
										'label'  => '16:9',
										'value'  => '16:9',
										'locked' => false,
									),
									array(
										'label'  => '9:16',
										'value'  => '9:16',
										'locked' => false,
									),
								),
							),
							'resolution'       => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '720',
								'values'    => array(
									array(
										'label'  => '720p',
										'value'  => '720',
										'locked' => false,
									),
									array(
										'label'  => '1080p',
										'value'  => '1080',
										'locked' => false,
									),
								),
							),
							'durationSeconds'  => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '8',
								'values'    => array(
									array(
										'label'  => '8 seconds',
										'value'  => '8',
										'locked' => false,
									),
									array(
										'label'  => '6 seconds',
										'value'  => '6',
										'locked' => false,
									),
									array(
										'label'  => '4 seconds',
										'value'  => '4',
										'locked' => false,
									),
								),
							),
							'fps'              => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '24',
								'values'    => array(
									array(
										'label'  => '24 fps',
										'value'  => '24',
										'locked' => false,
									),
								),
							),
							'negativePrompt'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'blurry, low quality, distorted faces',
								'values'    => array(
									'blurry, low quality, distorted faces',
								),
							),
							'seed'             => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '0',
								'values'    => array(
									'0',
								),
							),
							'personGeneration' => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'allow_adult',
								'values'    => array(
									array(
										'label'  => 'Allow Adult',
										'value'  => 'allow_adult',
										'locked' => false,
									),
									array(
										'label'  => 'Disallow',
										'value'  => 'disallow',
										'locked' => false,
									),
								),
							),
							'numberOfVideos'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1',
								'values'    => array(
									array(
										'label'  => '1 video',
										'value'  => '1',
										'locked' => false,
									),
								),
							),
							'enhancePrompt'    => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '',
								'values'    => array(),
							),
							'generateAudio'    => array(
								'supported' => true,
								'locked'    => false,
								'default'   => false,
								'type'      => 'boolean',
							),
						),
					),
					'gemini-2.5-flash-image-preview' => array(
						'label'        => __( 'gemini-2.5-flash-image-preview', 'try-aura' ),
						'identity'     => 'image',
						'inputTypes'   => array( 'text', 'image' ),
						'outputTypes'  => array( 'image' ),
						'supported'    => true,
						'locked'       => false,
						'capabilities' => array(
							'image'  => array(
								'supported' => true,
								'locked'    => false,
							),
							'prompt' => array(
								'supported' => true,
								'locked'    => false,
							),
						),
						'parameters'   => array(
							'aspectRatio'      => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1:1',
								'values'    => array(
									array(
										'label'  => __( '1:1', 'try-aura' ),
										'value'  => '1:1',
										'locked' => false,
									),
									array(
										'label'  => __( '16:9', 'try-aura' ),
										'value'  => '16:9',
										'locked' => false,
									),
									array(
										'label'  => __( '9:16', 'try-aura' ),
										'value'  => '9:16',
										'locked' => false,
									),
									array(
										'label'  => __( '4:3', 'try-aura' ),
										'value'  => '4:3',
										'locked' => false,
									),
									array(
										'label'  => __( '3:4', 'try-aura' ),
										'value'  => '3:4',
										'locked' => false,
									),
								),
							),
							'personGeneration' => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'allow_adult',
								'values'    => array(
									array(
										'label'  => __( 'Allow Adult', 'try-aura' ),
										'value'  => 'allow_adult',
										'locked' => false,
									),
									array(
										'label'  => __( 'Disallow', 'try-aura' ),
										'value'  => 'disallow',
										'locked' => false,
									),
								),
							),
							'candidateCount'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1',
								'values'    => array(
									array(
										'label'  => __( '1 image', 'try-aura' ),
										'value'  => '1',
										'locked' => false,
									),
								),
							),
						),
					),
					'gemini-2.5-flash-image'         => array(
						'label'        => __( 'gemini-2.5-flash-image', 'try-aura' ),
						'identity'     => 'image',
						'inputTypes'   => array( 'text', 'image' ),
						'outputTypes'  => array( 'image' ),
						'supported'    => true,
						'locked'       => false,
						'capabilities' => array(
							'image'  => array(
								'supported' => true,
								'locked'    => false,
							),
							'prompt' => array(
								'supported' => true,
								'locked'    => false,
							),
						),
						'parameters'   => array(
							'aspectRatio'      => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1:1',
								'values'    => array(
									array(
										'label'  => __( '1:1', 'try-aura' ),
										'value'  => '1:1',
										'locked' => false,
									),
									array(
										'label'  => __( '16:9', 'try-aura' ),
										'value'  => '16:9',
										'locked' => false,
									),
									array(
										'label'  => __( '9:16', 'try-aura' ),
										'value'  => '9:16',
										'locked' => false,
									),
									array(
										'label'  => __( '4:3', 'try-aura' ),
										'value'  => '4:3',
										'locked' => false,
									),
									array(
										'label'  => __( '3:4', 'try-aura' ),
										'value'  => '3:4',
										'locked' => false,
									),
								),
							),
							'personGeneration' => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'allow_adult',
								'values'    => array(
									array(
										'label'  => __( 'Allow Adult', 'try-aura' ),
										'value'  => 'allow_adult',
										'locked' => false,
									),
									array(
										'label'  => __( 'Disallow', 'try-aura' ),
										'value'  => 'disallow',
										'locked' => false,
									),
								),
							),
							'candidateCount'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1',
								'values'    => array(
									array(
										'label'  => __( '1 image', 'try-aura' ),
										'value'  => '1',
										'locked' => false,
									),
								),
							),
						),
					),
					'gemini-3-pro-image-preview'     => array(
						'label'        => __( 'gemini-3-pro-image-preview', 'try-aura' ),
						'identity'     => 'image',
						'inputTypes'   => array( 'text', 'image' ),
						'outputTypes'  => array( 'image' ),
						'supported'    => true,
						'locked'       => false,
						'capabilities' => array(
							'image'  => array(
								'supported' => true,
								'locked'    => false,
							),
							'prompt' => array(
								'supported' => true,
								'locked'    => false,
							),
						),
						'parameters'   => array(
							'aspectRatio'      => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1:1',
								'values'    => array(
									array(
										'label'  => __( '1:1', 'try-aura' ),
										'value'  => '1:1',
										'locked' => false,
									),
									array(
										'label'  => __( '16:9', 'try-aura' ),
										'value'  => '16:9',
										'locked' => false,
									),
									array(
										'label'  => __( '9:16', 'try-aura' ),
										'value'  => '9:16',
										'locked' => false,
									),
									array(
										'label'  => __( '4:3', 'try-aura' ),
										'value'  => '4:3',
										'locked' => false,
									),
									array(
										'label'  => __( '3:4', 'try-aura' ),
										'value'  => '3:4',
										'locked' => false,
									),
								),
							),
							'personGeneration' => array(
								'supported' => true,
								'locked'    => false,
								'default'   => 'allow_adult',
								'values'    => array(
									array(
										'label'  => __( 'Allow Adult', 'try-aura' ),
										'value'  => 'allow_adult',
										'locked' => false,
									),
									array(
										'label'  => __( 'Disallow', 'try-aura' ),
										'value'  => 'disallow',
										'locked' => false,
									),
								),
							),
							'candidateCount'   => array(
								'supported' => true,
								'locked'    => false,
								'default'   => '1',
								'values'    => array(
									array(
										'label'  => __( '1 image', 'try-aura' ),
										'value'  => '1',
										'locked' => false,
									),
								),
							),
						),
					),
				),
			),
			'defaultProvider'   => 'google',
			'defaultImageModel' => 'gemini-2.5-flash-image',
			'defaultVideoModel' => 'veo-3.0-fast-generate-001',
		);

		wp_localize_script( 'try-aura-ai-models', 'tryAuraAiProviderModels', apply_filters( 'tryaura_ai_models', $config ) );
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
				'deps'    => array( 'wp-components', 'try-aura-components' ),
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

		return apply_filters( 'tryaura_styles', $styles );
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

		$asset_file = $asset_path . 'build/data/settings.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? array( 'wp-data' );
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-settings'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/data/settings.js',
				'deps'    => $deps,
			);
		}

		$asset_file = $asset_path . 'build/admin/dashboard/index.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n', 'wp-api', 'try-aura-settings' );
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

		$asset_file = $asset_path . 'build/data/ai-models.asset.php';
		if ( file_exists( $asset_file ) ) {
			$asset   = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
			$deps    = $asset['dependencies'] ?? array( 'wp-data' );
			$version = $asset['version'] ?? '1.0.0';

			$scripts['try-aura-ai-models'] = array(
				'version' => $version,
				'src'     => $asset_url . 'build/data/ai-models.js',
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

		return apply_filters( 'tryaura_scripts', $scripts );
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

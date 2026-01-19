<?php

namespace Dokan\TryAura;

use Dokan\TryAura\Common\Installer;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Plugin class.
 */
class Plugin {
	/**
	 * Plugin version
	 *
	 * @var string
	 */
	public $version = '1.0.0';

	/**
	 * Bootstraps the plugin.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'load_textdomain' ) );
		register_activation_hook( TRYAURA_FILE, array( Installer::class, 'activate' ) );
		$this->define_constants();
		add_action( 'plugins_loaded', array( $this, 'init_plugin' ) );
	}

	/**
	 * Load plugin textdomain.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'try-aura',
			false,
			dirname( plugin_basename( TRYAURA_FILE ) ) . '/languages/'
		);
	}

	/**
	 * Define all constants
	 *
	 * @return void
	 */
	public function define_constants() {
		defined( 'TRYAURA_PLUGIN_VERSION' ) || define( 'TRYAURA_PLUGIN_VERSION', $this->version );
		defined( 'TRYAURA_INC_DIR' ) || define( 'TRYAURA_INC_DIR', TRYAURA_DIR . '/inc' );
		defined( 'TRYAURA_PLUGIN_ASSEST' ) || define( 'TRYAURA_PLUGIN_ASSEST', plugins_url( 'build', TRYAURA_FILE ) );
	}

	/**
	 * Initialize the plugin once all plugins are loaded.
	 */
	public function init_plugin(): void {
		$container = tryaura_get_container();

		// Register custom REST endpoints.
		if ( $container->has( 'settings_controller' ) ) {
			$container->get( 'settings_controller' );
		}
		if ( $container->has( 'generate_controller' ) ) {
			$container->get( 'generate_controller' );
		}
		if ( $container->has( 'dashboard_controller' ) ) {
			$container->get( 'dashboard_controller' );
		}
		if ( $container->has( 'video_thumbnail_controller' ) ) {
			$container->get( 'video_thumbnail_controller' );
		}

		// Register assets.
		if ( $container->has( 'assets' ) ) {
			$container->get( 'assets' );
		}

		// WooCommerce integrations.
		if ( $container->has( 'woocommerce' ) ) {
			$container->get( 'woocommerce' );
		}
		if ( $container->has( 'product_video_gallery' ) ) {
			$container->get( 'product_video_gallery' );
		}

		if ( is_admin() ) {
			if ( $container->has( 'admin' ) ) {
				$container->get( 'admin' );
			}
			// Register the Featured Image Enhancer UI assets.
			if ( $container->has( 'enhancer' ) ) {
				$container->get( 'enhancer' );
			}
			if ( $container->has( 'product_gallery_video' ) ) {
				$container->get( 'product_gallery_video' );
			}
		}

		add_filter( 'rest_post_dispatch', array( $this, 'add_wc_existence_header' ), 10, 3 );

		/**
		 * Action to signal that WooCommerce has finished loading.
		 *
		 * @since PLUGIN_SINCE
		 */
		do_action( 'tryaura_loaded' );
	}

	/**
	 * Add WooCommerce existence header to plugin REST responses.
	 *
	 * @param mixed $response The response object.
	 * @param mixed $server   Server instance.
	 * @param mixed $request  The request object.
	 *
	 * @return mixed
	 */
	public function add_wc_existence_header( $response, $server, $request ) {
		if ( ! ( $response instanceof \WP_REST_Response ) ) {
			return $response;
		}

		$route = $request->get_route();

		if ( strpos( $route, 'try-aura/v1' ) !== false || strpos( $route, 'generate/v1' ) !== false ) {
			$response->header( 'X-Try-Aura-WC-Exists', class_exists( 'WooCommerce' ) ? 'true' : 'false' );
		}

		return $response;
	}
}

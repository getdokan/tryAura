<?php

namespace Dokan\TryAura;

use Dokan\TryAura\Common\Installer;
use Dokan\TryAura\DependencyManagement\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Plugin class.
 *
 * @since PLUGIN_SINCE
 */
class Plugin {
	/**
	 * Plugin version
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string
	 */
	private $version = '1.0.0';
	private Container $container;

	/**
	 * Bootstraps the plugin.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		$this->container = TryAura::container();
		register_activation_hook( TRYAURA_FILE, array( Installer::class, 'activate' ) );
		$this->define_constants();
		add_action( 'plugins_loaded', array( $this, 'load_container' ) );
		add_action( 'init', array( $this, 'init_classes') );
	}

	/**
	 * Define all constants
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return void
	 */
	public function define_constants() {
		defined( 'TRYAURA_PLUGIN_VERSION' ) || define( 'TRYAURA_PLUGIN_VERSION', $this->version );
	}

	public function load_container() {
		$this->container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\CommonServiceProvider() );
		$this->container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\AdminServiceProvider() );
		$this->container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\FrontendServiceProvider() );
		$this->container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\WooCommerceServiceProvider() );
		$this->container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\RestServiceProvider() );

		/**
		 * Action to signal that WooCommerce has finished loading.
		 *
		 * @since PLUGIN_SINCE
		 */
		do_action( 'tryaura_loaded', $this->container );
	}

	public function init_classes() {
		do_action( 'tryaura_classes_loaded_before', $this->container );

		// Register custom REST endpoints.
		if ( $this->container->has( 'settings_controller' ) ) {
			$this->container->get( 'settings_controller' );
		}
		if ( $this->container->has( 'generate_controller' ) ) {
			$this->container->get( 'generate_controller' );
		}
		if ( $this->container->has( 'dashboard_controller' ) ) {
			$this->container->get( 'dashboard_controller' );
		}
		if ( $this->container->has( 'video_thumbnail_controller' ) ) {
			$this->container->get( 'video_thumbnail_controller' );
		}
		if ( $this->container->has( 'product_controller' ) ) {
			$this->container->get( 'product_controller' );
		}

		// Register assets.
		if ( $this->container->has( 'assets' ) ) {
			$this->container->get( 'assets' );
		}

		// WooCommerce integrations.
		if ( $this->container->has( 'woocommerce' ) ) {
			$this->container->get( 'woocommerce' );
		}
		if ( $this->container->has( 'frontend_product_video' ) ) {
			$this->container->get( 'frontend_product_video' );
		}
		if ( $this->container->has( 'try_on' ) ) {
			$this->container->get( 'try_on' );
		}

		if ( is_admin() ) {
			if ( $this->container->has( 'admin' ) ) {
				$this->container->get( 'admin' );
			}
			// Register the Featured Image Enhancer UI assets.
			if ( $this->container->has( 'enhancer' ) ) {
				$this->container->get( 'enhancer' );
			}
			if ( $this->container->has( 'admin_product_video' ) ) {
				$this->container->get( 'admin_product_video' );
			}
		}

		add_filter( 'rest_post_dispatch', array( $this, 'add_wc_existence_header' ), 10, 3 );

		/**
		 * Action to signal that try-aura has finished loading.
		 *
		 * @since PLUGIN_SINCE
		 */
		do_action( 'tryaura_classes_loaded', $this->container );
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
			$response->header( 'X-Try-Aura-WC-Exists', class_exists( 'WooCommerce' )? 'true' : 'false' );
		}

		return $response;
	}
}

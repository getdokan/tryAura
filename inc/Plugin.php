<?php

namespace Dokan\TryAura;

use Dokan\TryAura\Rest\SettingsController;
use Dokan\TryAura\Rest\GenerateController;
use Dokan\TryAura\Rest\DashboardController;
use Dokan\TryAura\Installer;

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
		register_activation_hook( TRYAURA_FILE, array( Installer::class, 'activate' ) );
		$this->define_constants();
		add_action( 'plugins_loaded', array( $this, 'init_plugin' ) );
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
		// Register custom REST endpoints.
		new SettingsController( 'try_aura_api_key' );
		new GenerateController();
		new DashboardController();

		// Register assets.
		new Assets();

		// WooCommerce integrations.
		new WooCommerce();

		if ( is_admin() ) {
			new Admin();
			// Register the Featured Image Enhancer UI assets.
			new Enhancer();
		}
	}
}

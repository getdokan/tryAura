<?php
/**
 * Plugin Name:       TryAura
 * Description:       TryAura is an AI-powered virtual try-on and content creation platform built for fashion and eCommerce. With seamless WooCommerce integration, it allows brands and shoppers to instantly visualize clothing on models, customers, or in any scene — without costly photoshoots. From product images to lifestyle videos, TryAura helps online stores boost engagement, reduce returns, and elevate their shopping experience with cutting-edge AI.
 * Version:           1.0.0
 * Requires at least: 6.8
 * Requires PHP:      8.0
 * Author:            TryAura
 * Text Domain:       try-aura
 * Domain Path:       /languages
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

require_once __DIR__ . '/vendor/autoload.php';

// Use the necessary namespace.
use Dokan\TryAura\DependencyManagement\Container;

// Declare the $try_aura_container as global to access from the inside of the function.
global $try_aura_container;

// Instantiate the container.
$try_aura_container = new Container();

// Register the service providers.
$try_aura_container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\CommonServiceProvider() );
$try_aura_container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\AdminServiceProvider() );
$try_aura_container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\FrontendServiceProvider() );
$try_aura_container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\WooCommerceServiceProvider() );
$try_aura_container->addServiceProvider( new \Dokan\TryAura\DependencyManagement\Providers\RestServiceProvider() );

/**
 * Get the container.
 *
 * @return Container The global container instance.
 */
function tryaura_get_container(): Container {
	global $try_aura_container;

	return $try_aura_container;
}

// Define constant for the Plugin file.
defined( 'TRYAURA_FILE' ) || define( 'TRYAURA_FILE', __FILE__ );
defined( 'TRYAURA_DIR' ) || define( 'TRYAURA_DIR', __DIR__ );

new Dokan\TryAura\Plugin();

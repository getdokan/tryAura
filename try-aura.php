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

// Define constant for the Plugin file.
defined( 'TRYAURA_FILE' ) || define( 'TRYAURA_FILE', __FILE__ );
defined( 'TRYAURA_DIR' ) || define( 'TRYAURA_DIR', __DIR__ );
defined( 'TRYAURA_INC_DIR' ) || define( 'TRYAURA_INC_DIR', TRYAURA_DIR . '/inc' );
defined( 'TRYAURA_PLUGIN_ASSEST' ) || define( 'TRYAURA_PLUGIN_ASSEST', plugins_url( 'build', TRYAURA_FILE ) );

new Dokan\TryAura\Plugin();

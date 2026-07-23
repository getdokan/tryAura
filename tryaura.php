<?php
/**
 * Plugin Name:       TryAura: AI Virtual Try-On, Product Visualization & Product Videos for WooCommerce
 * Description:       Turn basic product photos into realistic photos, videos, and virtual try-ons that help WooCommerce shoppers buy with confidence.
 * Version:           1.0.4
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            weDevs
 * Author URI:        https://wedevs.com
 * Text Domain:       tryaura
 * Domain Path:       /languages
 * WC tested up to:   10.7.0
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

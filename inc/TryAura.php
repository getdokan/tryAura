<?php

namespace Dokan\TryAura;

use Dokan\TryAura\DependencyManagement\Container;

/**
 * TryAura Container Class.
 *
 * @since PLUGIN_SINCE
 */
final class TryAura {

	/**
	 * Holds the container instance, initialized to null.
	 *
	 * @since PLUGIN_SINCE
	 */
	private static ?Container $container = null;

	/**
	 * Returns the shared instance of the Container.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return Container The shared Container instance.
	 */
	public static function container(): Container {
		if (! self::$container) {
			self::$container = new Container();
		}

		return self::$container;
	}

	/**
	 * Checks if WooCommerce is active by verifying the existence of its main class.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return bool Returns true if the WooCommerce class exists, indicating WooCommerce is active; otherwise, false.
	 */
	public static function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' );
	}
}

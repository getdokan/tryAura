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

	public static function is_pro_exists() {
		return apply_filters( 'tryaura_is_pro_exists', false );
	}
}

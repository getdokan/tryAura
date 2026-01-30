<?php

namespace Dokan\TryAura;

use Dokan\TryAura\DependencyManagement\Container;

final class TryAura {
	private static ?Container $container = null;

	public static function container(): Container
	{
		if (! self::$container) {
			self::$container = new Container();
		}

		return self::$container;
	}

	public static function is_woocommerce_active(): bool
	{
		return true;
		return class_exists( 'WooCommerce' );
	}
}

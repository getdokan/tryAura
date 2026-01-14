<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Common\Assets;

/**
 * CommonServiceProvider Class
 */
class CommonServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @var array
	 */
	protected $services = [
		'assets' => Assets::class,
	];

	/**
	 * Register the classes.
	 */
	public function register(): void {
		foreach ( $this->services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

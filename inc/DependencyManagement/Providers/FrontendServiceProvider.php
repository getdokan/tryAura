<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;

/**
 * FrontendServiceProvider Class
 */
class FrontendServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @var array
	 */
	protected $services = [];

	/**
	 * {@inheritDoc}
	 */
	public function provides( string $alias ): bool {
		return ! is_admin() && parent::provides( $alias );
	}

	/**
	 * Register the classes.
	 */
	public function register(): void {
		foreach ( $this->services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

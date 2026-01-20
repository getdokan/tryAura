<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;

/**
 * FrontendServiceProvider Class
 *
 * @since PLUGIN_SINCE
 */
class FrontendServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected $services = [];

	/**
	 * {@inheritDoc}
	 *
	 * @since PLUGIN_SINCE
	 */
	public function provides( string $alias ): bool {
		return ! is_admin() && parent::provides( $alias );
	}

	/**
	 * Register the classes.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function register(): void {
		foreach ( $this->services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;

/**
 * FrontendServiceProvider Class
 *
 * @since 1.0.0
 */
class FrontendServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $services = [];

	/**
	 * {@inheritDoc}
	 *
	 * @since 1.0.0
	 */
	public function provides( string $alias ): bool {
		return ! is_admin() && parent::provides( $alias );
	}

	/**
	 * Register the classes.
	 *
	 * @since 1.0.0
	 */
	public function register(): void {
		$filtered_services = apply_filters( 'tryaura_frontend_container_services', $this->services );
		foreach ( $filtered_services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

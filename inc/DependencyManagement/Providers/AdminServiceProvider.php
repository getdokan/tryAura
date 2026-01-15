<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Admin\Admin;
use Dokan\TryAura\Admin\Enhancer;

/**
 * AdminServiceProvider Class
 */
class AdminServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @var array
	 */
	protected $services = [
		'admin'    => Admin::class,
		'enhancer' => Enhancer::class,
	];

	/**
	 * {@inheritDoc}
	 */
	public function provides( string $alias ): bool {
		return is_admin() && parent::provides( $alias );
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

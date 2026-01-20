<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Admin\Admin;
use Dokan\TryAura\Admin\Enhancer;

/**
 * AdminServiceProvider Class
 *
 * @since PLUGIN_SINCE
 */
class AdminServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected $services = [
		'admin'    => Admin::class,
		'enhancer' => Enhancer::class,
	];

	/**
	 * {@inheritDoc}
	 *
	 * @since PLUGIN_SINCE
	 */
	public function provides( string $alias ): bool {
		return is_admin() && parent::provides( $alias );
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

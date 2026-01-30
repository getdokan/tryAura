<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Admin\Admin;
use Dokan\TryAura\Admin\Enhancer;

/**
 * AdminServiceProvider Class
 *
 * @since 1.0.0
 */
class AdminServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $services = [
		'admin'    => Admin::class,
		'enhancer' => Enhancer::class,
	];

	/**
	 * Register the classes.
	 *
	 * @since 1.0.0
	 */
	public function register(): void {
		$filtered_services = apply_filters( 'tryaura_admin_container_services', $this->services );
		foreach ( $filtered_services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Rest\SettingsController;
use Dokan\TryAura\Rest\GenerateController;
use Dokan\TryAura\Rest\DashboardController;

/**
 * RestServiceProvider Class
 */
class RestServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @var array
	 */
	protected $services = [
		'settings_controller'  => SettingsController::class,
		'generate_controller'  => GenerateController::class,
		'dashboard_controller' => DashboardController::class,
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

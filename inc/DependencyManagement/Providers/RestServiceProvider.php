<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Rest\SettingsController;
use Dokan\TryAura\Rest\GenerateController;
use Dokan\TryAura\Rest\DashboardController;
use Dokan\TryAura\Rest\VideoThumbnailController;

/**
 * RestServiceProvider Class
 *
 * @since PLUGIN_SINCE
 */
class RestServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected $services = [
		'settings_controller'        => SettingsController::class,
		'generate_controller'        => GenerateController::class,
		'dashboard_controller'       => DashboardController::class,
		'video_thumbnail_controller' => VideoThumbnailController::class,
	];

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

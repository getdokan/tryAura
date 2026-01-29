<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Rest\SettingsController;
use Dokan\TryAura\Rest\GenerateController;
use Dokan\TryAura\Rest\DashboardController;
use Dokan\TryAura\Rest\VideoThumbnailController;
use Dokan\TryAura\Rest\ProductController;

/**
 * RestServiceProvider Class
 *
 * @since 1.0.0
 */
class RestServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $services = [
		'settings_controller'        => SettingsController::class,
		'generate_controller'        => GenerateController::class,
		'dashboard_controller'       => DashboardController::class,
		'video_thumbnail_controller' => VideoThumbnailController::class,
		'product_controller'         => ProductController::class,
	];

	/**
	 * Register the classes.
	 *
	 * @since 1.0.0
	 */
	public function register(): void {
		$filtered_services = apply_filters( 'tryaura_rest_container_services', $this->services );
		foreach ( $filtered_services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

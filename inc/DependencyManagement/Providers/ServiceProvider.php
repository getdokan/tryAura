<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BootableServiceProvider;

/**
 * ServiceProvider Class
 */
class ServiceProvider extends BootableServiceProvider {

	/**
	 * Tag for services added to the container.
	 */
	public const TAG = 'container-service';

	/**
	 * The services provided by this provider.
	 *
	 * @var array
	 */
	protected $services = [
		'assets'                => \Dokan\TryAura\Assets::class,
		'woocommerce'           => \Dokan\TryAura\WooCommerce::class,
		'generate_controller'   => \Dokan\TryAura\Rest\GenerateController::class,
		'dashboard_controller'  => \Dokan\TryAura\Rest\DashboardController::class,
		'product_video_gallery' => \Dokan\TryAura\Frontend\ProductVideoGallery::class,
		'admin'                 => \Dokan\TryAura\Admin::class,
		'enhancer'              => \Dokan\TryAura\Enhancer::class,
		'product_gallery_video' => \Dokan\TryAura\Admin\ProductGalleryVideo::class,
	];

	/**
	 * Register the classes.
	 */
	public function register(): void {
		foreach ( $this->services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name )->addTag( self::TAG );
		}

		$this->getContainer()->addShared( 'settings_controller', \Dokan\TryAura\Rest\SettingsController::class )
			->addArgument( 'try_aura_settings' )
			->addTag( self::TAG );
	}

	/**
	 * Boot the service provider.
	 */
	public function boot(): void {
		// You can add more service providers here if needed.
	}
}

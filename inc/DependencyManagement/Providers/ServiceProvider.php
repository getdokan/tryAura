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
		'settings_controller'   => \Dokan\TryAura\Rest\SettingsController::class,
		'generate_controller'   => \Dokan\TryAura\Rest\GenerateController::class,
		'dashboard_controller'  => \Dokan\TryAura\Rest\DashboardController::class,
		'product_video_gallery' => \Dokan\TryAura\Frontend\ProductVideoGallery::class,
		'admin'                 => \Dokan\TryAura\Admin::class,
		'enhancer'              => \Dokan\TryAura\Enhancer::class,
		'product_gallery_video' => \Dokan\TryAura\Admin\ProductGalleryVideo::class,
	];

	/**
	 * Check if the service provider can provide the given service alias.
	 *
	 * @param string $alias
	 *
	 * @return bool
	 */
	public function provides( string $alias ): bool {
		if ( isset( $this->services[ $alias ] ) ) {
			return true;
		}

		return parent::provides( $alias );
	}

	/**
	 * Register the classes.
	 */
	public function register(): void {
		foreach ( $this->services as $key => $class_name ) {
			$definition = $this->getContainer()->addShared( $key, $class_name )->addTag( self::TAG );

			if ( 'settings_controller' === $key ) {
				$definition->addArgument( 'try_aura_settings' );
			}
		}
	}

	/**
	 * Boot the service provider.
	 */
	public function boot(): void {
		// You can add more service providers here if needed.
	}
}

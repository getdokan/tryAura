<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\TryAura;
use Dokan\TryAura\WooCommerce\Frontend\TryOn;
use Dokan\TryAura\WooCommerce\WooCommerce;
use Dokan\TryAura\WooCommerce\Admin\ProductGalleryVideo as AdminProductVideo;
use Dokan\TryAura\WooCommerce\Frontend\ProductVideoGallery as FrontendProductVideo;

/**
 * WooCommerceServiceProvider Class
 *
 * @since PLUGIN_SINCE
 */
class WooCommerceServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected $services = [
		'woocommerce'           => WooCommerce::class,
		'admin_product_video' => AdminProductVideo::class,
		'frontend_product_video' => FrontendProductVideo::class,
		'try_on'                => TryOn::class,
	];

	/**
	 * {@inheritDoc}
	 *
	 * @since PLUGIN_SINCE
	 */
	public function provides( string $alias ): bool {
		return TryAura::is_woocommerce_active()&& parent::provides( $alias );
	}

	/**
	 * Register the classes.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function register(): void {
		$filtered_services = apply_filters( 'tryaura_woocommerce_container_services', $this->services );
		foreach ( $filtered_services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
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
		'product_gallery_video' => AdminProductVideo::class,
		'product_video_gallery' => FrontendProductVideo::class,
	];

	/**
	 * {@inheritDoc}
	 *
	 * @since PLUGIN_SINCE
	 */
	public function provides( string $alias ): bool {
		return class_exists( 'WooCommerce' ) && parent::provides( $alias );
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

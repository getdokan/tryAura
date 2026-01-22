<?php

namespace Dokan\TryAura\DependencyManagement\Providers;

use Dokan\TryAura\DependencyManagement\BaseServiceProvider;
use Dokan\TryAura\Common\Assets;

/**
 * CommonServiceProvider Class
 *
 * @since PLUGIN_SINCE
 */
class CommonServiceProvider extends BaseServiceProvider {

	/**
	 * The services provided by this provider.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected $services = [
		'assets' => Assets::class,
	];

	/**
	 * Register the classes.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function register(): void {
		$filtered_services = apply_filters( 'tryaura_common_container_services', $this->services );
		foreach ( $filtered_services as $key => $class_name ) {
			$this->getContainer()->addShared( $key, $class_name );
		}
	}
}

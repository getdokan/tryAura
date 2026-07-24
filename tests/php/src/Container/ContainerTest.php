<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Container;

use Dokan\TryAura\Rest\PromotionController;
use Dokan\TryAura\Test\TryAuraTestCase;
use Dokan\TryAura\TryAura;

/**
 * The service container wires up the plugin's services.
 *
 * @covers \Dokan\TryAura\Plugin
 */
class ContainerTest extends TryAuraTestCase {

	public function test_rest_controllers_are_registered(): void {
		$container = TryAura::container();

		foreach ( array( 'settings_controller', 'generate_controller', 'dashboard_controller', 'product_controller', 'promotion_controller', 'video_thumbnail_controller' ) as $service ) {
			$this->assertTrue( $container->has( $service ), "Container is missing service: {$service}" );
		}
	}

	public function test_admin_services_are_registered(): void {
		$container = TryAura::container();

		foreach ( array( 'admin', 'enhancer', 'promotion' ) as $service ) {
			$this->assertTrue( $container->has( $service ), "Container is missing service: {$service}" );
		}
	}

	public function test_a_service_resolves_to_its_class(): void {
		$this->assertInstanceOf(
			PromotionController::class,
			TryAura::container()->get( 'promotion_controller' )
		);
	}
}

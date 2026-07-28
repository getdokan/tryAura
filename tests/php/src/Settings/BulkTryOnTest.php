<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Settings;

use Dokan\TryAura\Test\TryAuraTestCase;
use WC_Product_Simple;

/**
 * The bulk try-on toggle (SettingsController::bulk_try_on) — WooCommerce-gated.
 *
 * @covers \Dokan\TryAura\Rest\SettingsController
 */
class BulkTryOnTest extends TryAuraTestCase {

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	private function create_published_product( string $name ): void {
		$product = new WC_Product_Simple();
		$product->set_name( $name );
		$product->set_status( 'publish' );
		$product->save();
	}

	public function test_reports_no_products_when_catalog_empty(): void {
		$response = $this->dispatch( 'POST', '/tryaura/v1/settings/bulk-try-on', array( 'enabled' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( 'No products', $response->get_data()['message'] );
	}

	public function test_queues_all_published_products(): void {
		$this->create_published_product( 'Cap' );
		$this->create_published_product( 'Shirt' );

		$response = $this->dispatch( 'POST', '/tryaura/v1/settings/bulk-try-on', array( 'enabled' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString( '2 products', $response->get_data()['message'] );
	}
}

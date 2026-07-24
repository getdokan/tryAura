<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Rest;

use Dokan\TryAura\Test\TryAuraTestCase;
use WC_Product_Simple;

/**
 * @covers \Dokan\TryAura\Rest\ProductController
 */
class ProductControllerTest extends TryAuraTestCase {

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function test_missing_product_returns_404(): void {
		$response = $this->dispatch( 'GET', '/tryaura/v1/product/999999/images' );

		$this->assertSame( 404, $response->get_status() );
	}

	public function test_returns_the_featured_image(): void {
		$attachment_id = self::factory()->attachment->create_object(
			'featured.jpg',
			0,
			array( 'post_mime_type' => 'image/jpeg' )
		);
		update_post_meta( $attachment_id, '_wp_attached_file', 'featured.jpg' );

		$product = new WC_Product_Simple();
		$product->set_name( 'Red Cap' );
		$product->set_status( 'publish' );
		$product->set_image_id( $attachment_id );
		$product_id = $product->save();

		$response = $this->dispatch( 'GET', "/tryaura/v1/product/{$product_id}/images" );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( (string) $product_id, $data );
		$this->assertStringContainsString( 'featured.jpg', (string) $data[ (string) $product_id ] );
	}
}

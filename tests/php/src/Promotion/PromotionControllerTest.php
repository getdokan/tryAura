<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Promotion;

use Dokan\TryAura\Admin\Promotion;
use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * @covers \Dokan\TryAura\Rest\PromotionController
 */
class PromotionControllerTest extends TryAuraTestCase {

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private $admin;

	public function set_up(): void {
		parent::set_up();

		$this->admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin );
		delete_user_meta( $this->admin, Promotion::BANNER_DISMISSED_META_KEY );
	}

	public function test_dismiss_records_a_timestamp(): void {
		$before = time();

		$response = $this->dispatch( 'POST', '/tryaura/v1/promotion/dismiss-banner' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['dismissed'] );

		$stored = (int) get_user_meta( $this->admin, Promotion::BANNER_DISMISSED_META_KEY, true );
		$this->assertGreaterThanOrEqual( $before, $stored );
	}

	public function test_dismiss_hides_the_banner(): void {
		$this->assertTrue( Promotion::should_show_upgrade_banner() );

		$this->dispatch( 'POST', '/tryaura/v1/promotion/dismiss-banner' );

		$this->assertFalse( Promotion::should_show_upgrade_banner() );
	}

	public function test_dismiss_requires_manage_options(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$response = $this->dispatch( 'POST', '/tryaura/v1/promotion/dismiss-banner' );

		$this->assertSame( 403, $response->get_status() );
	}
}

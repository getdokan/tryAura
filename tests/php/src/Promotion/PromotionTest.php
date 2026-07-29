<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Promotion;

use Dokan\TryAura\Admin\Promotion;
use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * The banner-visibility rules and the plugins-screen action link.
 *
 * @covers \Dokan\TryAura\Admin\Promotion
 */
class PromotionTest extends TryAuraTestCase {

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

	public function tear_down(): void {
		// Always drop the pro-exists override, even if an assertion above threw,
		// so it can't leak into sibling tests.
		remove_filter( 'tryaura_is_pro_exists', '__return_true' );
		parent::tear_down();
	}

	public function test_banner_shows_when_never_dismissed(): void {
		$this->assertTrue( Promotion::should_show_upgrade_banner() );
	}

	public function test_banner_hidden_after_recent_dismissal(): void {
		update_user_meta( $this->admin, Promotion::BANNER_DISMISSED_META_KEY, time() );

		$this->assertFalse( Promotion::should_show_upgrade_banner() );
	}

	public function test_banner_reappears_after_30_days(): void {
		update_user_meta( $this->admin, Promotion::BANNER_DISMISSED_META_KEY, time() - ( 31 * DAY_IN_SECONDS ) );

		$this->assertTrue( Promotion::should_show_upgrade_banner() );
	}

	public function test_banner_hidden_when_pro_active(): void {
		add_filter( 'tryaura_is_pro_exists', '__return_true' );

		$this->assertFalse( Promotion::should_show_upgrade_banner() );

		remove_filter( 'tryaura_is_pro_exists', '__return_true' );
	}

	public function test_action_link_added_when_pro_absent(): void {
		$promotion = new Promotion();

		$links  = $promotion->add_upgrade_action_link( array( 'deactivate' => '<a href="#">Deactivate</a>' ) );
		$joined = implode( '', $links );

		$this->assertStringContainsString( 'Upgrade to Pro', $joined );
		$this->assertStringContainsString( Promotion::UPGRADE_URL, $joined );
	}

	public function test_hooks_registered_only_when_pro_absent(): void {
		$absent = new Promotion();
		$this->assertNotFalse( has_action( 'admin_menu', array( $absent, 'register_upgrade_menu' ) ) );

		add_filter( 'tryaura_is_pro_exists', '__return_true' );
		$active = new Promotion();
		$this->assertFalse( has_action( 'admin_menu', array( $active, 'register_upgrade_menu' ) ) );
		remove_filter( 'tryaura_is_pro_exists', '__return_true' );
	}
}

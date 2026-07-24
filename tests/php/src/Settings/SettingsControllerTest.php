<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Settings;

use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * @covers \Dokan\TryAura\Rest\SettingsController
 */
class SettingsControllerTest extends TryAuraTestCase {

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
		delete_option( 'tryaura_settings' );
	}

	public function test_get_returns_saved_settings(): void {
		update_option( 'tryaura_settings', array( 'google' => array( 'apiKey' => 'saved-key' ) ) );

		$response = $this->dispatch( 'GET', '/tryaura/v1/settings' );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'saved-key', $data['tryaura_settings']['google']['apiKey'] );
	}

	public function test_post_saves_settings(): void {
		$response = $this->dispatch(
			'POST',
			'/tryaura/v1/settings',
			array(
				'tryaura_settings' => array(
					'google' => array(
						'apiKey'     => 'new-key',
						'imageModel' => 'gemini-2.5-flash-image',
					),
				),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$saved = get_option( 'tryaura_settings' );
		$this->assertSame( 'new-key', $saved['google']['apiKey'] );
		$this->assertSame( 'gemini-2.5-flash-image', $saved['google']['imageModel'] );
	}

	public function test_post_sanitizes_input(): void {
		$this->dispatch(
			'POST',
			'/tryaura/v1/settings',
			array(
				'tryaura_settings' => array(
					'google' => array( 'apiKey' => "  key<script>  " ),
				),
			)
		);

		$saved = get_option( 'tryaura_settings' );
		$this->assertStringNotContainsString( '<script>', $saved['google']['apiKey'] );
	}

	public function test_requires_manage_options(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$response = $this->dispatch( 'GET', '/tryaura/v1/settings' );

		$this->assertSame( 403, $response->get_status() );
	}
}

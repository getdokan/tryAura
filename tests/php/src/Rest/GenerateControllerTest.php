<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Rest;

use Dokan\TryAura\Test\GeminiFixtures;
use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * The try-on generation path — the one place PHP calls Gemini. Every case here stubs
 * the API; none spends a token.
 *
 * @covers \Dokan\TryAura\Rest\GenerateController
 */
class GenerateControllerTest extends TryAuraTestCase {

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option(
			'tryaura_settings',
			array(
				'google' => array(
					'apiKey'     => 'test-key',
					'imageModel' => 'gemini-2.5-flash-image',
				),
			)
		);
	}

	private function valid_nonce(): string {
		return wp_create_nonce( 'tryon_nonce' );
	}

	public function test_bad_nonce_is_rejected(): void {
		$response = $this->dispatch(
			'POST',
			'/generate/v1/image',
			array(
				'tryonNonce' => 'not-a-real-nonce',
				'prompt'     => 'a red cap',
			)
		);

		$this->assertSame( 401, $response->get_status() );
	}

	public function test_gemini_error_is_surfaced(): void {
		$this->fake_gemini_error( 400 );

		$response = $this->dispatch(
			'POST',
			'/generate/v1/image',
			array(
				'tryonNonce' => $this->valid_nonce(),
				'prompt'     => 'a red cap',
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'INVALID_ARGUMENT', $data['status'] );
	}

	public function test_successful_generation_returns_image(): void {
		$this->fake_gemini_success();

		$response = $this->dispatch(
			'POST',
			'/generate/v1/image',
			array(
				'tryonNonce' => $this->valid_nonce(),
				'prompt'     => 'a red cap',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( GeminiFixtures::PNG_1X1, $data['image'] );
	}
}

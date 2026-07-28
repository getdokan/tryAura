<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Rest;

use Dokan\TryAura\Test\GeminiFixtures;
use Dokan\TryAura\Test\TryAuraTestCase;

/**
 * Saving a generated video thumbnail (the base64 path — no network).
 *
 * @covers \Dokan\TryAura\Rest\VideoThumbnailController
 */
class VideoThumbnailControllerTest extends TryAuraTestCase {

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		// Keep uploaded files out of the dev site.
		add_filter( 'upload_dir', array( $this, 'redirect_uploads' ) );
	}

	public function redirect_uploads( array $dirs ): array {
		$base = sys_get_temp_dir() . '/tryaura-test-uploads';
		wp_mkdir_p( $base );

		$dirs['path']    = $base;
		$dirs['basedir'] = $base;
		$dirs['url']     = 'http://example.org/wp-content/uploads';
		$dirs['baseurl'] = 'http://example.org/wp-content/uploads';
		$dirs['subdir']  = '';

		return $dirs;
	}

	public function test_saves_base64_thumbnail_as_attachment(): void {
		$response = $this->dispatch(
			'POST',
			'/tryaura/v1/generate-thumbnail',
			array(
				'platform' => 'site',
				'image'    => 'data:image/png;base64,' . GeminiFixtures::PNG_1X1,
				'url'      => 'https://example.com/video.mp4',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertGreaterThan( 0, $data['attachment_id'] );
		$this->assertSame( 'attachment', get_post_type( $data['attachment_id'] ) );
	}

	public function test_requires_edit_products_capability(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$response = $this->dispatch(
			'POST',
			'/tryaura/v1/generate-thumbnail',
			array(
				'platform' => 'site',
				'image'    => 'data:image/png;base64,' . GeminiFixtures::PNG_1X1,
				'url'      => 'https://example.com/video.mp4',
			)
		);

		$this->assertSame( 403, $response->get_status() );
	}
}

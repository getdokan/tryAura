<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAuraPro\Live\Admin\ProductListColumn;
use Dokan\TryAuraPro\Live\Admin\ProductMeta;
use Dokan\TryAuraPro\Live\Product;
use Dokan\TryAuraPro\Live\Settings;

/**
 * Per-product Live Try-On: the independent switch, meta box, list column and bulk job.
 *
 * @group pro
 * @group live-try-on
 *
 * @covers \Dokan\TryAuraPro\Live\Product
 * @covers \Dokan\TryAuraPro\Live\Admin\ProductMeta
 * @covers \Dokan\TryAuraPro\Live\Admin\ProductListColumn
 */
class ProductTest extends LiveTestCase {

	public function set_up(): void {
		parent::set_up();

		$this->as_admin();
	}

	public function tear_down(): void {
		$_POST = array();

		parent::tear_down();
	}

	/**
	 * Submit the meta box for a product.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $fields     Posted fields.
	 * @param bool  $nonce      Whether to include a valid nonce.
	 */
	private function submit_meta_box( int $product_id, array $fields, bool $nonce = true ): void {
		$_POST = $fields;

		if ( $nonce ) {
			$_POST['tryaura_live_product_meta_nonce'] = wp_create_nonce( 'tryaura_live_product_meta' );
		}

		( new ProductMeta() )->save( $product_id );
		$_POST = array();
	}

	public function test_live_is_off_until_switched_on_regardless_of_photo_try_on(): void {
		$product_id = $this->create_product( array( 'live' => null ) )->get_id();
		update_post_meta( $product_id, '_tryaura_try_on_enabled', 'yes' );

		$this->assertFalse( Product::is_enabled( $product_id ) );

		update_post_meta( $product_id, Product::ENABLED_META, 'no' );
		$this->assertFalse( Product::is_enabled( $product_id ) );

		update_post_meta( $product_id, Product::ENABLED_META, 'yes' );
		$this->assertTrue( Product::is_enabled( $product_id ) );

		update_post_meta( $product_id, Product::ENABLED_META, 'true' );
		$this->assertFalse( Product::is_enabled( $product_id ), 'Only the exact value "yes" switches it on.' );
	}

	public function test_toggle_lock_reasons(): void {
		$product  = $this->create_product();
		$no_image = $this->create_product( array( 'image' => false ) );

		$this->assertStringContainsString( 'API key', Product::toggle_disabled_reason( $product ) );

		$this->store_key( Settings::KEY_STATUS_EXPIRED );
		$this->assertStringContainsString( 'expired', Product::toggle_disabled_reason( $product ) );

		$this->store_key( Settings::KEY_STATUS_EXPIRING );
		$this->assertSame( '', Product::toggle_disabled_reason( $product ) );
		$this->assertStringContainsString( 'product image', Product::toggle_disabled_reason( $no_image ) );
		$this->assertStringContainsString( 'product image', Product::toggle_disabled_reason( null ) );

		Settings::pause_for_today();
		$this->assertSame( '', Product::toggle_disabled_reason( $product ), 'A daily pause never locks the toggle.' );
	}

	public function test_meta_box_saves_the_switch_when_it_can_be_changed(): void {
		$this->store_key();
		$product_id = $this->create_product( array( 'live' => null ) )->get_id();

		$this->submit_meta_box(
			$product_id,
			array(
				'tryaura_live_enabled_editable' => '1',
				'tryaura_live_enabled'          => 'yes',
			)
		);
		$this->assertSame( 'yes', get_post_meta( $product_id, Product::ENABLED_META, true ) );

		$this->submit_meta_box( $product_id, array( 'tryaura_live_enabled_editable' => '1' ) );
		$this->assertSame( 'no', get_post_meta( $product_id, Product::ENABLED_META, true ) );
	}

	public function test_locked_switch_is_left_alone_on_save(): void {
		// No key: the checkbox is disabled, so the browser never submits it.
		$product_id = $this->create_product( array( 'live' => null ) )->get_id();
		update_post_meta( $product_id, '_tryaura_try_on_enabled', 'yes' );

		$this->submit_meta_box( $product_id, array( 'tryaura_live_prompt' => 'Anything' ) );

		$this->assertSame( '', get_post_meta( $product_id, Product::ENABLED_META, true ) );
		$this->assertFalse( Product::is_enabled( $product_id ) );
	}

	public function test_meta_box_save_needs_nonce_and_capability(): void {
		$this->store_key();
		$product_id = $this->create_product( array( 'live' => 'no' ) )->get_id();
		$fields     = array(
			'tryaura_live_enabled_editable' => '1',
			'tryaura_live_enabled'          => 'yes',
		);

		$this->submit_meta_box( $product_id, $fields, false );
		$this->assertSame( 'no', get_post_meta( $product_id, Product::ENABLED_META, true ), 'Missing nonce.' );

		$_POST = array_merge( $fields, array( 'tryaura_live_product_meta_nonce' => 'forged' ) );
		( new ProductMeta() )->save( $product_id );
		$this->assertSame( 'no', get_post_meta( $product_id, Product::ENABLED_META, true ), 'Forged nonce.' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->submit_meta_box( $product_id, $fields );
		$this->assertSame( 'no', get_post_meta( $product_id, Product::ENABLED_META, true ), 'No edit capability.' );
	}

	public function test_reference_image_choice(): void {
		$product     = $this->create_product( array( 'gallery' => 2 ) );
		$product_id  = $product->get_id();
		$featured_id = $product->get_image_id();
		$gallery_id  = $product->get_gallery_image_ids()[1];

		$this->submit_meta_box( $product_id, array( 'tryaura_live_reference_image' => (string) $gallery_id ) );
		$this->assertSame( $gallery_id, (int) get_post_meta( $product_id, Product::IMAGE_META, true ) );

		$cases = array(
			'featured image (follows future changes)' => $featured_id,
			'image from another product'              => $this->create_image( 'foreign.jpg' ),
			'zero'                                    => 0,
			'not a number'                            => 'abc',
		);

		foreach ( $cases as $label => $value ) {
			update_post_meta( $product_id, Product::IMAGE_META, $gallery_id );
			$this->submit_meta_box( $product_id, array( 'tryaura_live_reference_image' => (string) $value ) );
			$this->assertSame( '', get_post_meta( $product_id, Product::IMAGE_META, true ), $label );
		}
	}

	public function test_image_tags_keep_only_known_tags_on_product_images(): void {
		$product     = $this->create_product( array( 'gallery' => 2 ) );
		$featured_id = $product->get_image_id();
		list( $first, $second ) = $product->get_gallery_image_ids();
		$foreign     = $this->create_image( 'foreign.jpg' );

		$this->submit_meta_box(
			$product->get_id(),
			array(
				'tryaura_live_image_tags' => array(
					$featured_id => 'on_model',
					$first       => 'flat',
					$second      => 'bogus',
					$foreign     => 'flat',
				),
			)
		);

		$this->assertSame(
			array(
				$featured_id => 'on_model',
				$first       => 'flat',
			),
			Product::image_tags( $product->get_id() )
		);

		$this->submit_meta_box( $product->get_id(), array( 'tryaura_live_image_tags' => array( $first => '' ) ) );
		$this->assertSame( array(), Product::image_tags( $product->get_id() ) );

		$this->submit_meta_box( $product->get_id(), array( 'tryaura_live_image_tags' => 'not-an-array' ) );
		$this->assertSame( array(), Product::image_tags( $product->get_id() ) );
	}

	public function test_prompt_is_stored_only_when_customised(): void {
		$product    = $this->create_product();
		$product_id = $product->get_id();

		$this->submit_meta_box( $product_id, array( 'tryaura_live_prompt' => Product::default_prompt( $product ) ) );
		$this->assertSame( '', get_post_meta( $product_id, Product::PROMPT_META, true ), 'Default is not stored.' );

		$this->submit_meta_box( $product_id, array( 'tryaura_live_prompt' => "  \n " ) );
		$this->assertSame( '', get_post_meta( $product_id, Product::PROMPT_META, true ), 'Blank is not stored.' );

		$this->submit_meta_box( $product_id, array( 'tryaura_live_prompt' => 'Substitute the upper body garment with a <b>red</b> jacket.' ) );
		$this->assertSame( 'Substitute the upper body garment with a red jacket.', get_post_meta( $product_id, Product::PROMPT_META, true ) );

		// The default follows the product title.
		delete_post_meta( $product_id, Product::PROMPT_META );
		$product->set_name( 'Wool Coat' );
		$product->save();
		$this->assertStringContainsString( 'Wool Coat', Product::prompt( wc_get_product( $product_id ) ) );
	}

	public function test_meta_box_render_reflects_state(): void {
		$product = $this->create_product( array( 'gallery' => 2 ) );

		ob_start();
		( new ProductMeta() )->render( get_post( $product->get_id() ) );
		$locked = ob_get_clean();

		$this->assertMatchesRegularExpression( '/name="tryaura_live_enabled"[^>]*checked/', $locked );
		$this->assertMatchesRegularExpression( '/name="tryaura_live_enabled"[^>]*disabled/', $locked );
		$this->assertStringContainsString( 'Add your API key', $locked );
		$this->assertStringNotContainsString( 'tryaura_live_enabled_editable', $locked );
		$this->assertSame( 3, substr_count( $locked, 'name="tryaura_live_reference_image"' ) );

		$this->store_key();
		update_post_meta( $product->get_id(), Product::ENABLED_META, 'no' );

		ob_start();
		( new ProductMeta() )->render( get_post( $product->get_id() ) );
		$editable = ob_get_clean();

		$this->assertDoesNotMatchRegularExpression( '/name="tryaura_live_enabled"[^>]*(checked|disabled)/', $editable );
		$this->assertStringContainsString( 'tryaura_live_enabled_editable', $editable );
	}

	public function test_products_list_column_position(): void {
		$column = new ProductListColumn();

		$after_try_on = $column->add_column(
			array(
				'name'           => 'Name',
				'featured'       => 'Featured',
				'tryaura_try_on' => 'Try-on',
				'date'           => 'Date',
			)
		);
		$this->assertSame( array( 'name', 'featured', 'tryaura_try_on', 'tryaura_live_try_on', 'date' ), array_keys( $after_try_on ) );

		$after_featured = $column->add_column(
			array(
				'name'     => 'Name',
				'featured' => 'Featured',
				'date'     => 'Date',
			)
		);
		$this->assertSame( array( 'name', 'featured', 'tryaura_live_try_on', 'date' ), array_keys( $after_featured ) );

		$appended = $column->add_column( array( 'name' => 'Name' ) );
		$this->assertSame( array( 'name', 'tryaura_live_try_on' ), array_keys( $appended ) );
	}

	public function test_products_list_toggle_is_locked_with_a_reason(): void {
		$product = $this->create_product();

		ob_start();
		( new ProductListColumn() )->render_column( 'tryaura_live_try_on', $product->get_id() );
		$cell = ob_get_clean();

		$this->assertStringContainsString( 'tryaura-toggle-live-try-on', $cell );
		$this->assertStringContainsString( 'disabled', $cell );
		$this->assertStringContainsString( 'API key', $cell );

		ob_start();
		( new ProductListColumn() )->render_column( 'name', $product->get_id() );
		$this->assertSame( '', ob_get_clean(), 'Other columns are left alone.' );
	}

	public function test_live_bulk_needs_a_key_to_enable_and_queues_chunks(): void {
		for ( $i = 0; $i < 23; $i++ ) {
			$this->create_product(
				array(
					'image' => false,
					'live'  => null,
				)
			);
		}
		$this->create_product( array( 'status' => 'draft' ) );

		$refused = $this->dispatch( 'POST', '/tryaura/v1/live/bulk', array( 'enabled' => true ) );
		$this->assertSame( 400, $refused->get_status() );
		$this->assertSame( 'tryaura_live_key_unavailable', $refused->get_data()['code'] );

		// Switching off never needs a key.
		$this->assertSame( 200, $this->dispatch( 'POST', '/tryaura/v1/live/bulk', array( 'enabled' => false ) )->get_status() );
		as_unschedule_all_actions( Product::BULK_HOOK );

		$this->store_key();
		$response = $this->dispatch( 'POST', '/tryaura/v1/live/bulk', array( 'enabled' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 23, $response->get_data()['count'], 'Published products only.' );

		$actions = as_get_scheduled_actions(
			array(
				'hook'     => Product::BULK_HOOK,
				'status'   => \ActionScheduler_Store::STATUS_PENDING,
				'per_page' => -1,
			)
		);
		$this->assertCount( 3, $actions );

		$queued = 0;
		foreach ( $actions as $action ) {
			$args = $action->get_args();
			$this->assertLessThanOrEqual( 10, count( $args['product_ids'] ) );
			$this->assertSame( 'yes', $args['enabled'] );
			$queued += count( $args['product_ids'] );
		}
		$this->assertSame( 23, $queued );

		as_unschedule_all_actions( Product::BULK_HOOK );
	}

	public function test_bulk_with_no_published_products(): void {
		$response = $this->dispatch( 'POST', '/tryaura/v1/live/bulk', array( 'enabled' => false ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $response->get_data()['count'] );
	}

	public function test_live_bulk_job_and_photo_bulk_job_are_independent(): void {
		$product_id = $this->create_product( array( 'live' => null ) )->get_id();

		do_action( 'tryaura_bulk_update_products_try_on', array( $product_id ), 'yes' );
		$this->assertSame( '', get_post_meta( $product_id, Product::ENABLED_META, true ), 'Photo bulk job must not switch Live.' );

		do_action( Product::BULK_HOOK, array( $product_id ), 'yes' );
		$this->assertSame( 'yes', get_post_meta( $product_id, Product::ENABLED_META, true ) );

		do_action( Product::BULK_HOOK, array( $product_id ), 'maybe' );
		$this->assertSame( 'no', get_post_meta( $product_id, Product::ENABLED_META, true ), 'Unknown value switches off.' );
	}
}

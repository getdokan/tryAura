<?php
/**
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test\Pro\LiveTryOn;

use Dokan\TryAura\Database\UsageManager;
use Dokan\TryAura\Test\TryAuraTestCase;
use Dokan\TryAuraPro\Live\KeyVault;
use Dokan\TryAuraPro\Live\Product;
use Dokan\TryAuraPro\Live\REST\SessionController;
use Dokan\TryAuraPro\Live\Settings;
use WC_Product;
use WC_Product_Simple;
use WP_REST_Response;

/**
 * Base for the Live Try-On (TryAura Pro) tests.
 *
 * Runs only when Pro is loaded (`TRYAURA_TEST_PRO=1`). Decart is never called:
 * `fake_decart()` answers every `api.decart.ai` request, and the base class blocks
 * any other outbound HTTP.
 */
abstract class LiveTestCase extends TryAuraTestCase {

	protected const VALID_KEY = 'dct_phpunit_live_key_abcd';

	/**
	 * Requests sent to Decart during the test.
	 *
	 * @var array<int,array{url:string,headers:array,body:array|null,timeout:mixed}>
	 */
	protected array $decart_requests = array();

	/**
	 * Active Decart stub.
	 *
	 * @var callable|null
	 */
	private $decart_stub = null;

	public function set_up(): void {
		parent::set_up();

		if ( ! class_exists( Settings::class ) ) {
			$this->markTestSkipped( 'TryAura Pro is not loaded. Run with TRYAURA_TEST_PRO=1.' );
		}

		delete_option( Settings::OPTION_KEY );

		$this->decart_requests      = array();
		$_SERVER['REMOTE_ADDR']     = '203.0.113.10';
		$_SERVER['HTTP_USER_AGENT'] = 'PHPUnit';
	}

	public function tear_down(): void {
		unset( $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT'] );
		remove_all_filters( 'tryaura_live_rate_limit_per_minute' );
		$this->decart_stub = null;

		parent::tear_down();
	}

	/**
	 * Answer every Decart request with a canned response.
	 *
	 * @param int        $status HTTP status. 0 simulates a network error.
	 * @param array|null $body   Response body.
	 */
	protected function fake_decart( int $status, ?array $body = null ): void {
		if ( $this->decart_stub ) {
			remove_filter( 'pre_http_request', $this->decart_stub, 10 );
		}

		$this->decart_stub = function ( $pre, $args, $url ) use ( $status, $body ) {
			if ( false === strpos( (string) $url, 'api.decart.ai' ) ) {
				return $pre;
			}

			$this->decart_requests[] = array(
				'url'     => (string) $url,
				'headers' => $args['headers'] ?? array(),
				'body'    => json_decode( (string) ( $args['body'] ?? '' ), true ),
				'timeout' => $args['timeout'] ?? null,
			);

			if ( 0 === $status ) {
				return new \WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' );
			}

			return array(
				'response' => array(
					'code'    => $status,
					'message' => '',
				),
				'body'     => wp_json_encode( $body ?? array() ),
				'headers'  => array(),
			);
		};

		add_filter( 'pre_http_request', $this->decart_stub, 10, 3 );
	}

	/**
	 * Stub a successful client-token mint.
	 */
	protected function fake_decart_token(): void {
		$this->fake_decart(
			200,
			array(
				'apiKey'    => 'ek_phpunit_token',
				'token'     => 'header.payload.signature',
				'expiresAt' => gmdate( 'c', time() + Settings::TOKEN_TTL ),
			)
		);
	}

	/**
	 * Store an encrypted key directly, without a verification call.
	 *
	 * @param string   $status   Key status.
	 * @param int|null $added_at When the key was added.
	 */
	protected function store_key( string $status = Settings::KEY_STATUS_VALID, ?int $added_at = null ): void {
		$salt = KeyVault::new_salt();

		Settings::update(
			array(
				'key'             => KeyVault::encrypt( self::VALID_KEY, $salt ),
				'key_salt'        => $salt,
				'key_fingerprint' => KeyVault::fingerprint( $salt ),
				'key_last4'       => substr( self::VALID_KEY, -4 ),
				'key_status'      => $status,
				'key_added_at'    => $added_at ?? time(),
			)
		);
	}

	protected function as_admin(): int {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		return $user_id;
	}

	protected function as_guest(): void {
		wp_set_current_user( 0 );
	}

	/**
	 * Create an image attachment with a resolvable URL.
	 *
	 * @param string $file File name.
	 */
	protected function create_image( string $file ): int {
		$attachment_id = self::factory()->attachment->create_object( $file, 0, array( 'post_mime_type' => 'image/jpeg' ) );
		update_post_meta( $attachment_id, '_wp_attached_file', $file );

		return $attachment_id;
	}

	/**
	 * Create a product.
	 *
	 * @param array $args {
	 *     @type string      $name    Product name.
	 *     @type string      $status  Post status.
	 *     @type bool        $image   Whether to add a featured image.
	 *     @type int         $gallery Number of gallery images.
	 *     @type string|null $live    Live meta value, or null to leave it unset.
	 * }
	 */
	protected function create_product( array $args = array() ): WC_Product {
		$args = wp_parse_args(
			$args,
			array(
				'name'    => 'Linen Shirt',
				'status'  => 'publish',
				'image'   => true,
				'gallery' => 0,
				'live'    => 'yes',
			)
		);

		$product = new WC_Product_Simple();
		$product->set_name( $args['name'] );
		$product->set_status( $args['status'] );

		if ( $args['image'] ) {
			$product->set_image_id( $this->create_image( 'featured-' . wp_generate_password( 6, false ) . '.jpg' ) );
		}

		$gallery = array();
		for ( $i = 0; $i < $args['gallery']; $i++ ) {
			$gallery[] = $this->create_image( "gallery-{$i}-" . wp_generate_password( 4, false ) . '.jpg' );
		}

		if ( $gallery ) {
			$product->set_gallery_image_ids( $gallery );
		}

		$product_id = $product->save();

		if ( null !== $args['live'] ) {
			update_post_meta( $product_id, Product::ENABLED_META, $args['live'] );
		}

		return wc_get_product( $product_id );
	}

	/**
	 * POST /live/session-token as the current user.
	 *
	 * @param int         $product_id Product ID.
	 * @param string|null $nonce      Nonce, or null for a valid one.
	 */
	protected function request_token( int $product_id, ?string $nonce = null ): WP_REST_Response {
		return $this->dispatch(
			'POST',
			'/tryaura/v1/live/session-token',
			array(
				'product_id' => $product_id,
				'nonce'      => $nonce ?? wp_create_nonce( SessionController::NONCE_ACTION ),
			)
		);
	}

	/**
	 * Refusal reason code from a REST error response.
	 *
	 * @param WP_REST_Response $response Response.
	 */
	protected function reason( WP_REST_Response $response ): string {
		$data = $response->get_data();

		return (string) ( $data['data']['reason'] ?? '' );
	}

	/**
	 * Live ledger rows, oldest first.
	 *
	 * @return array<int,array>
	 */
	protected function live_rows(): array {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM %i WHERE provider = %s ORDER BY id ASC', UsageManager::get_table_name(), 'decart' ),
			ARRAY_A
		);
	}

	/**
	 * Decoded ledger meta.
	 *
	 * @param array $row Ledger row.
	 */
	protected function row_meta( array $row ): array {
		return (array) json_decode( (string) $row['meta'], true );
	}

	/**
	 * Move a ledger row back in time.
	 *
	 * @param int    $id       Row ID.
	 * @param string $interval MySQL interval, for example '2 HOUR'.
	 */
	protected function age_row( int $id, string $interval ): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( $wpdb->prepare( "UPDATE %i SET created_at = DATE_SUB(created_at, INTERVAL {$interval}) WHERE id = %d", UsageManager::get_table_name(), $id ) );
		wp_cache_set( 'last_changed', microtime(), UsageManager::CACHE_GROUP );
	}
}

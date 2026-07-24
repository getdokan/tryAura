<?php
/**
 * Base test case for the TryAura suite.
 *
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_UnitTestCase;

/**
 * Boots a fresh REST server per test and provides Gemini HTTP stubs.
 *
 * No test ever reaches the real Gemini API — `fake_gemini*()` short-circuits every
 * request to `generativelanguage.googleapis.com` via `pre_http_request`
 * (see docs/adr/0002-token-free-test-strategy.md).
 */
abstract class TryAuraTestCase extends WP_UnitTestCase {

	/**
	 * Set up a fresh REST server for each test.
	 */
	public function set_up(): void {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		do_action( 'rest_api_init', $wp_rest_server );

		// Safety net: no test may reach the network. Stubs run first (priority 10)
		// and set a response; anything still unstubbed is blocked here (see ADR 0002).
		add_filter(
			'pre_http_request',
			function ( $pre ) {
				if ( false !== $pre ) {
					return $pre;
				}
				return new \WP_Error( 'tryaura_test_no_http', 'External HTTP is blocked during tests.' );
			},
			9999
		);
	}

	/**
	 * Tear down the REST server and any HTTP stubs.
	 */
	public function tear_down(): void {
		global $wp_rest_server;
		$wp_rest_server = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		remove_all_filters( 'pre_http_request' );

		parent::tear_down();
	}

	/**
	 * Dispatch a REST request through the test server.
	 *
	 * @param string $method HTTP method.
	 * @param string $route  REST route, e.g. '/tryaura/v1/settings'.
	 * @param array  $params Request params (query or body).
	 *
	 * @return WP_REST_Response
	 */
	protected function dispatch( string $method, string $route, array $params = array() ): WP_REST_Response {
		$request = new WP_REST_Request( $method, $route );

		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Intercept every Gemini HTTP call and return a canned response.
	 *
	 * @param int   $status HTTP status code to return.
	 * @param array $body   Response body (JSON-encoded before returning).
	 */
	protected function fake_gemini( int $status, array $body ): void {
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) use ( $status, $body ) {
				if ( false !== strpos( (string) $url, 'generativelanguage.googleapis.com' ) ) {
					return array(
						'response' => array(
							'code'    => $status,
							'message' => '',
						),
						'body'     => wp_json_encode( $body ),
						'headers'  => array(),
					);
				}
				return $pre;
			},
			10,
			3
		);
	}

	/**
	 * Stub a successful Gemini image response.
	 *
	 * @param array|null $body Optional override.
	 */
	protected function fake_gemini_success( ?array $body = null ): void {
		$this->fake_gemini( 200, $body ?? GeminiFixtures::image_success() );
	}

	/**
	 * Stub a Gemini error response.
	 *
	 * @param int        $status HTTP status code.
	 * @param array|null $body   Optional override.
	 */
	protected function fake_gemini_error( int $status = 400, ?array $body = null ): void {
		$this->fake_gemini( $status, $body ?? GeminiFixtures::error( $status ) );
	}
}

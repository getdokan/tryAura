<?php
/**
 * Hand-authored Gemini response fixtures.
 *
 * These are synthetic — the suite never calls the real Gemini API. The shapes match
 * what the plugin actually reads (see GenerateController / PreviewModal). Refresh from
 * a real sample only if the API changes (docs/adr/0002-token-free-test-strategy.md).
 *
 * @package TryAura\Tests
 */

namespace Dokan\TryAura\Test;

/**
 * Canned Gemini `generateContent` responses.
 */
class GeminiFixtures {

	/**
	 * A 1×1 transparent PNG, base64-encoded.
	 *
	 * @var string
	 */
	const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

	/**
	 * A successful image generation response.
	 *
	 * @return array
	 */
	public static function image_success(): array {
		return array(
			'candidates'    => array(
				array(
					'content' => array(
						'parts' => array(
							array(
								'inlineData' => array(
									'mimeType' => 'image/png',
									'data'     => self::PNG_1X1,
								),
							),
						),
					),
				),
			),
			'usageMetadata' => array(
				'promptTokenCount'     => 12,
				'candidatesTokenCount' => 34,
				'totalTokenCount'      => 46,
			),
		);
	}

	/**
	 * An error response, matching Gemini's `{ "error": { ... } }` shape.
	 *
	 * @param int    $code    Error code.
	 * @param string $message Error message.
	 * @param string $status  Error status string.
	 *
	 * @return array
	 */
	public static function error( int $code = 400, string $message = 'TryAura test error', string $status = 'INVALID_ARGUMENT' ): array {
		return array(
			'error' => array(
				'code'    => $code,
				'message' => $message,
				'status'  => $status,
			),
		);
	}
}

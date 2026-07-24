import { Page } from '@playwright/test';
import imageFixture from '../fixtures/gemini-image.json';

/**
 * Intercept every browser-side Gemini call and return a canned image, so the
 * admin enhancer never spends a token (see docs/adr/0002). The server-side
 * try-on path is stubbed separately by the guard mu-plugin.
 */
export async function stubGemini( page: Page ): Promise< void > {
	await page.route( '**/generativelanguage.googleapis.com/**', ( route ) =>
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( imageFixture ),
		} )
	);
}

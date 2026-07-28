import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAsAdmin } from '../../../utils/auth';
import { openEnhancer, setVideoConfig } from '../../../utils/enhancer';
import veoDone from '../../../fixtures/veo-operation-done.json';

/**
 * @pro — video generation (Veo). The whole point of the fake-URI + stub-MP4 design:
 * the SDK's long-running operation is stubbed "done" (skips polling) with a URI that
 * points at a committed few-KB MP4. No token, no real Veo call (docs/adr/0002).
 */
test.describe( 'Video generation (Pro)', { tag: '@pro' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'generates a video through the stubbed Veo flow', async ( {
		page,
	} ) => {
		// 1) Every Gemini/Veo call returns the "done" operation immediately.
		await page.route(
			'**/generativelanguage.googleapis.com/**',
			( route ) =>
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( veoDone ),
				} )
		);
		// 2) The authenticated download of the result URI returns the tiny MP4.
		await page.route( '**/tryaura.test/__fixtures/veo-sample.mp4', ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'video/mp4',
				headers: { 'access-control-allow-origin': '*' },
				body: fs.readFileSync(
					path.join( __dirname, '../../../fixtures/veo-sample.mp4' )
				),
			} )
		);

		await openEnhancer( page );

		// With Pro active the Video tab is unlocked — switch to it.
		await page.getByRole( 'button', { name: 'Video', exact: true } ).click();
		// The block editor requires a prompt for Pro generation.
		await setVideoConfig( page, { optionalPrompt: 'a short product clip' } );
		// (The video config's action button is labelled "Generate".)
		await page
			.getByRole( 'button', { name: 'Generate', exact: true } )
			.click();

		// The generated video renders.
		await expect( page.locator( 'video' ).first() ).toBeVisible( {
			timeout: 30_000,
		} );
	} );
} );

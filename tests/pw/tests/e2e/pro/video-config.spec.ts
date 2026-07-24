import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAsAdmin } from '../../../utils/auth';
import { openEnhancer, setVideoConfig } from '../../../utils/enhancer';
import veoDone from '../../../fixtures/veo-operation-done.json';

/**
 * @pro — different video-generation combinations, verified by the request the
 * plugin sends to Veo (captured in the stub). No token, no real Veo call.
 */
test.describe(
	'Video generation — config combinations (Pro)',
	{ tag: '@pro' },
	() => {
		test.beforeEach( async ( { page } ) => {
			await loginAsAdmin( page );
		} );

		async function generateVideoWith(
			page: Page,
			config: Record< string, unknown >
		): Promise< string > {
			await page.route(
				'**/generativelanguage.googleapis.com/**',
				( route ) =>
					route.fulfill( {
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify( veoDone ),
					} )
			);
			await page.route(
				'**/tryaura.test/__fixtures/veo-sample.mp4',
				( route ) =>
					route.fulfill( {
						status: 200,
						contentType: 'video/mp4',
						headers: { 'access-control-allow-origin': '*' },
						body: fs.readFileSync(
							path.join(
								__dirname,
								'../../../fixtures/veo-sample.mp4'
							)
						),
					} )
			);

			await openEnhancer( page );
			await page
				.getByRole( 'button', { name: 'Video', exact: true } )
				.click();
			await setVideoConfig( page, {
				optionalPrompt: 'a short product clip',
				...config,
			} );

			const [ request ] = await Promise.all( [
				page.waitForRequest(
					'**/generativelanguage.googleapis.com/**',
					{ timeout: 20_000 }
				),
				page
					.getByRole( 'button', { name: 'Generate', exact: true } )
					.click(),
			] );

			return request.postData() || '';
		}

		test( 'portrait 9:16 is sent', async ( { page } ) => {
			const body = await generateVideoWith( page, {
				aspectRatio: '9:16',
			} );
			expect( body ).toContain( '"aspectRatio":"9:16"' );
		} );

		// (Removed the "720p" case — that's the INITIAL_STATE default, so it would
		// pass even if setVideoConfig did nothing. The cases below set non-defaults.)

		test( 'duration 6 seconds is sent', async ( { page } ) => {
			const body = await generateVideoWith( page, {
				resolution: '720p',
				durationSeconds: 6,
			} );
			expect( body ).toContain( '"durationSeconds":6' );
		} );

		test( 'the prompt reaches the request', async ( { page } ) => {
			const body = await generateVideoWith( page, {
				optionalPrompt: 'a spinning red cap',
			} );
			expect( body.toLowerCase() ).toContain( 'spinning red cap' );
		} );
	}
);

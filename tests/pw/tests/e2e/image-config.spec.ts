import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';
import { openEnhancer, setImageConfig } from '../../utils/enhancer';
import imageFixture from '../../fixtures/gemini-image.json';

/**
 * Different image-generation combinations, verified by the request the plugin
 * sends to Gemini (captured in the stub) — the field→request logic is what's
 * under test; the returned image is a fixed fixture (docs/adr/0002).
 */
test.describe( 'Image generation — config combinations', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	/**
	 * Generate with the given config; return the captured Gemini request.
	 */
	async function generateWith(
		page: import('@playwright/test').Page,
		config: Record< string, unknown >
	): Promise< { url: string; body: string } > {
		// Fulfil every Gemini call with the fixture (no token spent).
		await page.route(
			'**/generativelanguage.googleapis.com/**',
			( route ) =>
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( imageFixture ),
				} )
		);

		await openEnhancer( page );
		await setImageConfig( page, config );

		// Clicking Generate fires the request; wait for it and read what was sent.
		const [ request ] = await Promise.all( [
			page.waitForRequest(
				'**/generativelanguage.googleapis.com/**',
				{ timeout: 20_000 }
			),
			page
				.getByRole( 'button', { name: 'Generate', exact: true } )
				.click(),
		] );

		return { url: request.url(), body: request.postData() || '' };
	}

	// (Removed the "1:1 / 1K" case — those are the INITIAL_STATE defaults, so it
	// would pass even if setImageConfig did nothing. The cases below set
	// non-defaults and genuinely validate the field→request wiring.)

	test( '2K upgrades to a Gemini 3 model and sends imageSize 2K', async ( {
		page,
	} ) => {
		const req = await generateWith( page, {
			aspectRatio: '1:1',
			resolution: '2K',
		} );
		expect( req.url ).toContain( 'gemini-3' );
		expect( req.body ).toContain( '"imageSize":"2K"' );
	} );

	test( '4K upgrades to a Gemini 3 model and sends imageSize 4K', async ( {
		page,
	} ) => {
		const req = await generateWith( page, {
			aspectRatio: '1:1',
			resolution: '4K',
		} );
		expect( req.url ).toContain( 'gemini-3' );
		expect( req.body ).toContain( '"imageSize":"4K"' );
	} );

	test( 'a studio background is carried into the prompt', async ( {
		page,
	} ) => {
		const req = await generateWith( page, {
			backgroundType: 'studio',
			styleType: 'model shoot',
		} );
		expect( req.body.toLowerCase() ).toContain( 'studio' );
	} );

	test( 'on-model apparel routes to the high-fidelity Gemini 3 model', async ( {
		page,
	} ) => {
		const req = await generateWith( page, { apparelMode: 'on-model' } );
		expect( req.url ).toContain( 'gemini-3' );
	} );
} );

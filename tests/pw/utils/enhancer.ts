import { Page, expect } from '@playwright/test';

/**
 * Open the enhancer PreviewModal from the post editor's media modal, with the
 * first library image selected. Requires at least one image in the library.
 */
export async function openEnhancer( page: Page ): Promise< void > {
	// The enhancer JS is enqueued on the post editor.
	await page.goto( '/wp-admin/post-new.php' );

	// Turn off the block-editor welcome guide — its overlay intercepts clicks.
	await page.waitForFunction( () => Boolean( ( window as any ).wp?.data ), null, {
		timeout: 20_000,
	} );
	await page.evaluate( () => {
		try {
			( window as any ).wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
		} catch ( e ) {
			// ignore
		}
	} );
	await page
		.locator( '.components-modal__screen-overlay' )
		.first()
		.waitFor( { state: 'hidden', timeout: 8_000 } )
		.catch( () => undefined );

	// Open a wp.media modal — the enhancer injects its button via the Modal.open
	// override — and force the Media Library (browse) view.
	await page.waitForFunction( () => Boolean( ( window as any ).wp?.media ), null, {
		timeout: 20_000,
	} );
	await page.evaluate( () => {
		const frame = ( window as any ).wp.media( {
			title: 'Select',
			multiple: false,
			library: { type: 'image' },
		} );
		frame.open();
		if ( frame.content && typeof frame.content.mode === 'function' ) {
			frame.content.mode( 'browse' );
		}
	} );

	await expect( page.locator( '.media-modal' ) ).toBeVisible();
	const first = page.locator( '.media-modal li.attachment' ).first();
	await first.waitFor( { state: 'visible', timeout: 15_000 } );
	await first.click();

	// The "Enhance with AI" toolbar button is now enabled — open the PreviewModal.
	const enhance = page.getByRole( 'button', { name: 'Enhance with AI' } );
	await expect( enhance ).toBeEnabled();
	await enhance.click();

	// PreviewModal is open once the tabs render.
	await expect( page.getByRole( 'button', { name: /Image/ } ) ).toBeVisible();
}

/**
 * Merge image config into the enhancer store (bypasses the custom dropdowns).
 */
export async function setImageConfig(
	page: Page,
	config: Record< string, unknown >
): Promise< void > {
	await page.evaluate( ( cfg ) => {
		( window as any ).wp.data
			.dispatch( 'tryaura/enhancer' )
			.setImageConfigData( cfg );
	}, config );
}

/**
 * Merge video config into the Pro enhancer store (video state lives there).
 */
export async function setVideoConfig(
	page: Page,
	config: Record< string, unknown >
): Promise< void > {
	await page.evaluate( ( cfg ) => {
		( window as any ).wp.data
			.dispatch( 'tryaura/enhancer-pro' )
			.setVideoConfigData( cfg );
	}, config );
}

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';
import { stubGemini } from '../../utils/gemini';

test.describe( 'Enhancer image generation', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
		// Every Gemini call is stubbed in the browser — no token spent.
		await stubGemini( page );
	} );

	test( 'opens from the media modal, shows Pro-locked tabs, and generates', async ( {
		page,
	} ) => {
		// The enhancer JS is enqueued on the post editor.
		await page.goto( '/wp-admin/post-new.php' );

		// The block editor's welcome-guide overlay intercepts clicks — turn it off
		// via the editor preferences before doing anything else.
		await page.waitForFunction( () => Boolean( ( window as any ).wp?.data ), null, { timeout: 20_000 } );
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

		// Wait for wp.media, then open a media modal — the enhancer injects its
		// button into it via the Modal.open override.
		await page.waitForFunction( () => Boolean( ( window as any ).wp?.media ), null, { timeout: 20_000 } );
		await page.evaluate( () => {
			const frame = ( window as any ).wp.media( {
				title: 'Select',
				multiple: false,
				library: { type: 'image' },
			} );
			frame.open();
			// Force the Media Library (browse) view, not the Upload Files tab.
			if ( frame.content && typeof frame.content.mode === 'function' ) {
				frame.content.mode( 'browse' );
			}
		} );

		// The modal opens; make sure the Media Library tab is active, then wait for
		// the attachments grid to populate and select the first image.
		await expect( page.locator( '.media-modal' ) ).toBeVisible();
		const libraryTab = page.locator(
			'.media-router .media-menu-item',
			{ hasText: 'Media Library' }
		);
		if ( await libraryTab.count() ) {
			await libraryTab.click().catch( () => undefined );
		}
		const firstImage = page.locator( '.media-modal li.attachment' ).first();
		await firstImage.waitFor( { state: 'visible', timeout: 15_000 } );
		await firstImage.click();

		// The "Enhance with AI" button (added to the modal toolbar) is now enabled.
		const enhance = page.getByRole( 'button', { name: 'Enhance with AI' } );
		await expect( enhance ).toBeEnabled();
		await enhance.click();

		// The enhancer PreviewModal opens with the Image / Video / Edit tabs;
		// Video and Edit are Pro-locked for a free user.
		await expect(
			page.getByRole( 'button', { name: /Image/ } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: /Video/ } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: /Edit/ } )
		).toBeVisible();

		// Generate — the browser calls Gemini, which our stub fulfills.
		await page
			.getByRole( 'button', { name: 'Generate', exact: true } )
			.click();

		// The GENERATED image (alt="Generated") renders — not the source image
		// (alt="Original …"). This only appears after the stubbed generation
		// completes, so it's a true completion signal.
		await expect( page.locator( 'img[alt="Generated"]' ) ).toBeVisible( {
			timeout: 20_000,
		} );
	} );
} );

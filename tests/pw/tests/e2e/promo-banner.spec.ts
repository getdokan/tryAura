import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

const BANNER_HEADING = 'Go Pro. Create Without Limits.';

test.describe( 'Pro promo banner', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'shows on the TryAura dashboard and the dismissal persists', async ( {
		page,
	} ) => {
		await page.goto( '/wp-admin/admin.php?page=tryaura#/' );

		const heading = page.getByText( BANNER_HEADING );
		await expect( heading ).toBeVisible();

		// The dismiss is fire-and-forget (hides immediately, then POSTs), so wait
		// for the persistence request to land before reloading.
		await Promise.all( [
			page.waitForResponse(
				( r ) =>
					/dismiss-banner/.test( r.url() ) &&
					r.request().method() === 'POST'
			),
			page
				.getByRole( 'button', { name: 'Dismiss this banner' } )
				.click(),
		] );
		await expect( heading ).toBeHidden();

		// Persisted per user — still gone after a reload.
		await page.reload();
		await expect( page.getByText( BANNER_HEADING ) ).toHaveCount( 0 );
	} );
} );

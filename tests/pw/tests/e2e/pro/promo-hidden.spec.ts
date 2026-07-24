import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../../utils/auth';

/**
 * @pro — runs only with TryAura Pro active (`npm run test:pro`). Verifies the
 * upgrade touchpoints disappear once Pro is installed, from the Pro side.
 */
test.describe(
	'Pro promotion touchpoints are hidden when Pro is active',
	{ tag: '@pro' },
	() => {
		test.beforeEach( async ( { page } ) => {
			await loginAsAdmin( page );
		} );

		test( 'no promo banner on the TryAura dashboard', async ( { page } ) => {
			await page.goto( '/wp-admin/admin.php?page=tryaura#/' );
			await expect(
				page.getByText( 'Go Pro. Create Without Limits.' )
			).toHaveCount( 0 );
		} );

		test( 'no "Upgrade to Pro" link in the free plugin row', async ( {
			page,
		} ) => {
			await page.goto( '/wp-admin/plugins.php' );
			const row = page.locator(
				'tr[data-plugin="tryaura/tryaura.php"]'
			);
			await expect( row ).toBeVisible();
			await expect(
				row.getByRole( 'link', { name: 'Upgrade to Pro' } )
			).toHaveCount( 0 );
		} );

		test( 'no Upgrade button in the admin sidebar', async ( { page } ) => {
			await page.goto( '/wp-admin/admin.php?page=tryaura#/' );
			await expect(
				page.locator(
					'#adminmenu #toplevel_page_tryaura a[href*="storepulse.co/tryaura/pricing"]'
				)
			).toHaveCount( 0 );
		} );
	}
);

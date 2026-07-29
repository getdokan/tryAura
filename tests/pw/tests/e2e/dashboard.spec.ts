import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe( 'TryAura admin dashboard', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'renders the Top Bar and navigates to Settings', async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=tryaura#/' );

		// Top Bar (plugin-ui chrome). "Get Support" renders as an anchor.
		await expect( page.getByText( 'Get Support' ) ).toBeVisible();
		await expect( page.getByText( /Lite v\d/ ) ).toBeVisible();

		// The dashboard SPA rendered its landing content.
		await expect(
			page.getByText( 'Configure your Gemini with API' )
		).toBeVisible();

		// Navigate to the Settings route.
		await page.goto( '/wp-admin/admin.php?page=tryaura#/settings' );
		await expect(
			page.getByText( 'Gemini API', { exact: true } )
		).toBeVisible();
	} );
} );

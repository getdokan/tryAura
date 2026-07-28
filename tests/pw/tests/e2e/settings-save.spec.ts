import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe( 'Gemini settings', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'saves the API key and shows a success message', async ( {
		page,
	} ) => {
		await page.goto(
			'/wp-admin/admin.php?page=tryaura#/settings/gemini'
		);

		const input = page.locator( '#gemini-api-key' );
		await expect( input ).toBeVisible();
		await input.fill( 'AIza-e2e-test-key' );

		await page.getByRole( 'button', { name: 'Connect' } ).click();

		await expect(
			page.getByText( 'Gemini API settings saved successfully!' )
		).toBeVisible();

		// Persisted — the key is still there after a reload.
		await page.reload();
		await expect( page.locator( '#gemini-api-key' ) ).toHaveValue(
			'AIza-e2e-test-key'
		);
	} );
} );

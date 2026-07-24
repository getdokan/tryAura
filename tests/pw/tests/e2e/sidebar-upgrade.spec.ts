import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe( 'Sidebar Upgrade button', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'appears in the TryAura admin menu and links to pricing', async ( {
		page,
	} ) => {
		// On the TryAura page the submenu is expanded, so the button is visible.
		await page.goto( '/wp-admin/admin.php?page=tryaura#/' );

		const upgrade = page.locator(
			'#adminmenu #toplevel_page_tryaura .wp-submenu a[href*="storepulse.co/tryaura/pricing"]'
		);
		await expect( upgrade ).toBeVisible();
		await expect( upgrade ).toHaveText( 'Upgrade' );
		await expect( upgrade ).toHaveAttribute( 'target', '_blank' );
	} );
} );

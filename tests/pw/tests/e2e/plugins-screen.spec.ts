import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

test.describe( 'All Plugins screen', { tag: '@lite' }, () => {
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
	} );

	test( 'shows the "Upgrade to Pro" action link when Pro is absent', async ( {
		page,
	} ) => {
		await page.goto( '/wp-admin/plugins.php' );

		const link = page.getByRole( 'link', { name: 'Upgrade to Pro' } );
		await expect( link ).toBeVisible();
		await expect( link ).toHaveAttribute(
			'href',
			/storepulse\.co\/tryaura\/pricing/
		);
		await expect( link ).toHaveAttribute( 'target', '_blank' );
	} );
} );

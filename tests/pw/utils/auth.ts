import { Page, expect } from '@playwright/test';

/**
 * Where the authenticated admin session is cached.
 *
 * The suite logs in exactly once (tests/e2e/_auth.setup.ts) and every spec
 * starts from this state, so no test pays for the ~2s wp-login round trip.
 */
export const ADMIN_STORAGE_STATE = 'playwright/.auth/admin.json';

const ADMIN_USER = process.env.WP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.WP_ADMIN_PASS || 'password';

/**
 * The user WordPress considers logged in, read from its auth cookie.
 *
 * @param page Page whose context holds the cookies.
 */
async function currentUser( page: Page ): Promise< string | undefined > {
	const cookie = ( await page.context().cookies() ).find( ( c ) =>
		c.name?.startsWith( 'wordpress_logged_in_' )
	);

	return cookie?.value
		? decodeURIComponent( cookie.value ).split( '|' )[ 0 ]
		: undefined;
}

/**
 * Log in through the real wp-login form (wp-env default admin/password).
 *
 * @param page         Page to authenticate.
 * @param storageState When given, the resulting session is written here so the
 *                     dependent projects can reuse it instead of logging in.
 */
export async function loginAsAdmin(
	page: Page,
	storageState?: string
): Promise< void > {
	if ( ( await currentUser( page ) ) === ADMIN_USER ) {
		return;
	}

	await page.goto( '/wp-login.php' );
	await page.fill( '#user_login', ADMIN_USER );
	await page.fill( '#user_pass', ADMIN_PASS );

	// Submit without auto-waiting on the wp-admin render: the auth cookie is set
	// by wp-login.php's redirect, which lands long before the dashboard finishes
	// painting, so poll for the cookie instead of racing a slow navigation.
	await page.locator( '#wp-submit' ).dispatchEvent( 'click' );
	await expect
		.poll( async () => currentUser( page ), { timeout: 30_000 } )
		.toBe( ADMIN_USER );

	if ( storageState ) {
		await page.context().storageState( { path: storageState } );
	}
}

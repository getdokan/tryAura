import { test as setup } from '@playwright/test';
import { ADMIN_STORAGE_STATE, loginAsAdmin } from '../../utils/auth';

/**
 * Authenticate once per run and cache the session to disk; every spec then
 * starts already logged in (see the `chromium` project's storageState).
 *
 * The title carries BOTH suite tags on purpose: `--grep` filters setup projects
 * too, so a setup test tagged only @lite would be dropped by `--grep @pro` and
 * the whole Pro run would start unauthenticated.
 */
setup( 'authenticate as admin @lite @pro', async ( { page } ) => {
	await loginAsAdmin( page, ADMIN_STORAGE_STATE );
} );

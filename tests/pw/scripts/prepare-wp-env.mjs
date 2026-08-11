/**
 * Choose the wp-env config for this run and write it to .wp-env.override.json
 * (which wp-env layers on top of .wp-env.json automatically).
 *
 *   .wp-env.json      lite only — the safe default. Works with no Pro checkout,
 *                     which is what fork PRs and lite-only contributors get.
 *   .wp-env.ci.json   lite + Pro. Selected automatically when the Pro plugin is
 *                     actually on disk.
 *
 * Mapping a directory that does not exist makes `wp-env start` abort, which is
 * why the Pro mapping cannot simply live in the default config.
 *
 * Usage: node scripts/prepare-wp-env.mjs [--lite]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const pwDir = path.resolve( here, '..' );

// Keep in sync with the "wp-content/plugins/tryaura-pro" mapping in
// .wp-env.ci.json — both are relative to this directory.
const PRO_DIR = path.resolve( pwDir, '../../../tryaura-pro' );

const forceLite = process.argv.includes( '--lite' );
const proPresent = fs.existsSync( path.join( PRO_DIR, 'tryaura-pro.php' ) );
const usePro = ! forceLite && proPresent;

const source = usePro ? '.wp-env.ci.json' : '.wp-env.json';
fs.copyFileSync(
	path.join( pwDir, source ),
	path.join( pwDir, '.wp-env.override.json' )
);

const why = forceLite
	? 'forced with --lite'
	: proPresent
	? `found ${ PRO_DIR }`
	: 'no Pro plugin on disk';

console.log( `wp-env config: ${ source } (${ why })` );

// Consumed by the workflow to decide whether to run the @pro suite.
if ( process.env.GITHUB_OUTPUT ) {
	fs.appendFileSync( process.env.GITHUB_OUTPUT, `pro=${ usePro }\n` );
}

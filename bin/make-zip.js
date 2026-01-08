#!/usr/bin/env node
/*
 * Plugin ZIP Maker (Node.js)
 *
 * Usage: node bin/make-zip.js
 * - Reads version from package.json
 * - Updates class-plug-version-switcher.php header Version and PLUGVESW_PLUGIN_VERSION
 * - Creates dist/plug-version-switcher-<version>.zip with a curated file list
 */

const path = require( 'path' );
const fs = require( 'fs-extra' );
const archiver = require( 'archiver' );
// globby is ESM-only in v14+. We'll import it dynamically in the async IIFE.
const replaceInFile = require( 'replace-in-file' );

( async () => {
	try {
		const root = path.resolve( __dirname, '..' );
		const pluginSlug = path.basename( root ); // expects plug-version-switcher

		// 1) Read version from package.json
		const pkgPath = path.join( root, 'package.json' );
		const pkgJson = JSON.parse( await fs.readFile( pkgPath, 'utf8' ) );
		const version = pkgJson.version;
		if ( ! version ) {
			throw new Error( 'package.json missing version' );
		}

		// 2) Update Version header and PLUGVESW_PLUGIN_VERSION in main plugin file
		const mainFile = path.join( root, 'class-plug-version-switcher.php' );
		if ( ! ( await fs.pathExists( mainFile ) ) ) {
			throw new Error( `Main plugin file not found: ${ mainFile }` );
		}

		const replaceResults = await replaceInFile( {
			files: mainFile,
			from: [
				/(\n\s*\*\s*Version:\s*)([^\r\n]+)/im, // header Version: x.y.z
				/(define\(\s*'PLUGVESW_PLUGIN_VERSION'\s*,\s*')[^']+('\s*\)\s*;)/m, // constant
			],
			to: [ `$1${ version }`, `$1${ version }$2` ],
		} );

		// Optional: also keep readme Stable tag in sync if present
		const readmePath = path.join( root, 'readme.txt' );
		if ( await fs.pathExists( readmePath ) ) {
			try {
				await replaceInFile( {
					files: readmePath,
					from: /(\nStable tag:\s*)([^\r\n]+)/i,
					to: `$1${ version }`,
				} );
			} catch ( e ) {
				// non-fatal if pattern not found
			}
		}

		// 3) Prepare dist output
		const distDir = path.join( root, 'dist' );
		await fs.ensureDir( distDir );
		const zipPath = path.join(
			distDir,
			`${ pluginSlug }-${ version }.zip`
		);

		// 4) Build include globs and exclusions (mirrors PHP script intent)
		const includeGlobs = [
			'assets/**',
			'build/**',
			'includes/**',
			'templates/**',
			'vendor/**',
			'languages/**',
			'*.php', // root PHP files
			'readme.txt',
			'license',
			'license.txt',
			'composer.json', // Todo: plugin rel del
		];

		const ignoreGlobs = [
			'node_modules/**',
			'bin/**', // exclude tooling
			'.git/**',
			'.github/**',
			'tests/**',
			'test/**',
			'.idea/**',
			'.vscode/**',
			// Exclude GitHub-specific functionality from published ZIP for now
			'includes/App/GitHubApi.php',
			'templates/github-page.php',
			'assets/js/github-page.js',
			// 'composer.json', // Todo: plugin rel del
			'composer.lock',
			'package.json',
			'package-lock.json',
			'phpcs.xml',
			'phpcs.xml.dist',
			'**/*.map',
			'dist/**', // avoid recursive
			'**/.DS_Store',
		];

		// Dynamically import globby (ESM-only)
		const { globby } = await import( 'globby' );

		const files = await globby( includeGlobs, {
			cwd: root,
			dot: false,
			ignore: ignoreGlobs,
			onlyFiles: true,
			followSymbolicLinks: false,
		} );

		if ( ! files.length ) {
			throw new Error( 'No files matched to include in the ZIP.' );
		}

		// 5) Create zip with top-level folder pluginSlug/
		await new Promise( ( resolve, reject ) => {
			const output = fs.createWriteStream( zipPath );
			const archive = archiver( 'zip', { zlib: { level: 9 } } );

			output.on( 'close', resolve );
			output.on( 'error', reject );
			archive.on( 'error', reject );

			archive.pipe( output );

			for ( const rel of files ) {
				const abs = path.join( root, rel );
				const dest = path.posix.join(
					`${ pluginSlug }`,
					rel.replace( /\\/g, '/' )
				);
				archive.file( abs, { name: dest } );
			}

			archive.finalize();
		} );

		const stats = await fs.stat( zipPath ).catch( () => null );
		const sizeMb = stats ? ( stats.size / 1048576 ).toFixed( 2 ) : '0.00';
		// eslint-disable-next-line no-console
		console.log( `Created ZIP: ${ zipPath } (${ sizeMb } MB)` );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( 'Error building ZIP:', err.message || err );
		process.exit( 1 );
	}
} )();

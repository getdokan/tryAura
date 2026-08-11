/**
 * Publish a Playwright run summary to GitHub's job summary.
 *
 * The `github` reporter only emits annotations for failures, so a passing run
 * shows a bare green tick with no evidence anything executed. This turns the
 * JSON report into a table of what actually ran — including the suites that
 * were deliberately excluded, so "green" is never mistaken for "everything
 * passed".
 */
import fs from 'fs';

const RESULTS = process.env.E2E_RESULTS || 'test-summary/results.json';
const SUITE = process.env.E2E_SUITE_LABEL || 'Playwright E2E';

if ( ! fs.existsSync( RESULTS ) ) {
	const msg = `## ${ SUITE }\n\n⚠️ No results at \`${ RESULTS }\` — this suite did not run.`;
	writeOut( msg );
	console.error( msg );
	process.exit( 0 );
}

const report = JSON.parse( fs.readFileSync( RESULTS, 'utf8' ) );
const rows = [];

const ICON = {
	expected: '✅',
	unexpected: '❌',
	flaky: '⚠️',
	skipped: '⏭️',
};

/** Walk the nested suite tree and flatten every spec into a row. */
function walk( suites, trail = [] ) {
	for ( const suite of suites ?? [] ) {
		const path = suite.title ? [ ...trail, suite.title ] : trail;

		for ( const spec of suite.specs ?? [] ) {
			const status = spec.tests?.[ 0 ]?.status ?? 'skipped';
			const ms = spec.tests?.[ 0 ]?.results?.[ 0 ]?.duration ?? 0;
			rows.push( {
				icon: ICON[ status ] ?? '❔',
				// The file title is the first trail entry; keep the rest as context.
				name: [ ...path.slice( 1 ), spec.title ].join( ' › ' ),
				file: path[ 0 ] ?? '',
				seconds: ( ms / 1000 ).toFixed( 1 ),
			} );
		}

		walk( suite.suites, path );
	}
}

walk( report.suites );

const s = report.stats ?? {};
const passed = s.expected ?? 0;
const failed = s.unexpected ?? 0;
const flaky = s.flaky ?? 0;
const skipped = s.skipped ?? 0;
const total = ( s.duration ?? 0 ) / 1000;

const headline = failed
	? `❌ ${ failed } failed, ${ passed } passed`
	: `✅ ${ passed } passed`;

const lines = [
	`## ${ SUITE } — ${ headline }`,
	'',
	`**${ passed } passed · ${ failed } failed · ${ flaky } flaky · ${ skipped } skipped** in ${ total.toFixed( 1 ) }s`,
	'',
];

// Be explicit about coverage that was deliberately skipped, so a green check
// is never read as "the Pro suite passed".
if ( process.env.E2E_EXCLUDED_NOTE ) {
	lines.push( `> ${ process.env.E2E_EXCLUDED_NOTE }`, '' );
}

lines.push( '| | Test | Time |', '|---|---|---|' );
for ( const r of rows ) {
	lines.push( `| ${ r.icon } | \`${ r.file }\` › ${ r.name } | ${ r.seconds }s |` );
}

const markdown = lines.join( '\n' );
writeOut( markdown );

// Also echo to the build log so it is visible without opening the summary tab.
console.log( `\n${ headline } — ${ rows.length } test(s) reported\n` );

function writeOut( text ) {
	const target = process.env.GITHUB_STEP_SUMMARY;
	if ( target ) {
		fs.appendFileSync( target, `${ text }\n` );
	}
}

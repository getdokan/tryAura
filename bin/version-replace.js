const fs = require( 'fs-extra' );
const replace = require( 'replace-in-file' );

const pluginFiles = [
	'inc/**/*',
	'templates/**/*',
	'src/**/*',
	'try-aura.php',
];

const { version } = JSON.parse( fs.readFileSync( 'package.json' ) );

replace( {
	files: pluginFiles,
	from: [ /TRYAURA_SINCE/g ],
	to: version,
} );

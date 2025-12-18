'use strict';

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

// Extend the default @wordpress/scripts webpack config to support multiple entries.
module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry,
		components: {
			import: './src/components/index.tsx',
			library: {
				name: [ 'tryaura', 'components' ],
				type: 'window',
			},
		},
		'admin/settings/index': './src/admin/settings/index.tsx',
		'admin/enhancer/index': './src/admin/enhancer/index.tsx',
		'frontend/tryon/index': './src/frontend/tryon/index.tsx',
	}
};

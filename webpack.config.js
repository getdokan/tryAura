'use strict';

const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

// Extend the default @wordpress/scripts webpack config to support multiple entries.
module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve(process.cwd(), 'src', 'index.tsx'),
		enhancer: path.resolve(process.cwd(), 'src', 'enhancer.tsx'),
	}
};

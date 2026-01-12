'use strict';

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

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
		'admin/dashboard/index': './src/admin/dashboard/index.tsx',
		'admin/enhancer/index': './src/admin/enhancer/index.tsx',
		'data/ai-models': {
			import: './src/data/ai-models/index.ts',
			library: {
				name: [ 'tryaura', 'aiProvidersStore' ],
				type: 'window',
			},
		},
		'frontend/tryon/index': './src/frontend/tryon/index.tsx',
		'admin/woocommerce-products-list':
			'./src/admin/woocommerce-products-list/index.tsx',
		'admin/product-video-gallery/index':
			'./src/admin/product-video-gallery/index.tsx',
	},
};

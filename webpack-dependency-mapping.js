/**
 * Maps the package name to the global variable name.
 *
 * @param {string} request Package name.
 *
 * @return {string|undefined} Global variable name.
 */
const requestToExternal = ( request ) => {
	if ( request === '@tryaura/components' ) {
		return [ 'tryaura', 'components' ];
	}

	if ( request === '@tryaura/ai-models' ) {
		return [ 'tryaura', 'aiProvidersStore' ];
	}

	return undefined;
};

/**
 * Maps the package name to the WordPress script handle.
 *
 * @param {string} request Package name.
 *
 * @return {string|undefined} WordPress script handle.
 */
const requestToHandle = ( request ) => {
	if ( request === '@tryaura/components' ) {
		return 'try-aura-components';
	}

	if ( request === '@tryaura/ai-models' ) {
		return 'try-aura-ai-models';
	}

	return undefined;
};

module.exports = {
	requestToExternal,
	requestToHandle,
};

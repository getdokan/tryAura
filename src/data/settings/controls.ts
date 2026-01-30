import apiFetch from '@wordpress/api-fetch';

const controls = {
	API_FETCH( action: any ) {
		return apiFetch( {
			path: action.path,
			method: action.method || 'GET',
			data: action.data,
		} );
	},
};

export default controls;

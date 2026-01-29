import * as actionTypes from './action-types';

export function setSettings( settings: any ) {
	return {
		type: actionTypes.SET_SETTINGS,
		settings,
	};
}

export function setIsFetching( isFetching: boolean ) {
	return {
		type: actionTypes.SET_IS_FETCHING,
		isFetching,
	};
}

export function setIsSaving( isSaving: boolean ) {
	return {
		type: actionTypes.SET_IS_SAVING,
		isSaving,
	};
}

export function* updateSettings( settings: any ) {
	yield setIsSaving( true );
	try {
		const result = yield {
			type: 'API_FETCH',
			path: '/tryaura/v1/settings',
			method: 'POST',
			data: settings,
		};
		yield setSettings( result );
		return result;
	} finally {
		yield setIsSaving( false );
	}
}

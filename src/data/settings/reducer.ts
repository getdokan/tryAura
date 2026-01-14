import * as actionTypes from './action-types';

const initialState = {
	settings: {},
	isFetching: false,
	isSaving: false,
};

const reducer = ( state = initialState, action: any ) => {
	switch ( action.type ) {
		case actionTypes.SET_SETTINGS:
			return {
				...state,
				settings: action.settings,
			};
		case actionTypes.SET_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};
		case actionTypes.SET_IS_SAVING:
			return {
				...state,
				isSaving: action.isSaving,
			};
		default:
			return state;
	}
};

export default reducer;

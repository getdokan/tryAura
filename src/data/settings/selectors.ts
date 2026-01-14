export function getSettings( state: any ) {
	return state.settings;
}

export function isFetchingSettings( state: any ) {
	return state.isFetching;
}

export function isSavingSettings( state: any ) {
	return state.isSaving;
}

export function getSetting( state: any, key: string, defaultValue: any = null ) {
	const settings = getSettings( state );
	return settings[ key ] !== undefined ? settings[ key ] : defaultValue;
}

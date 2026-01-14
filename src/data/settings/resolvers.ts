import { setSettings, setIsFetching } from './actions';

export function* getSettings() {
	yield setIsFetching( true );
	try {
		const result = yield {
			type: 'API_FETCH',
			path: '/try-aura/v1/settings',
		};
		yield setSettings( result );
	} finally {
		yield setIsFetching( false );
	}
}

export const getSetting = getSettings;

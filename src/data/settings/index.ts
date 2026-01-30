import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';
import controls from './controls';

export const STORE_NAME = 'try-aura/settings';

const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
} );

register( store );

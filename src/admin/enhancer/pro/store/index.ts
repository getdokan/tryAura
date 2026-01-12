import { createReduxStore, register } from '@wordpress/data';
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

export const PRO_STORE_NAME = 'try-aura/enhancer-pro';

const store = createReduxStore( PRO_STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

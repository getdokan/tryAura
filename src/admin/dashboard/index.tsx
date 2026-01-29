import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import App from './App';
import './style.scss';
import menuFix from './utils/menu-fix.js';

domReady( () => {
	const dashboardDomNode = document.getElementById(
		'tryaura-settings-root'
	);
	if ( dashboardDomNode ) {
		const dashboardRoot = createRoot( dashboardDomNode! );
		dashboardRoot.render( <App /> );
	}
} );
menuFix( 'tryaura' );

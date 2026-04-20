import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import App from './App';
import './style.css';
import menuFix from './utils/menu-fix.js';

const SHADOW_ROOT_ID = 'tryaura-dashboard-shadow-root';

const STYLE_SELECTORS = [
	'link#tryaura-admin-css',
	'link#tryaura-components-css',
	'link#wp-components-css',
	'link[href*="/build/admin/dashboard/index.css"]',
	'link[href*="/build/admin/dashboard/style-index.css"]',
	'link[href*="/build/style-components.css"]',
];

function mirrorStylesIntoShadow( shadowRoot: ShadowRoot ) {
	const styleHost = document.createElement( 'div' );
	styleHost.setAttribute( 'data-tryaura-shadow-styles', 'true' );
	shadowRoot.prepend( styleHost );

	const seen = new Set< string >();

	const syncStyles = () => {
		const styleSources = document.querySelectorAll< HTMLLinkElement >(
			STYLE_SELECTORS.join( ', ' )
		);

		styleSources.forEach( ( source ) => {
			const href = source.href;

			if ( ! href || seen.has( href ) ) {
				return;
			}

			const clone = document.createElement( 'link' );
			clone.rel = 'stylesheet';
			clone.href = href;
			clone.media = source.media || 'all';
			styleHost.appendChild( clone );
			seen.add( href );
		} );
	};

	syncStyles();

	const observer = new MutationObserver( () => {
		syncStyles();
	} );

	observer.observe( document.head, {
		childList: true,
		subtree: true,
	} );

	return () => observer.disconnect();
}

domReady( () => {
	const dashboardDomNode = document.getElementById( 'tryaura-settings-root' );

	if ( dashboardDomNode ) {
		const shadowRoot =
			dashboardDomNode.shadowRoot ||
			dashboardDomNode.attachShadow( { mode: 'open' } );

		let appRoot = shadowRoot.getElementById(
			SHADOW_ROOT_ID
		) as HTMLDivElement | null;

		if ( ! appRoot ) {
			appRoot = document.createElement( 'div' );
			appRoot.id = SHADOW_ROOT_ID;
			appRoot.className = 'tryaura';
			shadowRoot.appendChild( appRoot );
		}

		mirrorStylesIntoShadow( shadowRoot );

		const dashboardRoot = createRoot( appRoot );
		dashboardRoot.render( <App /> );
	}
} );
menuFix( 'tryaura' );

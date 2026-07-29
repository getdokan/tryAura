import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { ThemeProvider } from '@wedevs/plugin-ui';
import App from './App';
import TopBar from './TopBar';
import './style.scss';
import menuFix from './utils/menu-fix.js';

domReady( () => {
	// The Top Bar mounts in its own root, so it carries the `tryaura` class
	// itself (see TopBar.tsx) to sit inside the importantized Tailwind scope.
	const headerDomNode = document.getElementById( 'tryaura-admin-header' );
	if ( headerDomNode ) {
		createRoot( headerDomNode ).render(
			<ThemeProvider pluginId="tryaura" storageKey={ false }>
				<TopBar />
			</ThemeProvider>
		);
	}

	const dashboardDomNode = document.getElementById( 'tryaura-settings-root' );
	if ( dashboardDomNode ) {
		const dashboardRoot = createRoot( dashboardDomNode! );
		dashboardRoot.render( <App /> );
	}
} );
menuFix( 'tryaura' );

import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { ThemeProvider } from '@wedevs/plugin-ui';
import App from './App';
import TopBar from './TopBar';
import './style.scss';
// Own file (not part of style.scss): a second Tailwind compilation that
// re-emits the Top Bar's utilities at ID specificity. See the comment inside.
// Must be named style.css so wp-scripts merges it into style-index.css.
import './topbar/style.css';
import menuFix from './utils/menu-fix.js';

domReady( () => {
	// The Top Bar mounts in its own root, outside the `.tryaura` Tailwind
	// scope, so the plugin's importantized utilities can't reach plugin-ui.
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

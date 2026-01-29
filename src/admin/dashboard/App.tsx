import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { withRouter } from '../../utils/router';
import Layout from './Layout/Layout';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import GeminiSettings from './pages/Settings/Gemini/GeminiSettings';
import TryOnControlSettings from './pages/Settings/Woocommerce/TryOnControl/TryOnControlSettings';

export type TryAuraAdminRoute = {
	id: string;
	element: JSX.Element | React.ReactNode;
	path: string;
	parent?: string;
};

const getAdminRoutes = () => {
	// @ts-ignore
	const wcExists = window?.tryAura?.wcExists ?? false;

	let routes: Array< TryAuraAdminRoute > = [
		{
			id: 'dashboard',
			element: <Dashboard />,
			path: '/',
		},
		{
			id: 'settings',
			element: <Settings />,
			path: '/settings',
		},
		{
			id: 'settings-gemini',
			element: <GeminiSettings />,
			path: '/settings/gemini',
		},
	];
	if ( wcExists ) {
		routes.push( {
			id: 'try-on-control',
			element: <TryOnControlSettings />,
			path: '/settings/try-on-control',
		} );
	}

	// @ts-ignore
	routes = applyFilters(
		'tryaura-admin-dashboard-routes',
		routes
	) as Array< TryAuraAdminRoute >;

	routes.push( {
		id: 'tryaura-404',
		element: <p>{ __( 'Page not found', 'tryaura' ) }</p>,
		path: '*',
	} );

	return routes;
};

function App() {
	const routes = getAdminRoutes();

	const mapedRoutes = routes.map( ( route ) => {
		const WithRouterComponent = withRouter( route.element );

		return {
			path: route.path,
			element: (
				<Layout route={ route }>
					<WithRouterComponent />
				</Layout>
			),
		};
	} );

	const router = createHashRouter( mapedRoutes );

	return (
		<>
			<RouterProvider router={ router } />
		</>
	);
}

export default App;

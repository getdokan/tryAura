import Settings from './pages/Settings';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { withRouter } from '../../utils/router';
import Layout from './Layout/Layout';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

export type TryAuraAdminRoute = {
	id: string;
	element: JSX.Element | React.ReactNode;
	path: string;
	parent?: string;
};

const getAdminRoutes = () => {
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
	];

	// @ts-ignore
	routes = applyFilters(
		'tryaura-admin-dashboard-routes',
		routes
	) as Array< TryAuraAdminRoute >;

	routes.push( {
		id: 'tryaura-404',
		element: <p>{ __( 'Page not found', 'try-aura' ) }</p>,
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

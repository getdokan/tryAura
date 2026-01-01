import {
	useNavigate,
	useParams,
	useLocation,
	redirect,
	replace,
	useMatches,
	useNavigation,
	createSearchParams,
	useSearchParams,
} from 'react-router-dom';
import {
	isValidElement,
	cloneElement,
	createElement,
} from '@wordpress/element';

export function withRouter( Component ) {
	function ComponentWithRouterProp( props ) {
		const navigate = useNavigate();
		const params = useParams();
		const location = useLocation();
		const matches = useMatches();
		const navigation = useNavigation();

		const routerProps = {
			navigate,
			params,
			location,
			redirect,
			replace,
			matches,
			navigation,
			useParams,
			createSearchParams,
			useSearchParams,
		};

		// Check if Component is a valid element
		if ( isValidElement( Component ) ) {
			// If it's a valid element, clone it and pass the router props
			return cloneElement( Component, { ...props, ...routerProps } );
		}

		// If it's a function component, render it with the router props
		return createElement( Component, {
			...props,
			...routerProps,
		} );
	}

	return ComponentWithRouterProp;
}

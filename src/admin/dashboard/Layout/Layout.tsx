import { SlotFillProvider } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';

const Layout = ( { children, route } ) => {
	return (
		<SlotFillProvider>
			{ children }
			<PluginArea scope={ 'tryaura-admin-dashboard-' + route.id } />
		</SlotFillProvider>
	);
};

export default Layout;

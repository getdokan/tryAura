import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import ScanFace from './ScanFace';
import SettingItemCard from '../../components/SettingItemCard';

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl: string;
			nonce: string;
			apiKey: string;
			optionKey: string;
		};
	}
}

function Index() {
	const { settings, fetching } = useSelect( ( select ) => {
		return {
			settings: select( STORE_NAME ).getSettings(),
			fetching: select( STORE_NAME ).isFetchingSettings(),
		};
	}, [] );

	const data = window.tryAura!;
	const woocommerceSettings = settings[ data.optionKey ]?.woocommerce;
	const bulkTryOnEenabled = woocommerceSettings?.bulkTryOnEenabled;

	return (
		<SettingItemCard
			icon={
				<div className="w-15.75 h-15.5 border border-neutral-200 rounded-2xl flex justify-center items-center">
					<ScanFace />
				</div>
			}
			title={ __( 'Bulk Try-On Control', 'try-aura' ) }
			badge={
				woocommerceSettings && (
					<p className="text-primary bg-primary/10 rounded m-0 py-1 px-3">
						{ bulkTryOnEenabled
							? __( 'Enable for All Products', 'try-aura' )
							: __( 'Disable for All Products', 'try-aura' ) }
					</p>
				)
			}
			subTitle={ __(
				'Enable or disable try-on for all products in your store.',
				'try-aura'
			) }
			link={ '/settings/try-on-control' }
			linkText={ __( 'Configure', 'try-aura' ) }
			loading={ fetching }
		/>
	);
}

export default Index;

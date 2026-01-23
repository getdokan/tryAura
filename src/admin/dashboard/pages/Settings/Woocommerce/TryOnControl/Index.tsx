import { Button } from '../../../../../../components';
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
// @ts-ignore
import { STORE_NAME } from '@tryaura/settings';
import ScanFace from './ScanFace';

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
	const navigate = useNavigate();
	const { settings } = useSelect( ( select ) => {
		return {
			settings: select( STORE_NAME ).getSettings(),
		};
	}, [] );

	const data = window.tryAura!;
	const woocommerceSettings = settings[ data.optionKey ]?.woocommerce;
	const bulkTryOnEenabled = woocommerceSettings?.bulkTryOnEenabled;

	return (
		<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-[24px] rounded-[16px]">
			<div className="flex">
				<div className="w-15.75 h-15.5 border border-neutral-200 rounded-2xl flex justify-center items-center mr-3.5">
					<ScanFace />
				</div>
				<div className="flex flex-col justify-center">
					<div className="flex mb-[10px] items-center">
						<div className="font-[600] text-[16px] leading-[22px] text-[rgba(37,37,45,1)]">
							{ __( 'Bulk Try-On Control', 'try-aura' ) }
						</div>
						<div className="ml-[12px]">
							{ woocommerceSettings && (
								<p className="text-primary bg-primary/10 rounded m-0 py-1 px-3">
									{ bulkTryOnEenabled
										? __(
												'Enable for All Products',
												'try-aura'
										  )
										: __(
												'Disable for All Products',
												'try-aura'
										  ) }
								</p>
							) }
						</div>
					</div>

					<div className="font-[400] text-[14px] leading-[18px] text-[rgba(99,99,99,1)]">
						{ __(
							'Enable or disable try-on for all products in your store.',
							'try-aura'
						) }
					</div>
				</div>
			</div>
			<div className="flex items-center">
				<Button
					className="py-3 px-7"
					onClick={ () => {
						navigate( '/settings/try-on-control' );
					} }
				>
					Configure
				</Button>
			</div>
		</div>
	);
}

export default Index;

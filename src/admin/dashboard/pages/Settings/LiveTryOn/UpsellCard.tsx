import { __ } from '@wordpress/i18n';
import { Camera } from 'lucide-react';
import { Button, CrownIcon } from '../../../../../components';
import { getUpgradeToProUrl } from '../../../../../utils/tryaura';

/**
 * Live Try-On card shown on the Settings page when Pro is not active.
 */
function LiveTryOnUpsellCard() {
	return (
		<div className="flex justify-between flex-wrap bg-[#FFFFFF] border-2 border-[#FFFFFF] p-[24px] rounded-[16px]">
			<div className="flex">
				<div className="mr-3.5">
					<div className="w-15.75 h-15.5 border border-neutral-200 rounded-2xl flex justify-center items-center">
						<Camera
							size={ 26 }
							className="text-[rgba(37,37,45,1)]"
						/>
					</div>
				</div>
				<div className="flex flex-col justify-center">
					<div className="flex mb-2.5 items-center">
						<div className="font-semibold text-[16px] leading-5.5 text-[rgba(37,37,45,1)]">
							{ __( 'Live Try-On', 'tryaura' ) }
						</div>
						<div className="ml-3">
							<p className="flex items-center gap-1 bg-[rgba(239,187,64,0.15)] text-[rgba(146,104,10,1)] rounded m-0 py-1 px-3 text-[12px] font-semibold">
								<CrownIcon />
								{ __( 'Pro', 'tryaura' ) }
							</p>
						</div>
					</div>

					<div className="font-normal text-[14px] leading-4.5 text-[rgba(99,99,99,1)]">
						{ __(
							'Let shoppers see themselves wearing a product on camera, in real time.',
							'tryaura'
						) }
					</div>
				</div>
			</div>
			<div className="flex items-center">
				<Button
					// @ts-ignore Button renders an anchor for type "link".
					type="link"
					href={ getUpgradeToProUrl() }
					target="_blank"
					rel="noopener noreferrer"
					className="py-3 px-7 no-underline hover:text-white"
				>
					{ __( 'Upgrade to Pro', 'tryaura' ) }
				</Button>
			</div>
		</div>
	);
}

export default LiveTryOnUpsellCard;

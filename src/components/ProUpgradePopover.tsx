import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Play } from 'lucide-react';
import Button from './Button';
import { getUpgradeToProUrl } from '../utils/tryaura';

interface ProUpgradePopoverProps {
	anchor: any;
	isOpen: boolean;
	onClose: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	message?: string;
	upgradeUrl?: string;
}

function ProUpgradePopover( {
	anchor,
	isOpen,
	onClose,
	onMouseEnter,
	onMouseLeave,
	message = __( 'Unlock advanced features with a pro account.', 'tryaura' ),
	upgradeUrl = getUpgradeToProUrl(),
}: ProUpgradePopoverProps ) {
	if ( ! isOpen || ! anchor ) {
		return null;
	}

	return (
		<Popover
			anchor={ anchor }
			onClose={ onClose }
			placement="top"
			focusOnMount={ false }
			className="tryaura tryaura-tooltip-popover"
		>
			<div
				className="bg-black text-white p-4 rounded-[5px] flex flex-col items-center gap-3 w-46.25 text-center"
				onMouseEnter={ onMouseEnter }
				onMouseLeave={ onMouseLeave }
			>
				<p className="m-0 text-[12px] leading-[1.4] font-normal">
					{ message }
				</p>
				<Button
					type="link"
					href={ upgradeUrl }
					target="_blank"
					rel="noopener noreferrer"
					className="w-29.75 h-7 text-[12px] leading-none font-medium"
				>
					{ __( 'Upgrade to Pro', 'tryaura' ) }
				</Button>

				<Play
					color="black"
					className="fill-black absolute rotate-90 top-[90%]"
				/>
			</div>
		</Popover>
	);
}

export default ProUpgradePopover;

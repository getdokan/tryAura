import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Lock } from 'lucide-react';
import { CrownIcon } from '../../../components';
import ProUpgradePopover from '../../../components/ProUpgradePopover';
import { getUpgradeToProUrl } from '../../../utils/tryaura';

/**
 * Non-Pro teaser for the "Start from a look" template row (#26). Shows sample
 * looks locked with an upgrade popover — the real, working row is injected by
 * the Pro plugin via the `tryaura.enhancer.image_template_row` filter.
 */
const SAMPLE_LOOKS = [
	__( 'Studio white', 'tryaura' ),
	__( 'Lifestyle', 'tryaura' ),
	__( 'Flat lay', 'tryaura' ),
	__( 'Marble', 'tryaura' ),
	__( 'Wood table', 'tryaura' ),
	__( 'Outdoor', 'tryaura' ),
];

function LockedTemplateTeaser() {
	const [ anchor, setAnchor ] = useState< SVGSVGElement | null >( null );
	const [ isOpen, setIsOpen ] = useState( false );
	const hoverTimeout = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);

	const message = __(
		'Unlock curated "looks" and save your own presets with a Pro account.',
		'tryaura'
	);

	const clearHover = () => {
		if ( hoverTimeout.current ) {
			clearTimeout( hoverTimeout.current );
			hoverTimeout.current = null;
		}
	};
	const open = () => {
		clearHover();
		setIsOpen( true );
	};
	const close = () => {
		clearHover();
		hoverTimeout.current = setTimeout( () => setIsOpen( false ), 150 );
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-row items-center justify-between">
				<span className="flex items-center gap-1 text-[14px] font-medium text-[#929296]">
					{ __( 'Start from a look', 'tryaura' ) }
					<CrownIcon
						// @ts-ignore
						ref={ setAnchor }
						className="text-[14px] cursor-pointer"
						onMouseEnter={ open }
						onMouseLeave={ close }
						onFocus={ open }
						onBlur={ close }
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Upgrade to Pro', 'tryaura' ) }
					/>
				</span>
			</div>

			<div
				className="flex flex-row flex-wrap gap-2 cursor-pointer"
				onMouseEnter={ open }
				onMouseLeave={ close }
			>
				{ SAMPLE_LOOKS.map( ( label ) => (
					<span
						key={ label }
						className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-full border border-[#E9E9E9] bg-[#F7F7F7] text-[#A5A5AA] select-none"
					>
						<Lock size={ 12 } />
						{ label }
					</span>
				) ) }
			</div>

			<ProUpgradePopover
				anchor={ anchor }
				isOpen={ isOpen }
				onClose={ () => setIsOpen( false ) }
				onMouseEnter={ open }
				onMouseLeave={ close }
				message={ message }
				upgradeUrl={ getUpgradeToProUrl() }
			/>
		</div>
	);
}

export default LockedTemplateTeaser;

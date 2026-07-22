import { useSelect, useDispatch } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { twMerge } from 'tailwind-merge';
import { STORE_NAME } from '../store';
import { CrownIcon } from '../../../components';
import ProUpgradePopover from '../../../components/ProUpgradePopover';
import ConfigFooter from './ConfigFooter';
import { getEditPresets, getEditPreset } from '../editPresets';
import { getUpgradeToProUrl, hasPro } from '../../../utils/tryaura';

// Edit tab (#32, feasible part): a Pro, targeted-edit panel. The merchant picks
// an edit type and/or types a refinement; the change is scoped by wording and
// the rest of the product is preserved by the existing edit prompt path. There
// is no brush — pixel masking is Vertex-only and out of scope for BYOK.
function EditConfigInputs( { doGenerate } ) {
	const { imageConfigData, generatedUrl, isBusy, uploading } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );
			return {
				imageConfigData: store.getImageConfigData(),
				generatedUrl: store.getGeneratedUrl(),
				isBusy: store.isBusy(),
				uploading: store.getUploading(),
			};
		},
		[]
	);
	const { setImageConfigData } = useDispatch( STORE_NAME );

	const isPro = hasPro();
	const presets = getEditPresets();
	const activePreset = imageConfigData?.editPreset || '';
	const editInstruction = imageConfigData?.editInstruction || '';

	const [ popoverAnchor, setPopoverAnchor ] =
		useState< SVGSVGElement | null >( null );
	const [ isPopoverOpen, setIsPopoverOpen ] = useState( false );
	const hoverTimeout = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const proMessage = __(
		'Targeted editing — remove text, recolor, remove objects, clean up and swap backgrounds — is a Pro feature.',
		'tryaura'
	);
	const clearHover = () => {
		if ( hoverTimeout.current ) {
			clearTimeout( hoverTimeout.current );
			hoverTimeout.current = null;
		}
	};
	const openPopover = () => {
		clearHover();
		setIsPopoverOpen( true );
	};
	const closePopover = () => {
		clearHover();
		hoverTimeout.current = setTimeout(
			() => setIsPopoverOpen( false ),
			150
		);
	};

	const onSelectPreset = ( id: string ) => {
		if ( ! isPro ) {
			return;
		}
		setImageConfigData( { editPreset: activePreset === id ? '' : id } );
	};

	const placeholder =
		getEditPreset( activePreset )?.placeholder ||
		__(
			"e.g. 'remove the printed text', 'make the shirt navy blue'",
			'tryaura'
		);

	return (
		<>
			<div className="flex flex-row gap-2 items-center">
				<span className="text-[16px] font-semibold">
					{ __( 'Targeted edit', 'tryaura' ) }
				</span>
				{ ! isPro && (
					<CrownIcon
						// @ts-ignore
						ref={ setPopoverAnchor }
						className="text-[14px] cursor-pointer"
						onMouseEnter={ openPopover }
						onMouseLeave={ closePopover }
						onFocus={ openPopover }
						onBlur={ closePopover }
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Upgrade to Pro', 'tryaura' ) }
					/>
				) }
			</div>
			<span className="text-[13px] text-[#828282] leading-snug">
				{ __(
					'Pick an edit and describe just that change — the rest of the product stays untouched.',
					'tryaura'
				) }
			</span>

			<div className="flex flex-col gap-2 mt-1">
				<span
					className={ twMerge(
						'text-[14px] font-medium',
						! isPro ? 'text-[#929296]' : ''
					) }
				>
					{ __( 'Quick edits', 'tryaura' ) }
				</span>
				<div className="flex flex-row flex-wrap gap-2">
					{ presets.map( ( preset ) => (
						<button
							key={ preset.id }
							type="button"
							onClick={ () => onSelectPreset( preset.id ) }
							disabled={ isBusy || ! isPro }
							className={ twMerge(
								'inline-flex items-center px-3 py-1.5 text-[13px] rounded-full border cursor-pointer transition-colors',
								activePreset === preset.id
									? 'border-primary bg-[#EEF0FF] text-primary'
									: 'border-[#E9E9E9] bg-white text-[#333] hover:border-primary',
								isBusy || ! isPro
									? 'opacity-60 pointer-events-none'
									: ''
							) }
						>
							{ preset.label }
						</button>
					) ) }
				</div>
			</div>

			<label
				style={ { display: 'flex', flexDirection: 'column', gap: 4 } }
				htmlFor="tryaura-edit-instruction"
				className="mt-1"
			>
				<span
					className={ twMerge(
						'text-[14px] font-medium mb-1',
						! isPro ? 'text-[#929296]' : ''
					) }
				>
					{ __( 'Edit instruction', 'tryaura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#A5A5AA] max-h-44 focus:shadow-none focus:ring-1 focus:ring-primary"
					value={ editInstruction }
					onChange={ ( e: any ) =>
						isPro &&
						setImageConfigData( {
							editInstruction: e.target.value,
						} )
					}
					disabled={ isBusy || ! isPro }
					rows={ 3 }
					id="tryaura-edit-instruction"
					placeholder={ placeholder }
				/>
			</label>

			<ProUpgradePopover
				anchor={ popoverAnchor }
				isOpen={ ! isPro && isPopoverOpen }
				onClose={ () => setIsPopoverOpen( false ) }
				onMouseEnter={ openPopover }
				onMouseLeave={ closePopover }
				message={ proMessage }
				upgradeUrl={ getUpgradeToProUrl() }
			/>

			{ /* Editing is Pro-only, so only Pro sees the action. */ }
			{ isPro && (
				<ConfigFooter
					generatedUrl={ generatedUrl }
					doGenerate={ doGenerate }
					isBusy={ isBusy }
					uploading={ uploading }
					downloadName="edited.png"
					// An edit is a directive on its own; no separate prompt needed.
					bypassPromptRequirement={ true }
					primaryLabel={ __( 'Apply edit', 'tryaura' ) }
					primaryBusyLabel={ __( 'Applying…', 'tryaura' ) }
					regenerateLabel={ __( 'Re-apply', 'tryaura' ) }
					regenerateBusyLabel={ __( 'Applying…', 'tryaura' ) }
				/>
			) }
		</>
	);
}

export default EditConfigInputs;

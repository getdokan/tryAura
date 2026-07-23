import { useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, X } from 'lucide-react';
import { STORE_NAME } from '../store';

// Gemini image accepts up to ~14 reference images; keep a small headroom for
// the primary/selected source image(s).
export const MAX_IMAGE_REFERENCES = 14;

/**
 * "Reference angles" strip (#28). Merchants add extra photos of the real product
 * so the model keeps logos, colour and shape accurate. Stored as data URLs and
 * sent as additional inlineData parts at generation time.
 */
function ReferenceAngles() {
	const { imageConfigData, isBusy } = useSelect( ( select ) => {
		const store: any = select( STORE_NAME );
		return {
			imageConfigData: store.getImageConfigData(),
			isBusy: store.isBusy(),
		};
	}, [] );
	const { setImageConfigData } = useDispatch( STORE_NAME );
	const fileInputRef = useRef< HTMLInputElement | null >( null );

	const references: string[] = imageConfigData?.referenceImages || [];

	const onPickFiles = ( e: any ) => {
		const files: File[] = Array.from( e?.target?.files || [] );
		if ( ! files.length ) {
			return;
		}
		Promise.all(
			files.map(
				( file ) =>
					new Promise< string >( ( resolve, reject ) => {
						const reader = new FileReader();
						reader.onloadend = () =>
							resolve( reader.result as string );
						reader.onerror = reject;
						reader.readAsDataURL( file );
					} )
			)
		)
			.then( ( dataUrls ) => {
				const next = [ ...references, ...dataUrls ].slice(
					0,
					MAX_IMAGE_REFERENCES
				);
				setImageConfigData( { referenceImages: next } );
			} )
			.catch( () => {
				// ignore unreadable files
			} );
		e.target.value = '';
	};

	const removeAt = ( idx: number ) => {
		const next = references.filter( ( _, i ) => i !== idx );
		setImageConfigData( { referenceImages: next } );
	};

	const canAddMore = references.length < MAX_IMAGE_REFERENCES;

	return (
		<div className="flex flex-col gap-2">
			<span className="text-[13px] font-medium">
				{ __( 'Reference angles', 'tryaura' ) }
			</span>
			<span className="text-[11px] text-[#828282] leading-snug">
				{ __(
					'Add more photos of the real product so the AI keeps logos, colour and shape accurate.',
					'tryaura'
				) }
			</span>
			<div className="flex flex-row flex-wrap gap-2 mt-1">
				{ references.map( ( url, idx ) => (
					<div
						key={ idx }
						className="relative w-[56px] h-[56px] rounded-[6px] border border-[#E9E9E9] overflow-hidden bg-[#F7F7F7]"
					>
						<img
							src={ url }
							alt={ __( 'Reference', 'tryaura' ) }
							className="w-full h-full object-cover"
						/>
						{ ! isBusy && (
							<button
								type="button"
								onClick={ () => removeAt( idx ) }
								aria-label={ __(
									'Remove reference',
									'tryaura'
								) }
								className="absolute top-0.5 right-0.5 w-[16px] h-[16px] rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer border-0"
							>
								<X size={ 10 } />
							</button>
						) }
					</div>
				) ) }
				{ canAddMore && (
					<button
						type="button"
						onClick={ () => fileInputRef.current?.click() }
						disabled={ isBusy }
						aria-label={ __( 'Add reference photo', 'tryaura' ) }
						className="w-[56px] h-[56px] rounded-[6px] border border-dashed border-[#C9C9C9] flex items-center justify-center cursor-pointer bg-transparent text-[#A5A5AA] hover:text-primary hover:border-primary disabled:opacity-60"
					>
						<Plus size={ 18 } />
					</button>
				) }
			</div>
			<input
				ref={ fileInputRef }
				type="file"
				accept="image/*"
				multiple
				onChange={ onPickFiles }
				className="hidden"
			/>
		</div>
	);
}

export default ReferenceAngles;

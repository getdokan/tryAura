import PreviewModal from './PreviewModal';
import { __ } from '@wordpress/i18n';
import { createPortal, useState } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';
import toast, { Toaster } from 'react-hot-toast';

const EnhanceButton = () => {
	const [ open, setOpen ] = useState( false );
	const [ previewUrls, setPreviewUrls ] = useState< string[] >( [] );
	const [ attachmentIds, setAttachmentIds ] = useState< number[] >( [] );
	const [ loading, setLoading ] = useState( false );

	const handleClick = () => {
		setLoading( true );
		try {
			// Prefer the current global media frame if available, otherwise fall back to the Featured Image frame.
			let frameObj =
				wp?.media?.frame ||
				( wp?.media?.featuredImage?.frame
					? wp.media.featuredImage.frame()
					: null );
			frameObj = applyFilters( 'tryaura.media_frame', frameObj );
			const state =
				typeof frameObj?.state === 'function' ? frameObj.state() : null;
			const collection = state?.get?.( 'selection' );
			const models =
				collection?.models ||
				( collection?.toArray ? collection.toArray() : [] );
			const items = ( models || [] )
				.map( ( m: any ) =>
					typeof m?.toJSON === 'function' ? m.toJSON() : m
				)
				.filter( ( j: any ) => j && j.url && j.id );
			if ( ! items.length ) {
				toast.error(
					__( 'Please select at least one image.', 'try-aura' )
				);
				return;
			}
			setPreviewUrls(
				applyFilters(
					'tryaura.enhancer_preview_urls',
					items.map( ( j: any ) => j.url )
				)
			);
			setAttachmentIds(
				applyFilters(
					'tryaura.enhancer_preview_ids',
					items.map( ( j: any ) => j.id )
				)
			);

			doAction( 'tryaura.media_frame_open_before', frameObj );
			setOpen( true );
			doAction( 'tryaura.media_frame_open_after', frameObj );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
			toast.error(
				__( 'Unable to read current selection.', 'try-aura' )
			);

			doAction( 'tryaura.media_frame_error', e );
		} finally {
			setLoading( false );
		}
	};

	const ToasterPortal = () => {
		return createPortal(
			<Toaster
				position="bottom-right"
				containerClassName="tryaura-toast-root"
			/>,
			document.body // Target: renders directly at the end of the <body>
		);
	};

	return (
		<div>
			<button
				className="button media-button button-primary button-large"
				onClick={ handleClick }
				disabled={ loading }
			>
				{ __( 'Enhance with AI', 'try-aura' ) }
			</button>
			{ open && previewUrls.length > 0 && (
				<PreviewModal
					imageUrls={ previewUrls }
					attachmentIds={ attachmentIds }
					onClose={ () => {
						setOpen( false );
						doAction( 'tryaura.media_frame_modal_closed' );
					} }
					supportsVideo={ applyFilters(
						'tryaura.media_frame_modal_supports_video',
						true
					) }
				/>
			) }

			<ToasterPortal />
		</div>
	);
};

export default EnhanceButton;

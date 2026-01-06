import PreviewModal from './PreviewModal';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState, createPortal } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';
import toast, { Toaster } from 'react-hot-toast';

const EnhanceButton = () => {
	const [ open, setOpen ] = useState( false );
	const [ previewUrls, setPreviewUrls ] = useState< string[] >( [] );
	const [ attachmentIds, setAttachmentIds ] = useState< number[] >( [] );
	const [ loading, setLoading ] = useState( false );
	const modalContainerRef = useRef< HTMLDivElement | null >( null );
	const [ portalContainer, setPortalContainer ] =
		useState< HTMLDivElement | null >( null );

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

	// Render the modal into document.body to avoid toolbar overflow/stacking issues.
	useEffect( () => {
		if ( ! open || previewUrls.length === 0 ) {
			// cleanup if exists
			if ( modalContainerRef.current ) {
				modalContainerRef.current.remove();
				modalContainerRef.current = null;
				setPortalContainer( null );
			}
			return;
		}

		if ( ! modalContainerRef.current ) {
			let container = document.createElement( 'div' );
			container.id = 'try-aura-ai-modal-root';
			container.className = 'tryaura';
			container = applyFilters(
				'tryaura.media_frame_modal_container',
				container
			);
			document.body.appendChild( container );
			modalContainerRef.current = container;
			setPortalContainer( container );

			doAction(
				'tryaura.media_frame_modal_container_created',
				container,
				modalContainerRef
			);
		}
	}, [ open, previewUrls, attachmentIds ] );

	useEffect( () => {
		return () => {
			// Ensure cleanup on component unmount
			if ( modalContainerRef.current ) {
				modalContainerRef.current.remove();
				modalContainerRef.current = null;
			}
		};
	}, [] );

	return (
		<div>
			<button
				className="button media-button button-primary button-large"
				onClick={ handleClick }
				disabled={ loading }
			>
				{ __( 'Enhance with AI', 'try-aura' ) }
			</button>
			{ open &&
				previewUrls.length > 0 &&
				portalContainer &&
				createPortal(
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
					/>,
					portalContainer
				) }

			{ ! open && <Toaster position="bottom-right" /> }
		</div>
	);
};

export default EnhanceButton;

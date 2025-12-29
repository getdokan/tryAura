import PreviewModal from './PreviewModal';
import { __ } from '@wordpress/i18n';
import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';

const EnhanceButton = () => {
	const [ open, setOpen ] = useState( false );
	const [ previewUrls, setPreviewUrls ] = useState< string[] >( [] );
	const [ attachmentIds, setAttachmentIds ] = useState< number[] >( [] );
	const [ loading, setLoading ] = useState( false );
	const modalContainerRef = useRef< HTMLDivElement | null >( null );
	const modalRootRef = useRef< any >( null );

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
				window.alert(
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
			window.alert(
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
				try {
					modalRootRef.current?.unmount?.();
				} catch {}
				modalContainerRef.current.remove();
				modalContainerRef.current = null;
				modalRootRef.current = null;
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

			doAction(
				'tryaura.media_frame_modal_container_created',
				container,
				modalContainerRef
			);
		}

		const container = modalContainerRef.current!;
		if ( ! modalRootRef.current ) {
			modalRootRef.current = ( createRoot as any )( container );
		}
		modalRootRef.current.render(
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
		);

		return () => {
			// On deps change or unmount, we re-render on next effect; do not remove here unless closing
		};
	}, [ open, previewUrls, attachmentIds ] );

	useEffect( () => {
		return () => {
			// Ensure cleanup on component unmount
			if ( modalContainerRef.current ) {
				try {
					modalRootRef.current?.unmount?.();
				} catch {}
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
		</div>
	);
};

export default EnhanceButton;

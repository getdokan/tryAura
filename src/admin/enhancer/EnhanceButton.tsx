import PreviewModal from './PreviewModal';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addAction, applyFilters, doAction } from '@wordpress/hooks';
import { toast } from '@tryaura/components';
import { getMediaSelectedItems } from '../../utils/tryaura';

const EnhanceButton = () => {
	const [ open, setOpen ] = useState( false );
	const [ previewUrls, setPreviewUrls ] = useState< string[] >( [] );
	const [ attachmentIds, setAttachmentIds ] = useState< number[] >( [] );
	const [ loading, setLoading ] = useState( false );
	const [ disable, setDisable ] = useState( true );

	const handleClick = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		setLoading( true );
		try {
			const { items } = getMediaSelectedItems();
			if ( ! items.length ) {
				toast.error(
					__( 'Please select at least one image.', 'try-aura' )
				);
				return;
			}
			const isOnlyImagesSelected = items.every(
				( item: any ) => item.type === 'image'
			);

			if ( ! isOnlyImagesSelected ) {
				toast.error(
					__(
						'Please select only image(s) for enhancement.',
						'try-aura'
					)
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

			doAction( 'tryaura.media_frame_open_before' );
			setOpen( true );
			doAction( 'tryaura.media_frame_open_after' );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( err );
			toast.error(
				__( 'Unable to read current selection.', 'try-aura' )
			);

			doAction( 'tryaura.media_frame_error', err );
		} finally {
			setLoading( false );
		}
	};

	const updateButtonState = () => {
		const { items } = getMediaSelectedItems();

		const isOnlyImagesSelected = items.every(
			( item: any ) => item.type === 'image'
		);

		const status = items.length === 0 || ! isOnlyImagesSelected;

		setDisable( status );
	};
	addAction(
		'tryaura.admin_wp_media_selection_changed',
		'tryaura.admin_wp_media_selection_changed',
		updateButtonState
	);

	useEffect( () => {
		const { frameObj } = getMediaSelectedItems();
		const found = jQuery( frameObj.el ).find( 'div.attachment-details' );
		setDisable( ! found?.length );
	}, [] );

	return (
		<div>
			<button
				className="button media-button button-primary button-large tryaura-admin-enhance-button"
				onClick={ handleClick }
				disabled={ loading || disable }
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
		</div>
	);
};

export default EnhanceButton;

import { Modal } from '@wordpress/components';
import { createRoot, render, useState } from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import './style.scss';
import { X } from "lucide-react";
import { getYoutubeId } from '../../utils/tryaura';

interface VideoModalProps {
	videoUrl: string;
	videoPlatform: string;
	onClose: () => void;
}

const DEFAULT_ASPECT_RATIO = 16 / 9;

const VideoModal = ( {
	videoUrl,
	videoPlatform,
	onClose,
}: VideoModalProps ) => {
	const [ aspectRatio, setAspectRatio ] = useState< number >( DEFAULT_ASPECT_RATIO );

	const handleLoadedMetadata = ( event: React.SyntheticEvent< HTMLVideoElement > ) => {
		const { videoWidth, videoHeight } = event.currentTarget;
		if ( videoWidth > 0 && videoHeight > 0 ) {
			setAspectRatio( videoWidth / videoHeight );
		}
	};

	let content: React.ReactNode = null;
	if ( videoPlatform === 'youtube' ) {
		const videoId = getYoutubeId( videoUrl );
		if ( videoId ) {
			content = (
				<iframe
					src={ `https://www.youtube.com/embed/${ videoId }?autoplay=1` }
					title={ __( 'Product video', 'tryaura' ) }
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				/>
			);
		}
	} else {
		content = (
			<video controls autoPlay onLoadedMetadata={ handleLoadedMetadata }>
				<source src={ videoUrl } type="video/mp4" />
				{ __( 'Your browser does not support the video tag.', 'tryaura' ) }
			</video>
		);
	}

	return (
		<Modal
			onRequestClose={ onClose }
			shouldCloseOnClickOutside={ true }
			shouldCloseOnEsc={ true }
			className="tryaura tryaura-video-modal-root"
			__experimentalHideHeader
		>
			<div
				className="tryaura-video-modal-player"
				style={ { '--tryaura-video-aspect': String( aspectRatio ) } as React.CSSProperties }
			>
				<X
					className="absolute top-1 right-1 cursor-pointer z-50 bg-red-50 rounded-full p-1 text-red-400"
					onClick={ onClose }
				/>
				{ content }
			</div>
		</Modal>
	);
};

let modalRoot: any = null;

const openModal = ( videoUrl: string, videoPlatform: string ) => {
	const containerId = 'tryaura-video-modal-container';
	let container = document.getElementById( containerId );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.id = containerId;
		document.body.appendChild( container );
	}

	const handleClose = () => {
		if ( modalRoot ) {
			modalRoot.unmount();
			modalRoot = null;
		} else if ( render ) {
			render( null as any, container! );
		}
		container?.remove();
	};

	if ( createRoot ) {
		modalRoot = ( createRoot as any )( container );
		modalRoot.render(
			<VideoModal
				videoUrl={ videoUrl }
				videoPlatform={ videoPlatform }
				onClose={ handleClose }
			/>
		);
	} else if ( render ) {
		render(
			<VideoModal
				videoUrl={ videoUrl }
				videoPlatform={ videoPlatform }
				onClose={ handleClose }
			/>,
			container
		);
	}
};

document.addEventListener(
	'click',
	( e ) => {
		const target = ( e.target as HTMLElement ).closest(
			'.tryaura-video-item'
		);
		if ( target ) {
			const videoUrl = target.getAttribute( 'data-tryaura-video-url' );
			if ( videoUrl ) {
				const videoPlatform =
					target.getAttribute( 'data-tryaura-video-platform' ) || '';

				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				openModal( videoUrl, videoPlatform );
			}
		}
	},
	true
);

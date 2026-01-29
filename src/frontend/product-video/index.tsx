import { Modal } from '@wordpress/components';
import { createRoot, RawHTML, render } from "@wordpress/element";
import { __ } from '@wordpress/i18n';
import './style.scss';
import { X } from "lucide-react";
import { getYoutubeId } from '../../utils/tryaura';

interface VideoModalProps {
	videoUrl: string;
	videoPlatform: string;
	onClose: () => void;
}

const VideoModal = ( {
	videoUrl,
	videoPlatform,
	onClose,
}: VideoModalProps ) => {
	let videoHtml = '';
	if ( videoPlatform === 'youtube' ) {
		const videoId = getYoutubeId( videoUrl );
		if ( videoId ) {
			videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ videoId }?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
		}
	} else {
		videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${ videoUrl }" type="video/mp4">${ __(
			'Your browser does not support the video tag.',
			'try-aura'
		) }</video>`;
	}

	return (
		<Modal
			onRequestClose={ onClose }
			shouldCloseOnClickOutside={ true }
			shouldCloseOnEsc={ true }
			className="tryaura try-aura-video-modal-root"
			__experimentalHideHeader
		>
			<div className="try-aura-video-modal-player">
				<div className="w-full h-full relative">
					<X
						className="absolute top-1 right-1 cursor-pointer z-50 bg-red-50 rounded-full p-1 text-red-400"
						onClick={ onClose }
					/>
					<RawHTML>{ videoHtml }</RawHTML>
				</div>
			</div>
		</Modal>
	);
};

let modalRoot: any = null;

const openModal = ( videoUrl: string, videoPlatform: string ) => {
	const containerId = 'try-aura-video-modal-container';
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
			'.try-aura-video-item'
		);
		if ( target ) {
			const videoUrl = target.getAttribute( 'data-try-aura-video-url' );
			if ( videoUrl ) {
				const videoPlatform =
					target.getAttribute( 'data-try-aura-video-platform' ) || '';

				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();

				openModal( videoUrl, videoPlatform );
			}
		}
	},
	true
);

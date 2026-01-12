import { createRoot } from '@wordpress/element';
import './style.scss';
import ProductVideoGallery from './components/ProductVideoGallery';
import { Toaster } from 'react-hot-toast';

declare const jQuery: any;

( function ( $ ) {
	$( function () {
		const $galleryContainer = $( '#product_images_container' );

		if ( ! $galleryContainer.length ) {
			return;
		}

		const $addBtn = $( '.add_product_images' );

		let $btnContainer = $( '#try-aura-add-video-container' );
		if ( ! $btnContainer.length ) {
			$btnContainer = $(
				'<div id="try-aura-add-video-container" class="tryaura"></div>'
			);
			if ( $addBtn.length ) {
				$addBtn.after( $btnContainer );
			} else {
				$galleryContainer.append( $btnContainer );
			}
		}

		const root = createRoot( $btnContainer[ 0 ] );
		root.render(
			<>
				<ProductVideoGallery />
				<Toaster
					position="bottom-right"
					containerClassName="tryaura-toast-root"
				/>
			</>
		);
	} );
} )( jQuery );

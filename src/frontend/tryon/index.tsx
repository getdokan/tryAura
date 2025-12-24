import { createRoot } from '@wordpress/element';
import './style.scss';
import TryOnModal from "./TryOnModal";

// Minimal frontend Try-On implementation: Adds a "Try on" button next to Add to cart on WooCommerce
// product pages. Clicking it opens a popup to upload or capture a photo and generates an AI try-on
// image using the saved API key (see enhancer.tsx for inspiration).

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl?: string;
			nonce?: string;
			apiKey?: string;
		};
	}
}

function unique< T >( arr: T[] ): T[] {
	return Array.from( new Set( arr ) );
}

function getProductImageUrls(): string[] {
	const imgs: HTMLImageElement[] = Array.from(
		document.querySelectorAll(
			'.woocommerce-product-gallery__wrapper img:not(.zoomImg)'
		)
	);
	const urls: string[] = imgs
		.map( ( img ) => {
			const large =
				( img as any ).dataset?.large_image ||
				img.getAttribute( 'data-large_image' );
			const cs = ( img as any ).currentSrc || img.getAttribute( 'src' );
			return large || cs || '';
		} )
		.filter( Boolean ) as string[];
	return unique( urls );
}

function openTryOnModal( productImages: string[] ) {
	const containerId = 'try-aura-tryon-modal-root';
	let container = document.getElementById( containerId );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.id = containerId;
		container.className = 'tryaura';
		document.body.appendChild( container );
	}
	const root: any = ( createRoot as any )( container );
	const handleClose = () => {
		try {
			root.unmount?.();
		} catch {}
		container?.remove();
	};
	root.render(
		<TryOnModal productImages={ productImages } onClose={ handleClose } />
	);
}

function injectButton() {
	const btnId = 'try-aura-tryon-button';
	if ( document.getElementById( btnId ) ) {
		return;
	}
	const addToCart: HTMLElement | null = document.querySelector(
		'.single_add_to_cart_button'
	);
	if ( ! addToCart ) {
		return;
	}
	const btn = document.createElement( 'button' );
	btn.id = btnId;
	btn.type = 'button';
	btn.textContent = 'Try on';
	btn.className =
		addToCart.className.replace( 'single_add_to_cart_button', '' ).trim() ||
		'button';
	btn.style.marginLeft = '8px';
	addToCart.insertAdjacentElement( 'afterend', btn );

	btn.addEventListener( 'click', () => {
		const images = getProductImageUrls();
		if ( ! images.length ) {
			window.alert( 'No product images found to try on.' );
			return;
		}
		openTryOnModal( images );
	} );
}

function init() {
	injectButton();
	const observer = new MutationObserver( () => injectButton() );
	observer.observe( document.body, { childList: true, subtree: true } );
}

document.addEventListener( 'DOMContentLoaded', init );

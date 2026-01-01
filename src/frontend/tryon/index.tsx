import { createRoot } from '@wordpress/element';
import './style.scss';
import TryOnModal from './TryOnModal';
import { addAction, applyFilters, doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			restUrl?: string;
			nonce?: string;
			apiKey?: string;
			productId?: number;
		};
	}
}

function unique< T >( arr: T[] ): T[] {
	return Array.from( new Set( arr ) );
}

function getProductImageUrls(): string[] {
	const imgs: HTMLImageElement[] = Array.from(
		document.querySelectorAll(
			applyFilters(
				'tryaura.tryon.product_image_selector',
				'.woocommerce-product-gallery__wrapper img:not(.zoomImg)'
			)
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
	return applyFilters( 'tryaura.tryon.product_image_urls', unique( urls ) );
}

const isUserLoggedIn = (): boolean => {
	const logedIn = select( 'core' ).getCurrentUser();
	const domLogedin = document.body.classList.contains( 'logged-in' );

	return logedIn && domLogedin;
};

const goToLogin = () => {
	const loginUrl = ( window.location.href =
		window?.tryAura?.loginUrl ?? '/wp-login.php' );

	const currentUrl = new URL( window.location.href );

	// add your custom param
	currentUrl.searchParams.set( 'tryOnAutoOpen', 'true' );
	// Redirect to My Account with the current product URL as a parameter
	window.location.href = `${ loginUrl }?tryaura_redirect_to=${ encodeURIComponent(
		currentUrl.toString()
	) }`;
};

function openTryOnModal( productImages: string[] ) {
	if ( ! isUserLoggedIn() ) {
		goToLogin();
		return;
	}
	const containerId = applyFilters(
		'tryaura.tryon.container_id',
		'try-aura-tryon-modal-root'
	);
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

const handleTryOnBtnClick = () => {
	const images = getProductImageUrls();
	if ( ! images.length ) {
		window.alert( __( 'No product images found to try on.', 'try-aura' ) );
		return;
	}
	openTryOnModal( images );
};

function injectButton() {
	const btnId = applyFilters(
		'tryaura.tryon.button_id',
		'try-aura-tryon-button'
	);
	if ( document.getElementById( btnId ) ) {
		return;
	}
	const addToCart: HTMLElement | null = document.querySelector(
		applyFilters(
			'tryaura.tryon.add_to_cart_selector',
			'.single_add_to_cart_button, .wc-block-add-to-cart-button, .wc-block-components-product-add-to-cart-button'
		)
	);
	if ( ! addToCart ) {
		return;
	}
	const btn = document.createElement( 'button' );
	btn.id = btnId;
	btn.type = 'button';
	btn.textContent = __( 'Try on', 'try-aura' );
	btn.className =
		addToCart.className.replace( 'single_add_to_cart_button', '' ).trim() ||
		'button';
	btn.style.marginLeft = '8px';
	addToCart.insertAdjacentElement( 'afterend', btn );

	btn.addEventListener( 'click', handleTryOnBtnClick );

	doAction( 'tryaura.tryon.button_added', btn, addToCart );
}

addAction( 'tryaura.tryon.button_added', 'try-aura-tryon-button-added', () => {
	// check if in the url there is a tryOnAutoOpen param, if so, open the modal
	const currentUrl = new URL( window.location.href );
	const tryOnAutoOpen = currentUrl.searchParams.get( 'tryOnAutoOpen' );
	if ( tryOnAutoOpen ) {
		const productImages = getProductImageUrls();
		if ( productImages.length ) {
			openTryOnModal( productImages );
			currentUrl.searchParams.delete( 'tryOnAutoOpen' );
			window.history.replaceState( null, '', currentUrl.toString() );
		}
	}
} );

function init() {
	injectButton();
	const observer = new MutationObserver( () => injectButton() );
	observer.observe( document.body, { childList: true, subtree: true } );
}

document.addEventListener( 'DOMContentLoaded', init );

import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import './style.scss';
import PreviewModal from './PreviewModal';
import { __ } from '@wordpress/i18n';

/**
 * Lightweight UI that injects an "Enhance with AI" button into the
 * WordPress Featured Image media modal toolbar. This implementation focuses
 * only on the UI using @wordpress/element, without any REST/AI backend.
 */

declare const wp: any;

declare global {
	interface Window {
		// eslint-disable-line @typescript-eslint/consistent-type-definitions
		tryAura?: {
			apiKey?: string;
			restUrl?: string;
			nonce?: string;
		};
	}
}

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
			const frameObj =
				wp?.media?.frame ||
				( wp?.media?.featuredImage?.frame
					? wp.media.featuredImage.frame()
					: null );
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
				window.alert( 'Please select at least one image.' );
				return;
			}
			setPreviewUrls( items.map( ( j: any ) => j.url ) );
			setAttachmentIds( items.map( ( j: any ) => j.id ) );
			setOpen( true );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
			window.alert( 'Unable to read current selection.' );
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
			const container = document.createElement( 'div' );
			container.id = 'try-aura-ai-modal-root';
			container.className = 'tryaura';
			document.body.appendChild( container );
			modalContainerRef.current = container;
		}

		const container = modalContainerRef.current!;
		if ( ! modalRootRef.current ) {
			modalRootRef.current = ( createRoot as any )( container );
		}
		modalRootRef.current.render(
			<PreviewModal
				imageUrls={ previewUrls }
				attachmentIds={ attachmentIds }
				onClose={ () => setOpen( false ) }
				supportsVideo={ true }
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

function addEnhancerButton( toolbar ) {
	toolbar = toolbar[ 0 ] ?? null;
	if ( toolbar ) {
		let container = toolbar.querySelector(
			'#try-aura-ai-enhance'
		) as HTMLElement | null;
		const time = Date.now();

		if ( ! container ) {
			container = document.createElement( 'span' );
			container.id = 'try-aura-ai-enhance';
			container.className = time.toString();
			container.style.display = 'inline-block';
			container.style.marginLeft = '8px';
			container.style.marginTop = '14px';
			toolbar.appendChild( container );
		}
		// Ensure the React button is rendered (WP may clear the toolbar on state changes)
		if (
			! container.hasChildNodes() ||
			( container as any ).childElementCount === 0
		) {
			const root = ( createRoot as any )( container );
			window[ time ] = root;
			root.render( <EnhanceButton /> );
		}
	}
}

( function ( $ ) {
	$( function () {
		if (
			! window.wp ||
			! wp.media ||
			! wp.media.view ||
			! wp.media.view.Modal
		) {
			return;
		}

		const origOpen = wp.media.view.Modal.prototype.open;
		wp.media.view.Modal.prototype.open = function ( ...args ) {
			// Call original open first so the DOM exists
			const ret = origOpen.apply( this, args );

			const toolBar = $( this.controller.el )
				.find( '.media-frame-toolbar' )
				.find( '.media-toolbar' )
				.find( '.media-toolbar-primary.search-form' );
			addEnhancerButton( toolBar );

			return ret;
		};

		const origClose = wp.media.view.Modal.prototype.close;
		wp.media.view.Modal.prototype.close = function ( ...args ) {
			// Call original open first so the DOM exists
			const ret = origClose.apply( this, args );

			const button = $( this.controller.el )
				.find( '.media-frame-toolbar' )
				.find( '.media-toolbar' )
				.find( '.media-toolbar-primary.search-form' )
				.find( '#try-aura-ai-enhance' );
			if ( button[ 0 ] ) {
				const className = button[ 0 ].className;
				const root = window[ className ];

				try {
					root?.unmount?.();
				} catch {}
				delete window[ className ];
				button.remove();
			}

			return ret;
		};
	} );
} )( jQuery );

import { createRoot } from '@wordpress/element';
import './style.scss';
import { applyFilters, doAction } from '@wordpress/hooks';
import EnhanceButton from './EnhanceButton';

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

const tryauramediaroot = applyFilters(
	'tryaura.media_root_name',
	'tryauramediaroot'
);

function addEnhancerButton( toolbar ) {
	toolbar = toolbar[ 0 ] ?? null;
	if ( toolbar ) {
		let container = toolbar.querySelector(
			applyFilters(
				'tryaura.admin_enhance_btn_selector',
				'#try-aura-ai-enhance'
			)
		) as HTMLElement | null;
		const time = Date.now();

		if ( ! container ) {
			container = document.createElement( 'span' );
			container.id = 'try-aura-ai-enhance';
			container.dataset[ tryauramediaroot ] = time.toString();
			container.style.display = 'inline-block';
			container.style.marginLeft = '8px';
			container.style.marginTop = '14px';
			container = applyFilters(
				'tryaura.admin_enhance_btn_container',
				container
			);
			toolbar.appendChild( container );

			doAction( 'tryaura.admin_enhance_btn_added', container, toolbar );
		}
		// Ensure the React button is rendered (WP may clear the toolbar on state changes)
		if (
			! container.hasChildNodes() ||
			( container as any ).childElementCount === 0
		) {
			const root = ( createRoot as any )( container );
			if ( ! window.tryAuraMediaRoots ) {
				window.tryAuraMediaRoots = {};
			}
			window.tryAuraMediaRoots[ time ] = root;
			window.tryAuraMediaRoots[ time ].render( <EnhanceButton /> );
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
			addEnhancerButton(
				applyFilters( 'tryaura.admin_enhance_btn_toolbar', toolBar )
			);

			return ret;
		};

		const origClose = wp.media.view.Modal.prototype.close;
		wp.media.view.Modal.prototype.close = function ( ...args ) {
			// Call original open first so the DOM exists
			const ret = origClose.apply( this, args );

			let button = $( this.controller.el )
				.find( '.media-frame-toolbar' )
				.find( '.media-toolbar' )
				.find( '.media-toolbar-primary.search-form' )
				.find( '#try-aura-ai-enhance' );

			button = applyFilters(
				'tryaura.admin_enhance_btn_toolbar_close',
				button
			);

			if ( button[ 0 ] ) {
				const rootId = $( button[ 0 ] ).data( tryauramediaroot );
				let root = window.tryAuraMediaRoots[ rootId ];

				try {
					root = applyFilters(
						'tryaura.admin_enhance_media_unmount_before_filter',
						root
					);
					doAction(
						'tryaura.admin_enhance_media_unmount_before_action',
						root
					);
					root?.unmount?.();
					doAction(
						'tryaura.admin_enhance_media_unmount_after_action',
						root
					);
				} catch {}
				doAction(
					'tryaura.admin_enhance_media_unmounted_before',
					root
				);
				delete window.tryAuraMediaRoots[ rootId ];
				button.remove();
				doAction( 'tryaura.admin_enhance_media_unmounted_after', root );
			}

			return ret;
		};
	} );
} )( jQuery );

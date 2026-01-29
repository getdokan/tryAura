import './style.scss';
declare const tryAuraWoo: {
	ajaxUrl: string;
	nonce: string;
};

// @ts-ignore
jQuery( document ).ready( function ( $ ) {
	$( '.tryaura-toggle-try-on' ).on( 'change', function () {
		const checkbox = $( this );
		const productId = checkbox.data( 'product-id' );
		const enabled = checkbox.is( ':checked' );

		checkbox.prop( 'disabled', true );

		$.ajax( {
			url: tryAuraWoo.ajaxUrl,
			type: 'POST',
			data: {
				action: 'tryaura_toggle_try_on',
				product_id: productId,
				enabled,
				nonce: tryAuraWoo.nonce,
			},
			success( response ) {
				if ( ! response.success ) {
					checkbox.prop( 'checked', ! enabled );
				}
			},
			error() {
				checkbox.prop( 'checked', ! enabled );
			},
			complete() {
				checkbox.prop( 'disabled', false );
			},
		} );
	} );
} );

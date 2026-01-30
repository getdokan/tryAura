import { applyFilters } from '@wordpress/hooks';

export const hasPro = () => {
	// @ts-ignore
	const hasPro = window?.tryAura?.hasPro;

	if (
		hasPro &&
		( hasPro === true ||
			hasPro === 'true' ||
			hasPro === '1' ||
			hasPro === 1 ||
			hasPro === 'yes' )
	) {
		return true;
	}

	return false;
};

export const getUpgradeToProUrl = () => {
	// @ts-ignore
	const upgradeToProUrl = window?.tryAura?.upgradeToProUrl;

	return upgradeToProUrl ?? '';
};

export const getMediaSelectedItems = () => {
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
	const items =  ( models || [] )
		.map( ( m: any ) =>
			typeof m?.toJSON === 'function' ? m.toJSON() : m
		)
		.filter( ( j: any ) => j && j.url && j.id );

	return { items, frameObj };
};

export const getYoutubeId = ( videoUrl: string ) => {
	const pattern =
		/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
	const match = videoUrl.match( pattern );
	return match ? match[ 1 ] : null;
};

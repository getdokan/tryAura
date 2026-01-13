import * as TYPES from './constants';
import { Status, ActiveTab } from './types';

const actions = {};

export default actions;

export const setIsBlockEditorPage = ( isBlockEditorPage: boolean ) => ( {
	type: TYPES.SET_IS_BLOCK_EDITOR_PAGE,
	isBlockEditorPage,
} );

export const setIsWoocommerceProductPage = (
	isWoocommerceProductPage: boolean
) => ( {
	type: TYPES.SET_IS_WOOCOMMERCE_PRODUCT_PAGE,
	isWoocommerceProductPage,
} );

export const setStatus = ( status: Status ) => ( {
	type: TYPES.SET_STATUS,
	status,
} );

export const setMessage = ( message: string ) => ( {
	type: TYPES.SET_MESSAGE,
	message,
} );

export const setGeneratedUrl = ( generatedUrl: string | null ) => ( {
	type: TYPES.SET_GENERATED_URL,
	generatedUrl,
} );

export const setError = ( error: string | null ) => ( {
	type: TYPES.SET_ERROR,
	error,
} );

export const setUploading = ( uploading: boolean ) => ( {
	type: TYPES.SET_UPLOADING,
	uploading,
} );

export const setImageConfigData = ( data: any ) => ( {
	type: TYPES.SET_IMAGE_CONFIG_DATA,
	data,
} );

export const setSelectedImageIndices = ( selectedImageIndices: number[] ) => ( {
	type: TYPES.SET_SELECTED_IMAGE_INDICES,
	selectedImageIndices,
} );

export const setActiveTab = ( activeTab: ActiveTab ) => ( {
	type: TYPES.SET_ACTIVE_TAB,
	activeTab,
} );

export const setIsThumbnailMode = ( isThumbnailMode: boolean ) => ( {
	type: TYPES.SET_IS_THUMBNAIL_MODE,
	isThumbnailMode,
} );

export const setImageUrls = ( imageUrls: string[] ) => ( {
	type: TYPES.SET_IMAGE_URLS,
	imageUrls,
} );

export const setAttachmentIds = ( attachmentIds: number[] ) => ( {
	type: TYPES.SET_ATTACHMENT_IDS,
	attachmentIds,
} );

export const setSupportsVideo = ( supportsVideo: boolean ) => ( {
	type: TYPES.SET_SUPPORTS_VIDEO,
	supportsVideo,
} );

export const setIsVideoBusy = ( isVideoBusy: boolean ) => ( {
	type: TYPES.SET_IS_VIDEO_BUSY,
	isVideoBusy,
} );

export const resetState = () => ( {
	type: TYPES.RESET_STATE,
} );

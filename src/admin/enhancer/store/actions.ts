import * as TYPES from './constants';
import { Status, VideoStatus, ActiveTab, VideoSource } from './types';

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

export const setVideoStatus = ( videoStatus: VideoStatus ) => ( {
	type: TYPES.SET_VIDEO_STATUS,
	videoStatus,
} );

export const setVideoMessage = ( videoMessage: string ) => ( {
	type: TYPES.SET_VIDEO_MESSAGE,
	videoMessage,
} );

export const setVideoUrl = ( videoUrl: string | null ) => ( {
	type: TYPES.SET_VIDEO_URL,
	videoUrl,
} );

export const setVideoError = ( videoError: string | null ) => ( {
	type: TYPES.SET_VIDEO_ERROR,
	videoError,
} );

export const setVideoUploading = ( videoUploading: boolean ) => ( {
	type: TYPES.SET_VIDEO_UPLOADING,
	videoUploading,
} );

export const setVideoConfigData = ( data: any ) => ( {
	type: TYPES.SET_VIDEO_CONFIG_DATA,
	data,
} );

export const setImageConfigData = ( data: any ) => ( {
	type: TYPES.SET_IMAGE_CONFIG_DATA,
	data,
} );

export const setVideoSource = ( videoSource: VideoSource ) => ( {
	type: TYPES.SET_VIDEO_SOURCE,
	videoSource,
} );
export const setSelectedImageIndices = ( selectedImageIndices: number[] ) => ( {
	type: TYPES.SET_SELECTED_IMAGE_INDICES,
	selectedImageIndices,
} );

export const setSelectedVideoIndices = ( selectedVideoIndices: number[] ) => ( {
	type: TYPES.SET_SELECTED_VIDEO_INDICES,
	selectedVideoIndices,
} );

export const setActiveTab = ( activeTab: ActiveTab ) => ( {
	type: TYPES.SET_ACTIVE_TAB,
	activeTab,
} );

export const resetState = () => ( {
	type: TYPES.RESET_STATE,
} );

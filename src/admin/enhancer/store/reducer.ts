import { __ } from '@wordpress/i18n';
import * as TYPES from './constants';
import { EnhancerState } from './types';

export const INITIAL_STATE: EnhancerState = {
	isBlockEditorPage: false,
	isWoocommerceProductPage: false,
	status: 'idle',
	message: __( 'Ready to generate', 'try-aura' ),
	generatedUrl: null,
	error: null,
	uploading: false,
	videoStatus: 'idle',
	videoMessage: __( 'Ready to generate video', 'try-aura' ),
	videoUrl: null,
	videoError: null,
	videoUploading: false,
	videoConfigData: {
		styles: 'studio',
		cameraMotion: 'zoom in',
		aspectRatio: '16:9',
		optionalPrompt: '',
	},
	imageConfigData: {
		imageSize: '1:1',
		backgroundType: 'studio',
		styleType: 'photo-realistic',
		optionalPrompt: '',
		videoPlatform: 'youtube',
	},
	activeTab: 'image',
	videoSource: 'original-image',
	selectedImageIndices: [ 0 ],
	selectedVideoIndices: [ 0 ],
	isThumbnailMode: false,
};

const reducer = (
	state = INITIAL_STATE,
	action: { type: string; [ key: string ]: any }
): EnhancerState => {
	switch ( action.type ) {
		case TYPES.SET_IS_BLOCK_EDITOR_PAGE:
			return { ...state, isBlockEditorPage: action.isBlockEditorPage };
		case TYPES.SET_IS_WOOCOMMERCE_PRODUCT_PAGE:
			return {
				...state,
				isWoocommerceProductPage: action.isWoocommerceProductPage,
			};
		case TYPES.SET_STATUS:
			return { ...state, status: action.status };
		case TYPES.SET_MESSAGE:
			return { ...state, message: action.message };
		case TYPES.SET_GENERATED_URL:
			return {
				...state,
				generatedUrl: action.generatedUrl,
				videoSource: action.generatedUrl
					? 'generated-image'
					: state.videoSource,
			};
		case TYPES.SET_ERROR:
			return { ...state, error: action.error };
		case TYPES.SET_UPLOADING:
			return { ...state, uploading: action.uploading };
		case TYPES.SET_VIDEO_STATUS:
			return { ...state, videoStatus: action.videoStatus };
		case TYPES.SET_VIDEO_MESSAGE:
			return { ...state, videoMessage: action.videoMessage };
		case TYPES.SET_VIDEO_URL:
			return { ...state, videoUrl: action.videoUrl };
		case TYPES.SET_VIDEO_ERROR:
			return { ...state, videoError: action.videoError };
		case TYPES.SET_VIDEO_UPLOADING:
			return { ...state, videoUploading: action.videoUploading };
		case TYPES.SET_VIDEO_CONFIG_DATA:
			return {
				...state,
				videoConfigData: { ...state.videoConfigData, ...action.data },
			};
		case TYPES.SET_IMAGE_CONFIG_DATA:
			return {
				...state,
				imageConfigData: { ...state.imageConfigData, ...action.data },
			};
		case TYPES.SET_VIDEO_SOURCE:
			return { ...state, videoSource: action.videoSource };
		case TYPES.SET_SELECTED_IMAGE_INDICES:
			return {
				...state,
				selectedImageIndices: action.selectedImageIndices,
			};
		case TYPES.SET_SELECTED_VIDEO_INDICES:
			return {
				...state,
				selectedVideoIndices: action.selectedVideoIndices,
			};
		case TYPES.SET_ACTIVE_TAB:
			return { ...state, activeTab: action.activeTab };
		case TYPES.SET_IS_THUMBNAIL_MODE:
			return { ...state, isThumbnailMode: action.isThumbnailMode };
		case TYPES.RESET_STATE:
			return {
				...INITIAL_STATE,
				isBlockEditorPage: state.isBlockEditorPage,
				isWoocommerceProductPage: state.isWoocommerceProductPage,
				isThumbnailMode: state.isThumbnailMode,
				imageConfigData: state.imageConfigData,
				videoConfigData: state.videoConfigData,
			};
		default:
			return state;
	}
};

export default reducer;

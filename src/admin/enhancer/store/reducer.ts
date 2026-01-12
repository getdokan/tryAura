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
	imageConfigData: {
		imageSize: '1:1',
		backgroundType: 'studio',
		styleType: 'photo-realistic',
		optionalPrompt: '',
		videoPlatform: 'youtube',
	},
	activeTab: 'image',
	selectedImageIndices: [ 0 ],
	isThumbnailMode: false,
	imageUrls: [],
	attachmentIds: [],
	supportsVideo: false,
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
			};
		case TYPES.SET_ERROR:
			return { ...state, error: action.error };
		case TYPES.SET_UPLOADING:
			return { ...state, uploading: action.uploading };
		case TYPES.SET_IMAGE_CONFIG_DATA:
			return {
				...state,
				imageConfigData: { ...state.imageConfigData, ...action.data },
			};
		case TYPES.SET_SELECTED_IMAGE_INDICES:
			return {
				...state,
				selectedImageIndices: action.selectedImageIndices,
			};
		case TYPES.SET_ACTIVE_TAB:
			return { ...state, activeTab: action.activeTab };
		case TYPES.SET_IS_THUMBNAIL_MODE:
			return { ...state, isThumbnailMode: action.isThumbnailMode };
		case TYPES.SET_IMAGE_URLS:
			return { ...state, imageUrls: action.imageUrls };
		case TYPES.SET_ATTACHMENT_IDS:
			return { ...state, attachmentIds: action.attachmentIds };
		case TYPES.SET_SUPPORTS_VIDEO:
			return { ...state, supportsVideo: action.supportsVideo };
		case TYPES.RESET_STATE:
			return {
				...INITIAL_STATE,
				isBlockEditorPage: state.isBlockEditorPage,
				isWoocommerceProductPage: state.isWoocommerceProductPage,
				isThumbnailMode: state.isThumbnailMode,
				imageConfigData: state.imageConfigData,
			};
		default:
			return state;
	}
};

export default reducer;

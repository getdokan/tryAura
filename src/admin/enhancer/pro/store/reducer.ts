import { __ } from '@wordpress/i18n';
import * as TYPES from './constants';
import { EnhancerProState } from './types';

export const INITIAL_STATE: EnhancerProState = {
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
	videoSource: 'original-image',
	selectedVideoIndices: [ 0 ],
};

const reducer = (
	state = INITIAL_STATE,
	action: { type: string; [ key: string ]: any }
): EnhancerProState => {
	switch ( action.type ) {
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
		case TYPES.SET_VIDEO_SOURCE:
			return { ...state, videoSource: action.videoSource };
		case TYPES.SET_SELECTED_VIDEO_INDICES:
			return {
				...state,
				selectedVideoIndices: action.selectedVideoIndices,
			};
		case TYPES.RESET_STATE:
			return {
				...INITIAL_STATE,
				videoConfigData: state.videoConfigData,
			};
		default:
			return state;
	}
};

export default reducer;

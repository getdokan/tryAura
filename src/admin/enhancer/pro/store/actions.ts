import * as TYPES from './constants';
import { VideoStatus, VideoSource } from './types';

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

export const setVideoSource = ( videoSource: VideoSource ) => ( {
	type: TYPES.SET_VIDEO_SOURCE,
	videoSource,
} );

export const setSelectedVideoIndices = ( selectedVideoIndices: number[] ) => ( {
	type: TYPES.SET_SELECTED_VIDEO_INDICES,
	selectedVideoIndices,
} );

export const resetState = () => ( {
	type: TYPES.RESET_STATE,
} );

import { EnhancerProState } from './types';

export const getVideoStatus = ( state: EnhancerProState ) => state.videoStatus;
export const getVideoMessage = ( state: EnhancerProState ) => state.videoMessage;
export const getVideoUrl = ( state: EnhancerProState ) => state.videoUrl;
export const getVideoError = ( state: EnhancerProState ) => state.videoError;
export const getVideoUploading = ( state: EnhancerProState ) =>
	state.videoUploading;
export const getVideoConfigData = ( state: EnhancerProState ) =>
	state.videoConfigData;
export const getVideoSource = ( state: EnhancerProState ) => state.videoSource;
export const getSelectedVideoIndices = ( state: EnhancerProState ) =>
	state.selectedVideoIndices;

export const isVideoBusy = ( state: EnhancerProState ) =>
	state.videoStatus === 'generating' ||
	state.videoStatus === 'polling' ||
	state.videoStatus === 'downloading';

import { EnhancerState } from './types';

export const getIsBlockEditorPage = ( state: EnhancerState ) =>
	state.isBlockEditorPage;
export const getIsWoocommerceProductPage = ( state: EnhancerState ) =>
	state.isWoocommerceProductPage;
export const getStatus = ( state: EnhancerState ) => state.status;
export const getMessage = ( state: EnhancerState ) => state.message;
export const getGeneratedUrl = ( state: EnhancerState ) => state.generatedUrl;
export const getError = ( state: EnhancerState ) => state.error;
export const getUploading = ( state: EnhancerState ) => state.uploading;
export const getVideoStatus = ( state: EnhancerState ) => state.videoStatus;
export const getVideoMessage = ( state: EnhancerState ) => state.videoMessage;
export const getVideoUrl = ( state: EnhancerState ) => state.videoUrl;
export const getVideoError = ( state: EnhancerState ) => state.videoError;
export const getVideoUploading = ( state: EnhancerState ) =>
	state.videoUploading;
export const getVideoConfigData = ( state: EnhancerState ) =>
	state.videoConfigData;
export const getImageConfigData = ( state: EnhancerState ) =>
	state.imageConfigData;
export const getActiveTab = ( state: EnhancerState ) => state.activeTab;
export const getVideoSource = ( state: EnhancerState ) => state.videoSource;
export const getSelectedImageIndices = ( state: EnhancerState ) =>
	state.selectedImageIndices;
export const getSelectedVideoIndices = ( state: EnhancerState ) =>
	state.selectedVideoIndices;
export const isThumbnailMode = ( state: EnhancerState ) =>
	state.isThumbnailMode;

export const isBusy = ( state: EnhancerState ) =>
	state.status === 'fetching' ||
	state.status === 'generating' ||
	state.status === 'parsing';

export const isVideoBusy = ( state: EnhancerState ) =>
	state.videoStatus === 'generating' ||
	state.videoStatus === 'polling' ||
	state.videoStatus === 'downloading';

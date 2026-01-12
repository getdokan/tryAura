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
export const getImageConfigData = ( state: EnhancerState ) =>
	state.imageConfigData;
export const getActiveTab = ( state: EnhancerState ) => state.activeTab;
export const getSelectedImageIndices = ( state: EnhancerState ) =>
	state.selectedImageIndices;
export const isThumbnailMode = ( state: EnhancerState ) =>
	state.isThumbnailMode;

export const isBusy = ( state: EnhancerState ) =>
	state.status === 'fetching' ||
	state.status === 'generating' ||
	state.status === 'parsing';

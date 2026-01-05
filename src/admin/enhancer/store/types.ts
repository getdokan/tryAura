export type Status = 'idle' | 'fetching' | 'generating' | 'parsing' | 'done' | 'error';
export type VideoStatus = 'idle' | 'generating' | 'polling' | 'downloading' | 'done' | 'error';
export type ActiveTab = 'image' | 'video';
export type VideoSource = 'generated-image' | 'original-image';

export interface ImageConfigData {
	imageSize: string;
	backgroundType: string;
	styleType: string;
	optionalPrompt: string;
}

export interface VideoConfigData {
	styles: string;
	cameraMotion: string;
	aspectRatio: string;
	optionalPrompt: string;
}

export interface EnhancerState {
	isBlockEditorPage: boolean;
	isWoocommerceProductPage: boolean;
	status: Status;
	message: string;
	generatedUrl: string | null;
	error: string | null;
	uploading: boolean;
	videoStatus: VideoStatus;
	videoMessage: string;
	videoUrl: string | null;
	videoError: string | null;
	videoUploading: boolean;
	videoConfigData: VideoConfigData;
	imageConfigData: ImageConfigData;
	activeTab: ActiveTab;
	videoSource: VideoSource;
	selectedImageIndices: number[];
	selectedVideoIndices: number[];
}

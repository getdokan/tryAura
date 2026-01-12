export type VideoStatus =
	| 'idle'
	| 'generating'
	| 'polling'
	| 'downloading'
	| 'done'
	| 'error';

export type VideoSource = 'generated-image' | 'original-image';

export interface VideoConfigData {
	styles: string;
	cameraMotion: string;
	aspectRatio: string;
	optionalPrompt: string;
}

export interface EnhancerProState {
	videoStatus: VideoStatus;
	videoMessage: string;
	videoUrl: string | null;
	videoError: string | null;
	videoUploading: boolean;
	videoConfigData: VideoConfigData;
	videoSource: VideoSource;
	selectedVideoIndices: number[];
}

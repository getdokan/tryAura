export type Status =
	| 'idle'
	| 'fetching'
	| 'generating'
	| 'parsing'
	| 'done'
	| 'error';
export type ActiveTab = string;

export interface ImageConfigData {
	aspectRatio: string;
	backgroundType: string;
	styleType: string;
	optionalPrompt: string;
	negativePrompt?: string;
	videoPlatform?: string;
}

export interface EnhancerState {
	isBlockEditorPage: boolean;
	isWoocommerceProductPage: boolean;
	status: Status;
	message: string;
	generatedUrl: string | null;
	error: string | null;
	uploading: boolean;
	imageConfigData: ImageConfigData;
	activeTab: ActiveTab;
	selectedImageIndices: number[];
	isThumbnailMode?: boolean;
	imageUrls: string[];
	attachmentIds: number[];
	supportsVideo: boolean;
	isVideoBusy: boolean;
	altText: string;
	generatingAltText: boolean;
}

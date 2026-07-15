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
	// #29: output resolution — '1K' | '2K' | '4K'. Sent as imageConfig.imageSize.
	resolution?: string;
	// #28: extra reference photos of the real product (data URLs), sent as
	// additional inlineData parts so the model keeps logos/colours/shape accurate.
	referenceImages?: string[];
	// #26: the active "look" template id (for chip highlighting). Applying a
	// look writes its prompt/negative-prompt into the visible fields above.
	templateId?: string;
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

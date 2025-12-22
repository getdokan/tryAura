import { __ } from '@wordpress/i18n';
import { Button } from '../../../components';

function Output( {
	generatedUrl,
	supportsVideo,
	activeTab,
	setActiveTab,
	message,
	videoUrl,
	videoMessage,
	videoError,
	doGenerateVideo,
	isVideoBusy,
	videoUploading,
	setVideoInMediaSelection,
	error,
} ) {
	return (
		<div className="w-full">
			<div className="w-[500] text-[14px] mb-[8px]">
				{ __( 'Generated Output', 'try-aura' ) }
			</div>
			{ /* eslint-disable-next-line no-nested-ternary */ }
			{ activeTab === 'image' ? (
				generatedUrl ? (
					<div className="flex flex-col gap-[20px]">
						<img
							src={ generatedUrl }
							alt="Generated"
							className="w-full h-auto block rounded-[8px]"
						/>
						{ supportsVideo && (
							<div className="flex justify-center">
								<Button
									variant="solid"
									className="border border-primary text-primary bg-white"
									onClick={ () => setActiveTab( 'video' ) }
								>
									{ __( 'Generate Video', 'tryaura' ) }
								</Button>
							</div>
						) }
					</div>
				) : (
					<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex items-center justify-center">
						<span>{ message }</span>
					</div>
				)
			) : (
				<div>
					{ videoUrl ? (
						<video
							src={ videoUrl }
							controls
							className="w-full h-auto block rounded-[8px] bg-[#000]"
						/>
					) : (
						<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex items-center justify-center">
							<span>{ videoMessage }</span>
						</div>
					) }
					{ videoError && (
						<div style={ { color: 'red', marginTop: 8 } }>
							{ videoError }
						</div>
					) }
				</div>
			) }
			{ error ? (
				<div style={ { color: 'red', marginTop: 8 } }>{ error }</div>
			) : null }
		</div>
	);
}

export default Output;

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
					<div
						style={ {
							fontWeight: 600,
							marginBottom: 8,
						} }
					>
					</div>
					{ videoUrl ? (
						<video
							src={ videoUrl }
							controls
							style={ {
								width: '100%',
								height: 'auto',
								maxHeight: 200,
								background: '#000',
								borderRadius: 4,
							} }
						/>
					) : (
						<div className="bg-[#F3F4F6] text-[#67686B] text-[14px] font-[400] rounded-[8px] min-h-[316px] flex items-center justify-center">
							<span>{ message }</span>
						</div>
					) }
					{ videoError ? (
						<div style={ { color: 'red', marginTop: 8 } }>
							{ videoError }
						</div>
					) : null }
					<div
						style={ {
							display: 'flex',
							gap: '8px',
							justifyContent: 'flex-end',
							marginTop: 8,
						} }
					>
						{ videoUrl ? (
							<>
								<button
									className="button"
									onClick={ doGenerateVideo }
									disabled={ isVideoBusy }
								>
									{ isVideoBusy
										? 'Regenerating video…'
										: 'Regenerate video' }
								</button>
								<a
									className="button"
									href={ isVideoBusy ? undefined : videoUrl }
									download={
										isVideoBusy
											? undefined
											: 'enhanced-video.mp4'
									}
									aria-disabled={ isVideoBusy }
									style={ {
										pointerEvents: isVideoBusy
											? 'none'
											: 'auto',
										opacity: isVideoBusy ? 0.6 : 1,
									} }
								>
									Download video
								</a>
								<button
									className="button button-primary"
									onClick={ setVideoInMediaSelection }
									disabled={
										isVideoBusy ||
										videoUploading ||
										! videoUrl
									}
								>
									{ videoUploading
										? 'Adding…'
										: 'Add to Media' }
								</button>
							</>
						) : (
							<button
								className="button"
								onClick={ doGenerateVideo }
								disabled={ isVideoBusy }
							>
								{ isVideoBusy
									? 'Generating video…'
									: 'Generate video' }
							</button>
						) }
					</div>
				</div>
			) }
			{ error ? (
				<div style={ { color: 'red', marginTop: 8 } }>{ error }</div>
			) : null }
		</div>
	);
}

export default Output;

import { __ } from '@wordpress/i18n';
import { useState, useCallback, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, ModernSelect } from '../../../components';
import { STORE_NAME } from '../store';
import { generateVideo } from '../utils/generateVideo';
import VideoProgress from './VideoProgress';

function VideoConfigInputs() {
	const {
		videoJobStatus,
		videoResultUrl,
		videoError,
		generatedUrl,
		imageUrls,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			videoJobStatus: store.getVideoJobStatus(),
			videoResultUrl: store.getVideoResultUrl(),
			videoError: store.getVideoError(),
			generatedUrl: store.getGeneratedUrl(),
			imageUrls: store.getImageUrls(),
		};
	}, [] );

	const {
		setVideoJobId,
		setVideoJobStatus,
		setVideoResultUrl,
		setVideoError,
		setIsVideoBusy,
	} = useDispatch( STORE_NAME );

	const [ duration, setDuration ] = useState( '5' );
	const [ aspectRatio, setAspectRatio ] = useState( '16:9' );
	const [ resolution, setResolution ] = useState( '720p' );
	const [ videoPrompt, setVideoPrompt ] = useState( '' );

	const abortControllerRef = useRef< AbortController | null >( null );

	const aura = ( window as any ).tryAura;
	const videoModel = aura?.videoModel || '';

	const isGenerating =
		videoJobStatus === 'submitting' ||
		videoJobStatus === 'pending' ||
		videoJobStatus === 'in_progress';

	const handleGenerate = useCallback( async () => {
		setVideoError( null );
		setVideoResultUrl( null );
		setIsVideoBusy( true );

		const controller = new AbortController();
		abortControllerRef.current = controller;

		try {
			const referenceImages: string[] = [];
			if ( generatedUrl ) {
				referenceImages.push( generatedUrl );
			} else if ( imageUrls.length > 0 ) {
				referenceImages.push( ...imageUrls );
			}

			const result = await generateVideo( {
				model: videoModel,
				prompt:
					videoPrompt ||
					'Generate a short product showcase video.',
				images: referenceImages,
				duration,
				aspectRatio,
				resolution,
				objectId: aura?.postId?.toString() || '',
				objectType: aura?.postType || '',
				signal: controller.signal,
				onStatusChange: ( status ) => {
					setVideoJobStatus( status as any );
				},
			} );

			setVideoJobId( result.jobId );
			setVideoResultUrl( result.videoUrl );
			setVideoJobStatus( 'completed' );
		} catch ( err: any ) {
			if ( err?.name === 'AbortError' ) {
				setVideoJobStatus( 'idle' );
			} else {
				setVideoError( err?.message || 'Video generation failed.' );
				setVideoJobStatus( 'failed' );
			}
		} finally {
			setIsVideoBusy( false );
			abortControllerRef.current = null;
		}
	}, [
		videoModel,
		videoPrompt,
		duration,
		aspectRatio,
		resolution,
		generatedUrl,
		imageUrls,
		aura,
		setVideoError,
		setVideoResultUrl,
		setIsVideoBusy,
		setVideoJobId,
		setVideoJobStatus,
	] );

	const handleCancel = useCallback( () => {
		abortControllerRef.current?.abort();
	}, [] );

	// Show progress view when generating.
	if ( isGenerating || videoJobStatus === 'completed' || videoJobStatus === 'failed' ) {
		return (
			<VideoProgress
				status={ videoJobStatus }
				videoUrl={ videoResultUrl }
				error={ videoError }
				onCancel={ handleCancel }
				onRetry={ () => {
					setVideoJobStatus( 'idle' );
					setVideoResultUrl( null );
					setVideoError( null );
				} }
			/>
		);
	}

	return (
		<>
			<ModernSelect
				value={ duration }
				onChange={ ( val: string ) => setDuration( val ) }
				label={ __( 'Duration', 'tryaura' ) }
				options={ [
					{
						label: __( '5 seconds', 'tryaura' ),
						value: '5',
					},
					{
						label: __( '10 seconds', 'tryaura' ),
						value: '10',
					},
				] }
			/>

			<ModernSelect
				variant="list"
				value={ aspectRatio }
				onChange={ ( val: string ) => setAspectRatio( val ) }
				label={ __( 'Aspect Ratio', 'tryaura' ) }
				options={ [
					{
						label: __( 'Landscape (16:9)', 'tryaura' ),
						value: '16:9',
					},
					{
						label: __( 'Portrait (9:16)', 'tryaura' ),
						value: '9:16',
					},
					{
						label: __( 'Square (1:1)', 'tryaura' ),
						value: '1:1',
					},
				] }
			/>

			<ModernSelect
				value={ resolution }
				onChange={ ( val: string ) => setResolution( val ) }
				label={ __( 'Resolution', 'tryaura' ) }
				options={ [
					{
						label: __( '720p', 'tryaura' ),
						value: '720p',
					},
					{
						label: __( '1080p', 'tryaura' ),
						value: '1080p',
					},
				] }
			/>

			<label
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
				} }
				htmlFor="tryaura-video-prompt"
			>
				<span className="w-[500] text-[14px] mb-2">
					{ __( 'Prompt (Optional)', 'tryaura' ) }
				</span>
				<textarea
					className="border border-[#E9E9E9] placeholder-[#929296]"
					value={ videoPrompt }
					onChange={ ( e ) => setVideoPrompt( e.target.value ) }
					rows={ 3 }
					placeholder={ __(
						'Add any specific instructions (optional)',
						'tryaura'
					) }
					id="tryaura-video-prompt"
				/>
			</label>

			<Button
				onClick={ handleGenerate }
				disabled={ ! videoModel }
			>
				{ __( 'Generate Video', 'tryaura' ) }
			</Button>
		</>
	);
}

export default VideoConfigInputs;

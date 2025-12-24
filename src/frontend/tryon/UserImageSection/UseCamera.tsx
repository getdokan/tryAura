import ImagePreview from './ImagePreview';
import { __ } from "@wordpress/i18n";

function UseCamera( {
	cameraActive,
	capture,
	videoRef,
	isBusy,
	userImages,
	removeUserImage,
	startCamera,
}: {
	cameraActive: boolean;
	capture: any;
	videoRef: any;
	isBusy: boolean;
	userImages: [];
	removeUserImage: ( idx: number ) => void;
	startCamera: () => void;
} ) {
	return (
		<div className="w-full">
			{ cameraActive && (
				<div className="w-full flex flex-col gap-[20px]">
					<video
						ref={ videoRef }
						autoPlay
						playsInline
						muted
						className="w-full h-full bg-[#000] block"
					/>

					<button
						className="bg-[#000000] text-white px-[50px] py-[10px] cursor-pointer mx-auto"
						onClick={ capture }
						disabled={ ! cameraActive || isBusy }
					>
						{ __( 'Capture', 'try-aura' ) }
					</button>
				</div>
			) }

			<div className="flex flex-col w-full gap-[20px]">
				{ userImages.length > 0 && ! cameraActive && (
					<div className="rounded-[5px] border-2 border-dashed border-[#E0E0E0] bg-[#F8F9F8] p-[8px] text-center">
						<ImagePreview
							userImages={ userImages }
							removeUserImage={ removeUserImage }
						/>
					</div>
				) }

				{ ! cameraActive && (
					<button
						className="bg-[#000000] text-white px-[50px] py-[10px] cursor-pointer mx-auto"
						onClick={ startCamera }
					>
						{ __( 'Recapture', 'try-aura' ) }
					</button>
				) }
			</div>
		</div>
	);
}

export default UseCamera;

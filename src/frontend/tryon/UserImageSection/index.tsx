import { __ } from '@wordpress/i18n';
import { GroupButton } from '../../../components';
import { Camera, UploadCloud } from 'lucide-react';
import UploadImage from './UploadImage';
import UseCamera from './UseCamera';

function Index( {
	onFileChange,
	userImages,
	removeUserImage,
	videoRef,
	capture,
	cameraActive,
	setActiveTab,
	startCamera,
	stopCamera,
	activeTab,
	setUserImages,
	error,
	isBusy,
} ) {
	return (
		<div className="w-full sm:w-1/3 max-h-[533px] overflow-auto">
			<div className="font-[500] text-[14px] text-[#25252D] mb-[20px]">
				{ __( 'Your Image', 'tryaura' ) }
			</div>
			<GroupButton
				options={ [
					{
						label: 'Upload Image',
						value: 'upload',
						icon: <UploadCloud size={ 16 } />,
						className: 'w-1/2',
					},
					{
						label: 'Use Camera',
						value: 'camera',
						icon: <Camera size={ 16 } />,
						className: 'w-1/2',
					},
				] }
				onClick={ ( value ) => {
					setUserImages( [] );
					setActiveTab( value );

					if ( value === 'camera' ) {
						startCamera();
					} else {
						stopCamera();
					}
				} }
				value={ activeTab }
				className="mb-5 flex w-full"
				disabled={ isBusy }
			/>
			<div className="flex flex-wrap gap-[8px] w-full">
				{ activeTab === 'upload' && (
					<UploadImage
						onFileChange={ onFileChange }
						userImages={ userImages }
						removeUserImage={ removeUserImage }
					/>
				) }

				{ activeTab === 'camera' && (
					<UseCamera
						videoRef={ videoRef }
						capture={ capture }
						cameraActive={ cameraActive }
						userImages={ userImages }
						removeUserImage={ removeUserImage }
						startCamera={ startCamera }
					/>
				) }
			</div>
			{ error ? (
				<div style={ { color: 'red', marginTop: 8 } }>{ error }</div>
			) : null }
		</div>
	);
}

export default Index;

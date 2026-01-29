import { User } from 'lucide-react';
import ImagePreview from './ImagePreview';
import { twMerge } from 'tailwind-merge';
import { __ } from '@wordpress/i18n';

function UploadImage( {
	onFileChange,
	userImages,
	removeUserImage,
}: {
	onFileChange: any;
	userImages: [];
	removeUserImage: ( idx: number ) => void;
} ) {
	return (
		<div className="w-full">
			<label htmlFor="image-upload" className="block cursor-pointer">
				<input
					type="file"
					id="image-upload"
					accept="image/*"
					multiple={ false }
					onChange={ onFileChange }
					className="hidden"
				/>

				{ userImages.length > 0 ? (
					<ImagePreview
						userImages={ userImages }
						removeUserImage={ removeUserImage }
					/>
				) : (
					<div className="rounded-[5px] border-2 border-dashed border-[#E0E0E0] bg-[#F8F9F8] px-8 py-12 text-center shadow-sm hover:border-gray-400 transition-colors duration-200">
						<User size={ 20 } className="mx-auto text-[#828282]" />

						<p className="m-0 mt-[6px] text-[14px] font-[600] text-primary">
							{ __( 'Add Your Image', 'tryaura' ) }
						</p>

						<p className="m-0 mt-[6px] text-[12px] leading-[18px] font-[400] text-[#828282]">
							{ __(
								'Supports: jpg, png, and img formats.',
								'tryaura'
							) }
							<br />
							{ __(
								'File size must be under 20 MB.',
								'tryaura'
							) }
						</p>
					</div>
				) }
			</label>
		</div>
	);
}

export default UploadImage;

function OriginalImage( {
	imageUrls,
	multiple = false,
}: {
	imageUrls: string[];
	multiple?: boolean;
} ) {
	return (
		<div className="w-[500px] max-h-[533px] overflow-auto">
			<div className="text-[14px] mb-[8px]">
				{ multiple ? 'Original Images' : 'Original Image' }
			</div>
			{ multiple ? (
				<div className="flex flex-col gap-[8px]">
					{ imageUrls.map( ( url, idx ) => (
						<img
							key={ idx }
							src={ url }
							alt={ `Original ${ idx + 1 }` }
							className="w-auto h-[152px] h-auto block border-none rounded-[8px]"
						/>
					) ) }
				</div>
			) : (
				<img
					src={ imageUrls[ 0 ] }
					alt="Original"
					className="w-auto h-[152px] h-auto block border-none rounded-[8px]"
				/>
			) }
		</div>
	);
}

export default OriginalImage;

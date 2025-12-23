import { twMerge } from 'tailwind-merge';

export interface GroupButtonProps {
	options: { label: string; value: string; disabled?: boolean; icon?: any }[];
	onClick: ( value: string ) => void;
	value: string;
	className?: string;
}

const GroupButton = ( {
	options,
	onClick,
	value,
	className,
}: GroupButtonProps ) => {
	const classNames =
		'bg-black px-3 py-2 text-[14px] text-white hover:bg-bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer';
	const normalButtonCLass =
		'bg-white px-3 py-2 text-[14px] text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer';

	return (
		<div className={ className }>
			{ options.map( ( option, index ) => {
				return (
					<button
						className={ twMerge(
							value === option?.value
								? classNames
								: normalButtonCLass,
							index === 0 ? 'rounded-l-[5px]' : '',
							index === options.length - 1
								? 'rounded-r-[5px]'
								: '',
							option?.disabled
								? 'opacity-50 cursor-not-allowed'
								: ''
						) }
						onClick={ () => onClick( option?.value ) }
						key={ option?.value }
						disabled={ option?.disabled ?? false }
					>
						<div className="flex flex-row items-center justify-center gap-[8px]">
							{ option?.icon ?? '' }
							<span>{ option?.label ?? '' }</span>
						</div>
					</button>
				);
			} ) }
		</div>
	);
};

export default GroupButton;

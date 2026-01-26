import { twMerge } from 'tailwind-merge';
import { CrownIcon } from './index';

export interface GroupButtonProps {
	options: {
		label: string;
		value: string;
		disabled?: boolean;
		icon?: any;
		className?: string;
		locked?: boolean;
	}[];
	onClick: ( value: string ) => void;
	value: string;
	className?: string;
	disabled?: boolean;
}

const GroupButton = ( {
	options,
	onClick,
	value,
	className,
	disabled = false,
}: GroupButtonProps ) => {
	const classNames =
		'bg-[rgba(37,37,45,1)] px-3 py-2 text-[14px] text-white hover:bg-[rgba(37,37,45,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer';
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
							disabled || option?.disabled
								? 'opacity-50 cursor-not-allowed'
								: '',
							option?.className ?? ''
						) }
						onClick={ () => onClick( option?.value ) }
						key={ option?.value }
						disabled={ disabled }
					>
						<div className="flex flex-row items-center justify-center gap-2">
							{ option?.icon ?? '' }
							<span>{ option?.label ?? '' }</span>
							{ option?.locked && (
								<CrownIcon className="text-[15px]" />
							) }
						</div>
					</button>
				);
			} ) }
		</div>
	);
};

export default GroupButton;

import { forwardRef } from '@wordpress/element';
import { twMerge } from 'tailwind-merge';

type Variant = 'solid' | 'outline' | 'outline-primary';
type Color = 'primary';

export interface ButtonProps
	extends Omit< JSX.IntrinsicElements[ 'button' ], 'color' > {
	variant?: Variant;
	color?: Color;
	loading?: boolean;
}
const Button = forwardRef< HTMLButtonElement, ButtonProps >( function Button(
	{
		variant = 'solid',
		color = 'primary',
		className,
		children,
		type = 'button',
		loading = false,
		...rest
	},
	ref
) {
	let classNames =
		'flex flex-row justify-center items-center gap-1 rounded-[5px] bg-primary px-3 py-2 text-[14px] text-white hover:bg-bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

	if ( variant === 'outline' ) {
		classNames =
			'flex flex-row justify-center items-center gap-1 rounded-[5px] bg-white px-3 py-2 text-[14px] text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
	}

	if ( variant === 'outline-primary' ) {
		classNames =
			'flex flex-row justify-center items-center gap-1 rounded-[5px] bg-white px-3 py-2 text-[14px] text-primary inset-ring inset-ring-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
	}
	const Tag = type === 'link' ? 'a' : 'button';

	return (
		<Tag
			ref={ ref }
			className={ twMerge( classNames, className ) }
			{ ...rest }
		>
			<svg
				className={ `transition-[width,margin] ease-out animate-spin h-4 ${
					loading ? 'w-4 mr-3' : 'w-0'
				}` }
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				></circle>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>

			{ children ?? '' }
		</Tag>
	);
} );

export default Button;

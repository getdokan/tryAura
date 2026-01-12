import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { twMerge } from 'tailwind-merge';
import { ButtonProps } from "@wordpress/components/src/button/types";

/**
 * This is an experimental component.
 */
const WpBtn = forwardRef( ( props: ButtonProps, ref ) => {
	const { className, variant = 'primary', ...rest } = props;

	return (
		<Button
			{ ...rest }
			ref={ ref }
			variant={ variant }
			className={ twMerge(
				variant === 'primary' &&
					'tryaura-wp-btn bg-primary hover:bg-primary/90 text-white border-primary hover:border-primary/90 rounded-[5px] shadow-none',
				className
			) }
		/>
	);
} );

WpBtn.displayName = 'WpBtn';

export default WpBtn;

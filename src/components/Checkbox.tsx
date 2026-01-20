import { forwardRef } from '@wordpress/element';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export interface CheckboxProps
	extends Omit< JSX.IntrinsicElements[ 'input' ], 'type' > {}

const Checkbox = forwardRef< HTMLInputElement, CheckboxProps >(
	( { className, id, children, ...props }, ref ) => {
		return (
			<div className="flex gap-3">
				<div className="flex h-5 shrink-0 items-center">
					<div className="group grid size-5 grid-cols-1">
						<input
							{ ...props }
							id={ id }
							ref={ ref }
							type="checkbox"
							className={ twMerge(
								'col-start-1 row-start-1 appearance-none rounded-[2.73px] w-5 h-5 p-0 m-0 shadow-none border bg-white not-checked:border-neutral-200 checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-primary dark:checked:bg-primary dark:indeterminate:border-primary dark:indeterminate:bg-primary dark:focus-visible:outline-primary dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto cursor-pointer before:content-none transition-all duration-200',
								className
							) }
						/>
						<Check
							className="pointer-events-none col-start-1 row-start-1 size-4 self-center justify-self-center text-white opacity-0 group-has-checked:opacity-100 group-has-disabled:text-gray-950/25 dark:group-has-disabled:text-white/25 transition-all duration-200"
							size={ 7 }
						/>
					</div>
				</div>
				{ children }
			</div>
		);
	}
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

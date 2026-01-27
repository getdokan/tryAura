import { Popover } from '@wordpress/components';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { twMerge } from 'tailwind-merge';
import { CrownIcon } from './index';
const ModernSelect = ( {
	value,
	onChange,
	options,
	placeholder = __( 'Select…', 'try-aura' ),
	className = '',
	labelClassName = '',
	label = '',
	variant = 'grid',
	disabled = false,
}: {
	value: string;
	label?: string;
	onChange: ( val: string ) => void;
	options: { label: string; value: string; icon?: any; locked?: boolean }[];
	placeholder?: string;
	className?: string;
	labelClassName?: string;
	variant?: 'grid' | 'list';
	disabled?: boolean;
} ) => {
	const [ open, setOpen ] = useState( false );
	const contentRef = useRef< HTMLDivElement >( null );
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const current = options.find( ( o ) => o.value === value );

	if ( variant === 'list' ) {
	}

	const handleSelect = ( val: string ) => {
		onChange( val );
		setOpen( false );
	};

	return (
		<div
			className={ `relative flex flex-col gap-[4px] ${ className }` }
			ref={ contentRef }
		>
			{ label && (
				<span
					className={ twMerge(
						'w-[500] text-[14px] mb-[8px] font-[500] text-[rgba(37,37,45,1)]',
						labelClassName
					) }
				>
					{ label }
				</span>
			) }
			<div>
				<button
					// @ts-ignore
					ref={ setPopoverAnchor }
					type="button"
					className={ twMerge(
						'w-full p-[10px_16px] border border-[#E9E9E9] rounded-[5px] flex items-center justify-between bg-white focus:outline-none cursor-pointer',
						disabled && 'opacity-50 cursor-not-allowed',
						open && 'ring-1 ring-primary'
					) }
					aria-haspopup="listbox"
					aria-expanded={ open }
					onClick={ () => ! disabled && setOpen( ( v ) => ! v ) }
				>
					<span className="truncate">
						{ current ? current.label : placeholder }
					</span>
					<ChevronDown
						size={ 16 }
						className={ `w-4 h-4 ml-2 shrink-0 transition-transform ${
							open ? 'rotate-180' : ''
						}` }
					/>
				</button>

				{ open && ! disabled ? (
					<Popover
						anchor={ popoverAnchor }
						onClose={ () => ! disabled && setOpen( false ) }
						onFocusOutside={ () => ! disabled && setOpen( false ) }
						noArrow
						flip={ true }
						style={ {
							marginTop: '8px',
						} }
						className="tryaura"
					>
						<div
							className={ twMerge(
								'bg-white border border-[#E9E9E9] rounded-[5px] shadow flex flex-wrap',
								variant === 'list' ? 'flex-col' : 'flex-row'
							) }
							style={ {
								width:
									contentRef?.current?.offsetWidth ?? 'auto',
								padding: variant === 'list' ? '8px 0px' : '8px',
							} }
						>
							{ options.map( ( opt ) => {
								const button = (
									<button
										key={ opt.value }
										type="button"
										role="option"
										aria-selected={ opt.value === value }
										className={ twMerge(
											'relative items-center text-[#828282] h-auto rounded-[3px] flex gap-1 transition-all duration-200 hover:text-primary hover:bg-primary/10',
											opt.locked
												? 'cursor-not-allowed opacity-50 hover:bg-white'
												: 'cursor-pointer ',
											opt.value === value
												? 'bg-neutral-100'
												: 'bg-white',
											variant === 'list'
												? 'w-full flex-row p-[8px_12px]'
												: 'w-[78.25px] p-[12px] flex-col items-center justify-center border border-transparent',
											variant === 'grid' &&
												'hover:border-primary'
										) }
										onClick={ () =>
											! opt.locked &&
											handleSelect( opt.value )
										}
									>
										{ opt.locked && (
											<div
												className={ twMerge(
													'absolute right-1',
													variant === 'list'
														? 'top-1/2 transform -translate-x-1/2 -translate-y-1/2'
														: 'top-1'
												) }
											>
												<CrownIcon className="text-[16px]" />
											</div>
										) }
										{ opt.icon ?? '' }
										<span className="text-sm">
											{ opt.label }
										</span>
									</button>
								);

								return button;
							} ) }
						</div>
					</Popover>
				) : null }
			</div>
		</div>
	);
};

export default ModernSelect;

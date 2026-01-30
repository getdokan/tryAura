import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Popover } from '@wordpress/components';
import { twMerge } from 'tailwind-merge';
import { dateI18n, getSettings } from '@wordpress/date';
import { DayPicker, DateRange } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
	value?: DateRange;
	onChange: ( range: DateRange | undefined ) => void;
	children?: React.ReactNode | JSX.Element;
	wrapperClassName?: string;
	pickerToggleClassName?: string;
	wpPopoverClassName?: string;
	popoverBodyClassName?: string;
	onClear?: () => void;
	onOk?: () => void;
	inputId?: string;
	inputName?: string;
}

const DateRangePicker = ( props: Props ) => {
	const { value, onChange } = props;
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ isVisible, setIsVisible ] = useState( false );
	const [ internalValue, setInternalValue ] = useState<
		DateRange | undefined
	>( value );

	// Sync internal value when popover opens
	useEffect( () => {
		if ( isVisible ) {
			setInternalValue( value );
		}
	}, [ isVisible, value ] );

	const formatDate = ( date?: Date ) => {
		if ( ! date ) {
			return '';
		}
		const fmt = getSettings().formats.date;
		const tz = getSettings().timezone.string;
		return dateI18n( fmt, date, tz );
	};

	const displayValue = value?.from
		? `${ formatDate( value.from ) }${
				value.to ? ` - ${ formatDate( value.to ) }` : ''
		  }`
		: '';

	return (
		<div className={ twMerge( 'relative', props?.wrapperClassName ?? '' ) }>
			<div
				className={ twMerge(
					'flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 cursor-pointer',
					props?.pickerToggleClassName ?? ''
				) }
				onClick={ () => setIsVisible( ! isVisible ) }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						e.preventDefault();
						setIsVisible( ( v ) => ! v );
					}
				} }
				role="button"
				tabIndex={ 0 }
				aria-haspopup="dialog"
				aria-expanded={ isVisible }
				// @ts-ignore
				ref={ setPopoverAnchor }
			>
				{ props.children ?? (
					<>
						<CalendarDays size={ 16 } className="text-gray-500" />
						<span className="text-sm text-gray-700">
							{ displayValue ||
								__( 'Select Date Range', 'try-aura' ) }
						</span>
					</>
				) }
			</div>

			{ isVisible && (
				<Popover
					animate
					anchor={ popoverAnchor }
					focusOnMount={ true }
					className={ twMerge(
						'tryaura mt-10',
						props?.wpPopoverClassName ?? ''
					) }
					onClose={ () => setIsVisible( false ) }
					noArrow={ false }
					style={ { marginTop: '10px' } }
				>
					<div
						className={ twMerge(
							'w-auto text-sm/6 bg-white p-2',
							props?.popoverBodyClassName ?? ''
						) }
					>
						<div className="tryaura-date-range-picker">
							<DayPicker
								mode="range"
								selected={ internalValue }
								onSelect={ setInternalValue }
								components={ {
									Chevron: ( { orientation } ) => {
										if ( orientation === 'left' ) {
											return (
												<ChevronLeft className="h-4 w-4" />
											);
										}
										return (
											<ChevronRight className="h-4 w-4" />
										);
									},
								} }
							/>
						</div>
						<div className="m-4 mt-0 flex flex-row justify-end gap-2 pt-4">
							<Button
								size="small"
								onClick={ () => {
									onChange( internalValue );
									setIsVisible( false );
									if ( props?.onOk ) {
										props.onOk();
									}
								} }
								variant="primary"
								className="bg-primary hover:bg-primary-hover text-white"
							>
								{ __( 'Ok', 'try-aura' ) }
							</Button>
						</div>
					</div>
				</Popover>
			) }
		</div>
	);
};

export default DateRangePicker;

type ToggleProps = {
	checked: boolean;
	onChange: ( checked: boolean ) => void;
	id?: string;
	name?: string;
};
const Toggle = ( {
	checked,
	onChange,
	id = Date.now().toString(),
	name = Date.now().toString(),
}: ToggleProps ) => {
	return (
		<div className="tryaura">
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<label
				className="relative inline-flex items-center cursor-pointer"
				htmlFor={ id }
			>
				<input
					type="checkbox"
					className="sr-only peer"
					checked={ checked }
					onChange={ ( e ) => onChange( e.target.checked ) }
					id={ id }
					name={ name }
				/>
				<div className="relative w-8 h-4.5 bg-gray-400 peer-focus:outline-none rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
			</label>
		</div>
	);
};

export default Toggle;

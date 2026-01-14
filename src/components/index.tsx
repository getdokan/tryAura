import './style.scss';
import Button from './Button';
import WpBtn from './WpBtn';
import ModernSelect from './ModernSelect';
import GroupButton from './GroupButton';
import DateRangePicker from './DateRangePicker';
import Checkbox from './Checkbox';
import { GoogleGenAI } from '@google/genai';
import toast, { Toaster } from 'react-hot-toast';
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

export { Button, WpBtn };
export { ModernSelect };
export { GroupButton };
export { DateRangePicker };
export { Checkbox };
export { GoogleGenAI };
export { toast };
export type { ButtonProps } from './Button';
export type { CheckboxProps } from './Checkbox';

domReady( () => {
	const container = document.getElementById( 'aura-toaster' );

	if ( ! container ) {
		const div = document.createElement( 'div' );
		div.id = 'aura-toaster';
		document.body.appendChild( div );
		createRoot( div ).render( <Toaster position="bottom-right" containerClassName="tryaura-toast-root" /> );
	}
} );

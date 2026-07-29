import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Apparel output modes (#33): turn a flat garment photo into a catalogue shot.
 *
 * - On model — the garment worn by a person. This was already the enhancer's
 *   default behaviour when no instruction was typed; this makes it an explicit,
 *   selectable choice instead of a hidden fallback.
 * - Ghost mannequin — the garment holding its worn shape with no visible person
 *   or mannequin (the "invisible mannequin" look used across e-commerce). Pro.
 *
 * Merchant-side and distinct from the shopper-facing storefront try-on.
 */
export interface ApparelMode {
	id: string;
	label: string;
	/** Primary directive describing the mode. */
	instruction: string;
	/** Ghost mannequin is a Pro feature. */
	pro?: boolean;
}

export const getApparelModes = (): ApparelMode[] =>
	applyFilters( 'tryaura.enhancer.apparel_modes', [
		{
			id: 'on-model',
			label: __( 'On model', 'tryaura' ),
			instruction:
				'Present the garment from the provided image naturally worn by a suitable human model, with an accurate fit, natural drape and realistic proportions, framed as a professional catalogue shot.',
		},
		{
			id: 'ghost-mannequin',
			label: __( 'Ghost mannequin', 'tryaura' ),
			pro: true,
			instruction:
				'Present the garment from the provided image as an invisible-mannequin (ghost mannequin) product shot: the garment holds the three-dimensional shape of a wearer, with natural volume through the shoulders, chest and sleeves and visible interior depth at the collar, while the person and any mannequin remain completely invisible. Show the garment alone against a clean, seamless background.',
		},
	] ) as ApparelMode[];

export const getApparelMode = ( id?: string ): ApparelMode | undefined =>
	getApparelModes().find( ( mode ) => mode.id === id );

/**
 * Keeps the garment faithful to the source photo. Appended for every mode, so
 * the mode changes only how the garment is presented, never the garment itself.
 */
export const APPAREL_FIDELITY_CLAUSE =
	'Keep the garment itself identical to the provided image: the same colour, pattern, fabric, printed text, logos, seams and proportions. Only its presentation changes.';

/**
 * Build the apparel directive: the mode instruction, any direction the merchant
 * typed (model type, pose, framing), and the fidelity clause. Returns '' when no
 * mode is selected.
 */
export const buildApparelPrompt = (
	id?: string,
	userDirection?: string
): string => {
	const mode = getApparelMode( id );
	if ( ! mode ) {
		return '';
	}
	const direction = ( userDirection || '' ).trim();
	return [
		mode.instruction,
		direction ? `Follow this direction closely: ${ direction }.` : '',
		APPAREL_FIDELITY_CLAUSE,
	]
		.filter( Boolean )
		.join( ' ' );
};

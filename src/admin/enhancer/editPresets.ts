import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Edit mode (#32) — the feasible-on-BYOK part. The Gemini Developer API edits
 * conversationally ("define the region in words, leave the rest untouched"); it
 * does NOT take a pixel mask (that is Vertex-only), so the brush from the issue
 * is out of scope. This module drives the Edit tab's quick-edit chips.
 *
 * A chip SELECTS an edit type (its `instruction` is the base directive); the
 * Edit-instruction field adds free-text refinement (a colour, an object, a
 * background). The two combine at generation time. The "Clean up" type also
 * covers the #34 cleanup actions (wrinkles, dust, blemishes) in one chip.
 */
export interface EditPreset {
	id: string;
	label: string;
	/** Base directive for this edit type; free-text refines it. */
	instruction: string;
	/** Shown as the instruction-field placeholder when this type is selected. */
	placeholder?: string;
}

export const getEditPresets = (): EditPreset[] =>
	applyFilters( 'tryaura.enhancer.edit_presets', [
		{
			id: 'remove-text',
			label: __( 'Remove text', 'tryaura' ),
			instruction:
				'Remove all printed text, labels, watermarks and stickers from the product, keeping its shape, colours, materials and the background exactly as they are.',
			placeholder: __( 'Optional: which text to remove', 'tryaura' ),
		},
		{
			id: 'recolor',
			label: __( 'Recolor', 'tryaura' ),
			instruction:
				'Recolour the product, keeping its exact shape, texture, pattern, printed text, logos and lighting unchanged.',
			placeholder: __( "e.g. 'to navy blue'", 'tryaura' ),
		},
		{
			id: 'remove-object',
			label: __( 'Remove object', 'tryaura' ),
			instruction:
				'Remove the unwanted object from the scene, keeping the product and the rest of the image unchanged.',
			placeholder: __( "e.g. 'the price tag on the left'", 'tryaura' ),
		},
		{
			id: 'clean-up',
			label: __( 'Clean up', 'tryaura' ),
			instruction:
				'Remove wrinkles, creases, dust, lint, loose threads and minor blemishes from the product, keeping its shape, colour, materials, printed text and logos unchanged.',
			placeholder: __( 'Optional: focus the cleanup', 'tryaura' ),
		},
		{
			id: 'swap-background',
			label: __( 'Swap background', 'tryaura' ),
			instruction:
				'Replace the background, keeping the product exactly as it is — same shape, colours, angle and lighting.',
			placeholder: __( "e.g. 'a clean white studio'", 'tryaura' ),
		},
	] ) as EditPreset[];

export const getEditPreset = ( id?: string ): EditPreset | undefined =>
	getEditPresets().find( ( preset ) => preset.id === id );

/**
 * Combine the selected edit type's base instruction with the merchant's
 * free-text refinement into the final edit directive. Either part may be empty:
 * a type-only edit (e.g. Remove text) works on its own, and free-text alone
 * works without a selected type.
 *
 * @param {string} [presetId] The selected edit-type id, if any.
 * @param {string} [freeText] The merchant's free-text refinement, if any.
 * @return {string} The combined edit instruction ('' when both are empty).
 */
export const buildEditInstruction = (
	presetId?: string,
	freeText?: string
): string => {
	const base = getEditPreset( presetId )?.instruction || '';
	const refine = ( freeText || '' ).trim();
	if ( base && refine ) {
		return `${ base } Specifically: ${ refine }.`;
	}
	return base || refine;
};

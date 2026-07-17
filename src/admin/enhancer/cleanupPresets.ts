import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * One-click cleanup actions (#34): fix small defects in a source photo without
 * reshooting. Each preset is a fixed instruction sent on the normal
 * generateContent image path.
 *
 * Edit mode (#32) is not shipped, so these apply to the whole image — the
 * issue explicitly allows this ("If B2 has not shipped yet, implement these as
 * whole-image instruction edits"). If Edit mode ever lands, the same presets
 * become its quick-edit chips, scoped to a brushed region.
 */
export interface CleanupPreset {
	id: string;
	label: string;
	/** The fixed instruction sent to the model. */
	instruction: string;
}

/**
 * Appended to every cleanup instruction. Cleanup must not restyle the product,
 * so everything except the named defect is pinned. Phrased as a positive
 * "keep it identical" rather than a list of things not to do.
 */
export const CLEANUP_PRESERVE_CLAUSE =
	'Keep everything else in the image exactly as it is: the product must retain its identical shape, proportions, colour, materials, printed text, logos and position, with the original lighting, background and composition unchanged. Change nothing except the defect described above.';

export const getCleanupPresets = (): CleanupPreset[] =>
	applyFilters( 'tryaura.enhancer.cleanup_presets', [
		{
			id: 'de-wrinkle',
			label: __( 'De-wrinkle', 'tryaura' ),
			instruction:
				'Remove the wrinkles and creases from the fabric so it appears smooth and freshly pressed, following the natural drape of the garment.',
		},
		{
			id: 'remove-dust',
			label: __( 'Remove dust & lint', 'tryaura' ),
			instruction:
				'Remove the dust, lint, loose threads and small specks from the product and its immediate surroundings, leaving the surface clean.',
		},
		{
			id: 'remove-blemishes',
			label: __( 'Remove blemishes', 'tryaura' ),
			instruction:
				'Remove the minor blemishes, marks, smudges and scuffs from the product surface, leaving the material even and consistent.',
		},
	] ) as CleanupPreset[];

export const getCleanupPreset = ( id?: string ): CleanupPreset | undefined =>
	getCleanupPresets().find( ( preset ) => preset.id === id );

/**
 * Build the full cleanup prompt: the preset's instruction plus the preserve
 * clause. Returns '' when no preset is active.
 */
export const buildCleanupPrompt = ( id?: string ): string => {
	const preset = getCleanupPreset( id );
	if ( ! preset ) {
		return '';
	}
	return `${ preset.instruction } ${ CLEANUP_PRESERVE_CLAUSE }`;
};

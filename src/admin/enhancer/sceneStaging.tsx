import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { Circle, Leaf, Wallpaper, Sparkles, Gem, Table, Trees, Sofa } from 'lucide-react';

/**
 * Background / scene staging options (#27). Each option carries a `scene`
 * instruction that is injected into the prompt when selected — an empty `scene`
 * means "neutral background" (the product is left on a plain backdrop). This is
 * the single source of truth shared by the config dropdown and the prompt
 * builder, so staging options and templates travel one path.
 */
export interface BackgroundOption {
	label: string;
	value: string;
	icon: JSX.Element;
	// Scene instruction injected into the prompt; '' = neutral background.
	scene: string;
}

export const getBackgroundOptions = (): BackgroundOption[] =>
	applyFilters( 'tryaura.enhancer.background_preferences', [
		{
			label: __( 'Plain', 'tryaura' ),
			value: 'plain',
			icon: <Circle />,
			scene: '',
		},
		{
			label: __( 'Studio', 'tryaura' ),
			value: 'studio',
			icon: <Wallpaper />,
			scene: 'a professional studio backdrop with clean, controlled lighting',
		},
		{
			label: __( 'Natural', 'tryaura' ),
			value: 'natural',
			icon: <Leaf />,
			scene: 'a natural, softly-lit everyday setting',
		},
		{
			label: __( 'Lifestyle', 'tryaura' ),
			value: 'lifestyle',
			icon: <Sparkles />,
			scene: 'a real-life lifestyle scene with authentic surroundings and natural daylight',
		},
		{
			label: __( 'Marble surface', 'tryaura' ),
			value: 'marble',
			icon: <Gem />,
			scene: 'resting on an elegant polished marble surface with soft reflections',
		},
		{
			label: __( 'Wood table', 'tryaura' ),
			value: 'wood-table',
			icon: <Table />,
			scene: 'on a warm rustic wooden tabletop with soft side lighting',
		},
		{
			label: __( 'Outdoor', 'tryaura' ),
			value: 'outdoor',
			icon: <Trees />,
			scene: 'an outdoor setting with natural sunlight and an open-air background',
		},
		{
			label: __( 'Room / interior', 'tryaura' ),
			value: 'interior',
			icon: <Sofa />,
			scene: 'a tastefully decorated indoor room setting',
		},
	] ) as BackgroundOption[];

/**
 * Resolve the scene instruction for a selected background value. Returns '' for
 * the neutral/plain option (or unknown values), so callers keep the product on
 * a neutral background instead of injecting a scene.
 */
export const getBackgroundScene = ( value?: string ): string => {
	const option = getBackgroundOptions().find( ( o ) => o.value === value );
	return applyFilters(
		'tryaura.enhancer.background_scene_instruction',
		option?.scene ?? '',
		value
	) as string;
};

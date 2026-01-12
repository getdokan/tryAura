import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

// Modal title filter for thumbnails
addFilter(
	'tryaura.enhancer.modal_title',
	'tryaura/enhancer/modal-title',
	( title, { isThumbnailMode } ) => {
		if ( isThumbnailMode ) {
			return __( 'AI Product Video Thumbnail Generation', 'try-aura' );
		}
		return title;
	}
);

// Image prompt base filter for thumbnails
addFilter(
	'tryaura.ai_enhance_image_prompt_base',
	'tryaura/enhancer/image-prompt-base',
	( prompt, { imageConfigData, isThumbnailMode } ) => {
		if ( isThumbnailMode ) {
			const videoPlatform = imageConfigData?.videoPlatform || 'youtube';

			// Insert the video platform into the prompt
			const requirementsIdx = prompt.indexOf( 'Requirements:' );
			if ( requirementsIdx !== -1 ) {
				return (
					prompt.substring( 0, requirementsIdx ) +
					`- Video Platform: ${ videoPlatform }\n` +
					prompt.substring( requirementsIdx )
				);
			}
		}
		return prompt;
	}
);

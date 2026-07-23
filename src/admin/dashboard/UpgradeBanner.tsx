import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { X } from 'lucide-react';
import {
	getUpgradeToProUrl,
	shouldShowUpgradeBanner,
} from '../../utils/tryaura';

/**
 * Dismissible "Go Pro" promo banner shown on every dashboard route while
 * TryAura Pro is not active. Visibility is decided server-side (per-user
 * dismissal, re-shown after 30 days) and passed via localized data.
 *
 * @since PLUGIN_SINCE
 */
function UpgradeBanner() {
	const [ visible, setVisible ] = useState( shouldShowUpgradeBanner() );

	if ( ! visible ) {
		return null;
	}

	const upgradeUrl = getUpgradeToProUrl();

	const dismiss = () => {
		// Hide immediately; persisting the dismissal is best-effort.
		setVisible( false );
		apiFetch( {
			path: '/tryaura/v1/promotion/dismiss-banner',
			method: 'POST',
		} ).catch( () => {} );
	};

	return (
		<div className="relative mb-6 rounded-lg bg-[#ffd932] px-6 py-5 text-black">
			<button
				type="button"
				onClick={ dismiss }
				aria-label={ __( 'Dismiss this banner', 'tryaura' ) }
				className="absolute right-4 top-4 flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-black hover:bg-black/10"
			>
				<X className="size-4" />
			</button>
			<h2 className="m-0 pr-10 text-lg font-bold text-black">
				{ __( 'Go Pro. Create Without Limits.', 'tryaura' ) }
			</h2>
			<p className="mb-4 mt-1 pr-10 text-sm text-black">
				{ __(
					'Unlock AI product videos, custom prompts, flexible image and video sizes, camera motion controls, and priority support.',
					'tryaura'
				) }
			</p>
			<a
				href={ upgradeUrl }
				target="_blank"
				rel="noopener noreferrer"
				className="inline-block rounded-md bg-black px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-black/80 hover:text-white focus:text-white"
			>
				{ __( 'Upgrade Now', 'tryaura' ) }
			</a>
		</div>
	);
}

export default UpgradeBanner;

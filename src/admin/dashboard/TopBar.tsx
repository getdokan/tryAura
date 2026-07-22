import { applyFilters } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	TopBar as StorePulseTopBar,
} from '@wedevs/plugin-ui';
import {
	BookOpen,
	CircleHelp,
	FileClock,
	Lightbulb,
	MessageCircleQuestion,
} from 'lucide-react';
import { CrownIcon, TryauraLogoWithText } from '../../components';
import { hasPro } from '../../utils/tryaura';

export type HelpMenuItem = {
	id: string;
	title: string;
	url: string;
	icon: React.ReactNode;
};

const getHelpMenuItems = ( isPro: boolean ): HelpMenuItem[] => {
	const items: HelpMenuItem[] = [
		{
			id: 'documentation',
			title: __( 'Documentation', 'tryaura' ),
			url: 'https://storepulse.co/tryaura/docs/',
			icon: <BookOpen />,
		},
		{
			id: 'faq',
			title: __( 'FAQ', 'tryaura' ),
			url: 'https://storepulse.co/tryaura/#faq',
			icon: <MessageCircleQuestion />,
		},
		{
			id: 'request-a-feature',
			title: __( 'Request a Feature', 'tryaura' ),
			url: 'https://feedback.storepulse.co/',
			icon: <Lightbulb />,
		},
		{
			id: 'changelog',
			title: __( 'Changelog', 'tryaura' ),
			url: 'https://wordpress.org/plugins/tryaura/#developers',
			icon: <FileClock />,
		},
	];

	if ( ! isPro ) {
		items.push( {
			id: 'upgrade-to-pro',
			title: __( 'Upgrade to Pro', 'tryaura' ),
			url: 'https://storepulse.co/tryaura/pricing/',
			icon: <CrownIcon />,
		} );
	}

	/**
	 * Filter the items shown in the admin Top Bar help menu.
	 *
	 * @param {HelpMenuItem[]} items Menu items ({ id, title, url, icon }).
	 * @param {boolean}        isPro Whether TryAura Pro is active.
	 */
	return applyFilters(
		'tryaura.admin.help_menu_items',
		items,
		isPro
	) as HelpMenuItem[];
};

function TopBar() {
	// @ts-ignore
	const version: string = window?.tryAura?.version ?? '';
	// @ts-ignore
	const proVersion: string = window?.tryAura?.proVersion ?? '';
	const isPro = hasPro();

	const versions = [];
	if ( version ) {
		versions.push( {
			// translators: %s: installed version of the free TryAura plugin.
			version: sprintf( __( 'Lite v%s', 'tryaura' ), version ),
			isPro: false,
		} );
	}
	if ( isPro && proVersion ) {
		versions.push( {
			// translators: %s: installed version of the TryAura Pro plugin.
			version: sprintf( __( 'Pro v%s', 'tryaura' ), proVersion ),
			isPro: true,
		} );
	}

	const helpMenuItems = getHelpMenuItems( isPro );

	return (
		<StorePulseTopBar
			className="border-0 border-b border-solid border-border"
			logo={
				<a
					href="https://storepulse.co/tryaura"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-block h-full"
					aria-label={ __( 'TryAura website', 'tryaura' ) }
				>
					<TryauraLogoWithText className="h-full w-auto" />
				</a>
			}
			versions={ versions }
			rightSideComponents={
				<>
					<Button
						variant="outline"
						size="sm"
						render={
							// Base UI injects the button children into this anchor.
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a
								href="https://storepulse.co/contact/"
								target="_blank"
								rel="noopener noreferrer"
							/>
						}
					>
						{ __( 'Get Support', 'tryaura' ) }
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									aria-label={ __( 'Help menu', 'tryaura' ) }
								/>
							}
						>
							{ /* size on the icon itself: plugin-ui's button styles
							     the svg only when it has no `size-*` class. */ }
							<CircleHelp className="size-6" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{ helpMenuItems.map( ( item ) => (
								<DropdownMenuItem
									key={ item.id }
									render={
										// Base UI injects the item children into this anchor.
										// eslint-disable-next-line jsx-a11y/anchor-has-content
										<a
											href={ item.url }
											target="_blank"
											rel="noopener noreferrer"
										/>
									}
								>
									{ item.icon }
									{ item.title }
								</DropdownMenuItem>
							) ) }
						</DropdownMenuContent>
					</DropdownMenu>
				</>
			}
		/>
	);
}

export default TopBar;

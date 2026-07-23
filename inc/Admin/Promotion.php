<?php

namespace Dokan\TryAura\Admin;

use Dokan\TryAura\TryAura;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Pro promotion touchpoints shown while TryAura Pro is not active.
 *
 * Adds the "Upgrade" button to the TryAura admin sidebar menu and the
 * "Upgrade to Pro" action link on the All Plugins screen. The dashboard
 * promo banner is rendered by the admin SPA; its visibility is computed
 * here (see should_show_upgrade_banner()).
 *
 * @since PLUGIN_SINCE
 */
class Promotion {
	/**
	 * User meta key storing the promo banner dismissal timestamp.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string
	 */
	const BANNER_DISMISSED_META_KEY = '_tryaura_promo_banner_dismissed_at';

	/**
	 * How long a banner dismissal lasts before the banner re-appears.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var int
	 */
	const BANNER_DISMISSAL_DURATION = 30 * DAY_IN_SECONDS;

	/**
	 * Upgrade/pricing page URL.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var string
	 */
	const UPGRADE_URL = 'https://storepulse.co/tryaura/pricing/';

	/**
	 * Bootstrap promotion hooks. All output is gated on Pro being absent.
	 *
	 * @since PLUGIN_SINCE
	 */
	public function __construct() {
		if ( TryAura::is_pro_exists() ) {
			return;
		}

		// After Admin::register_admin_page() (default priority) so the
		// Upgrade entry lands after Dashboard and Settings.
		add_action( 'admin_menu', array( $this, 'register_upgrade_menu' ), 20 );
		add_action( 'admin_print_styles', array( $this, 'print_upgrade_menu_styles' ) );
		add_action( 'admin_print_footer_scripts', array( $this, 'print_upgrade_menu_script' ) );

		add_filter( 'plugin_action_links_' . plugin_basename( TRYAURA_FILE ), array( $this, 'add_upgrade_action_link' ) );
	}

	/**
	 * Whether the promo banner should render for the current user.
	 *
	 * True when Pro is absent and the user has never dismissed the banner,
	 * or the last dismissal is older than 30 days.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return bool
	 */
	public static function should_show_upgrade_banner(): bool {
		if ( TryAura::is_pro_exists() ) {
			return false;
		}

		$dismissed_at = (int) get_user_meta( get_current_user_id(), self::BANNER_DISMISSED_META_KEY, true );

		if ( ! $dismissed_at ) {
			return true;
		}

		return ( time() - $dismissed_at ) > self::BANNER_DISMISSAL_DURATION;
	}

	/**
	 * Append the "Upgrade" entry to the TryAura admin submenu.
	 *
	 * WordPress links submenu slugs starting with http(s) directly, so the
	 * entry points straight at the pricing page.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return void
	 */
	public function register_upgrade_menu(): void {
		global $submenu;

		if ( ! current_user_can( 'manage_options' ) || ! isset( $submenu['tryaura'] ) ) {
			return;
		}

		$submenu['tryaura'][] = array( // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			__( 'Upgrade', 'tryaura' ),
			'manage_options',
			self::UPGRADE_URL,
		);
	}

	/**
	 * Style the sidebar Upgrade entry as a filled button.
	 *
	 * Printed on every admin page because the sidebar menu is global.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return void
	 */
	public function print_upgrade_menu_styles(): void {
		$selector = $this->upgrade_menu_selector();
		?>
		<style id="tryaura-upgrade-menu-style">
			<?php echo $selector; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> {
				display: block;
				margin: 6px 10px;
				padding: 8px 12px;
				background: #ffd932;
				color: #000000;
				border-radius: 4px;
				font-weight: 600;
				text-align: center;
			}
			<?php echo $selector; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>:hover,
			<?php echo $selector; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>:focus {
				background: #ffe164;
				color: #000000;
				box-shadow: none;
			}
		</style>
		<?php
	}

	/**
	 * CSS selector matching the sidebar Upgrade menu link.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return string
	 */
	private function upgrade_menu_selector(): string {
		return '#adminmenu #toplevel_page_tryaura .wp-submenu a[href^="' . esc_url( self::UPGRADE_URL ) . '"]';
	}

	/**
	 * Open the sidebar Upgrade link in a new tab.
	 *
	 * Submenu entries render as plain anchors, so the target attribute has
	 * to be added client-side (same approach as Elementor).
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return void
	 */
	public function print_upgrade_menu_script(): void {
		?>
		<script id="tryaura-upgrade-menu-script">
			document
				.querySelectorAll( '<?php echo $this->upgrade_menu_selector(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>' )
				.forEach( function ( link ) {
					link.setAttribute( 'target', '_blank' );
					link.setAttribute( 'rel', 'noopener noreferrer' );
				} );
		</script>
		<?php
	}

	/**
	 * Add the "Upgrade to Pro" action link on the All Plugins screen.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param array $links Existing plugin action links.
	 *
	 * @return array
	 */
	public function add_upgrade_action_link( array $links ): array {
		$links[] = sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer" style="color:#FF8C00;font-weight:700;">%s</a>',
			esc_url( self::UPGRADE_URL ),
			esc_html__( 'Upgrade to Pro', 'tryaura' )
		);

		return $links;
	}
}

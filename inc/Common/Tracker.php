<?php

namespace Dokan\TryAura\Common;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Dokan\TryAura\TryAura;
use Dokan\TryAura\ThirdParty\Packages\Appsero\Client;
use Dokan\TryAura\ThirdParty\Packages\Appsero\Insights;

/**
 * TryAura tracker.
 *
 * Uses Appsero\Insights for anonymous usage tracking.
 *
 * @since x.x.x
 */
class Tracker {

	/**
	 * Insights instance.
	 *
	 * @since x.x.x
	 *
	 * @var Insights|null
	 */
	public $insights = null;

	/**
	 * Constructor.
	 *
	 * @since x.x.x
	 */
	public function __construct() {
		$this->init_tracker();
	}

	/**
	 * Initialize the Appsero tracker.
	 *
	 * @since x.x.x
	 *
	 * @return void
	 */
	public function init_tracker() {
		$client = new Client( 'b0f9aa76-1fad-43fe-ac99-ea57982df844', 'TryAura', TRYAURA_FILE );

		$this->insights = $client->insights();

		$this->insights->add_extra(
			function () {
				return [
					'is_pro'          => TryAura::is_pro_exists() ? 'Yes' : 'No',
					'wc_version'      => function_exists( 'WC' ) ? WC()->version : null,
					'tryaura_version' => defined( 'TRYAURA_PLUGIN_VERSION' ) ? TRYAURA_PLUGIN_VERSION : null,
				];
			}
		);

		$this->insights->init_plugin();
	}
}

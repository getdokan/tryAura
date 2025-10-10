<?php

namespace Dokan\TryAura;

use Dokan\TryAura\Rest\SettingsController;

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Plugin {
    /**
     * Bootstraps the plugin.
     */
    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init_plugin' ] );
    }

    /**
     * Initialize the plugin once all plugins are loaded.
     */
    public function init_plugin(): void {
        // Register custom REST endpoints.
        new SettingsController( 'try_aura_api_key' );

        if ( is_admin() ) {
            new Admin();
        }
    }
}
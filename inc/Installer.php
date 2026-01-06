<?php

namespace Dokan\TryAura;

use Dokan\TryAura\Database\UsageManager;

/**
 * Installer class.
 */
class Installer {

	/**
	 * Run the installer.
	 */
	public static function activate() {
		self::create_tables();
	}

	/**
	 * Create required tables.
	 */
	public static function create_tables() {
		global $wpdb;

		$table_name      = UsageManager::get_table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id bigint(20) UNSIGNED NOT NULL,
			provider varchar(50) NOT NULL,
			model varchar(100) NOT NULL,
			type enum('image', 'video') NOT NULL,
			generated_from enum('admin', 'tryon') NOT NULL,
			prompt longtext NOT NULL,
			input_tokens int(11) DEFAULT 0,
			output_tokens int(11) DEFAULT 0,
			total_tokens int(11) DEFAULT 0,
			video_seconds decimal(8,2) DEFAULT 0.00,
			output_count int(11) DEFAULT 1,
			status enum('success', 'failed') NOT NULL,
			error_message text DEFAULT NULL,
			object_id bigint(20) UNSIGNED DEFAULT NULL,
			object_type varchar(20) DEFAULT NULL,
			meta longtext DEFAULT NULL,
			created_at datetime NOT NULL,
			PRIMARY KEY (id),
			KEY user_id (user_id),
			KEY object_id (object_id),
			KEY object_type (object_type),
			KEY type (type),
			KEY status (status),
			KEY created_at (created_at)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}
}

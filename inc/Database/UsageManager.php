<?php

namespace Dokan\TryAura\Database;

use Dokan\TryAura\Models\Usage;

/**
 * Usage Manager class.
 */
class UsageManager {

	/**
	 * Get table name.
	 *
	 * @return string
	 */
	public static function get_table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'tryaura';
	}

	/**
	 * Log usage.
	 *
	 * @param array $data Usage data.
	 *
	 * @return int|bool
	 */
	public function log_usage( array $data ) {
		$usage = new Usage( $data );
		return $this->insert( $usage );
	}

	/**
	 * Insert usage record.
	 *
	 * @param Usage $usage Usage model.
	 *
	 * @return int|bool
	 */
	public function insert( Usage $usage ) {
		global $wpdb;

		$insert_data = array(
			'user_id'        => $usage->user_id ?? get_current_user_id(),
			'provider'       => $usage->provider ?? 'google',
			'model'          => $usage->model ?? '',
			'type'           => $usage->type ?? 'image',
			'generated_from' => $usage->generated_from ?? 'admin',
			'prompt'         => $usage->prompt ?? '',
			'input_tokens'   => (int) ( $usage->input_tokens ?? 0 ),
			'output_tokens'  => (int) ( $usage->output_tokens ?? 0 ),
			'total_tokens'   => (int) ( $usage->total_tokens ?? 0 ),
			'video_seconds'  => (float) ( $usage->video_seconds ?? 0 ),
			'output_count'   => (int) ( $usage->output_count ?? 1 ),
			'status'         => $usage->status ?? 'success',
			'error_message'  => $usage->error_message ?? null,
			'meta'           => is_array( $usage->meta ) ? wp_json_encode( $usage->meta ) : $usage->meta,
			'created_at'     => $usage->created_at ?? current_time( 'mysql' ),
		);

		$wpdb->insert( self::get_table_name(), $insert_data );

		return $wpdb->insert_id;
	}

	/**
	 * Get statistics.
	 *
	 * @return array
	 */
	public function get_stats(): array {
		global $wpdb;
		$table = self::get_table_name();

		$image_count   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE type = 'image' AND status = 'success'" );
		$video_count   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE type = 'video' AND status = 'success'" );
		$tryon_count   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE generated_from = 'tryon' AND status = 'success'" );
		$total_tokens  = $wpdb->get_var( "SELECT SUM(total_tokens) FROM $table WHERE status = 'success'" );
		$video_seconds = $wpdb->get_var( "SELECT SUM(video_seconds) FROM $table WHERE type = 'video' AND status = 'success'" );

		return array(
			'image_count'   => (int) $image_count,
			'video_count'   => (int) $video_count,
			'tryon_count'   => (int) $tryon_count,
			'total_tokens'  => (int) $total_tokens,
			'video_seconds' => (float) $video_seconds,
		);
	}
}

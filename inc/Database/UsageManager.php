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
	 * @param array $args Filter arguments.
	 *
	 * @return array
	 */
	public function get_stats( array $args = array() ): array {
		global $wpdb;
		$table = self::get_table_name();

		$start_date = $args['start_date'] ?? null;
		$end_date   = $args['end_date'] ?? null;

		$where  = "WHERE status = 'success'";
		$params = array();

		if ( $start_date ) {
			$where   .= ' AND created_at >= %s';
			$params[] = $start_date . ' 00:00:00';
		}

		if ( $end_date ) {
			$where   .= ' AND created_at <= %s';
			$params[] = $end_date . ' 23:59:59';
		}

		$sql_image   = $wpdb->prepare( "SELECT COUNT(*) FROM $table $where AND type = 'image'", $params );
		$sql_video   = $wpdb->prepare( "SELECT COUNT(*) FROM $table $where AND type = 'video'", $params );
		$sql_tryon   = $wpdb->prepare( "SELECT COUNT(*) FROM $table $where AND generated_from = 'tryon'", $params );
		$sql_tokens  = $wpdb->prepare( "SELECT SUM(total_tokens) FROM $table $where", $params );
		$sql_seconds = $wpdb->prepare( "SELECT SUM(video_seconds) FROM $table $where AND type = 'video'", $params );

		$image_count   = $wpdb->get_var( $sql_image );
		$video_count   = $wpdb->get_var( $sql_video );
		$tryon_count   = $wpdb->get_var( $sql_tryon );
		$total_tokens  = $wpdb->get_var( $sql_tokens );
		$video_seconds = $wpdb->get_var( $sql_seconds );

		return array(
			'image_count'   => (int) $image_count,
			'video_count'   => (int) $video_count,
			'tryon_count'   => (int) $tryon_count,
			'total_tokens'  => (int) $total_tokens,
			'video_seconds' => (float) $video_seconds,
		);
	}
}

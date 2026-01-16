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
			'object_id'      => (int) ( $usage->object_id ?? 0 ) ?: null,
			'object_type'    => $usage->object_type ?? null,
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
		$sql_tryon   = $wpdb->prepare( "SELECT COUNT(*) FROM $table $where AND generated_from = 'tryon'", $params );
		$sql_tokens  = $wpdb->prepare( "SELECT SUM(total_tokens) FROM $table $where", $params );

		$image_count   = $wpdb->get_var( $sql_image );
		$total_tokens  = $wpdb->get_var( $sql_tokens );
		
		$stats = array(
			'image_count'   => (int) $image_count,
			'total_tokens'  => (int) $total_tokens,
		);

		$stats = apply_filters('try_aura_stats_data', $stats, $table, $where, $params);

		if ( class_exists( 'WooCommerce' ) ) {
			$stats['tryon_count'] = (int) $wpdb->get_var( $sql_tryon );
		}

		return $stats;
	}

	/**
	 * Get recent activities.
	 *
	 * @param array $args Filter arguments.
	 *
	 * @return array
	 */
	public function get_recent_activities( array $args = array() ): array {
		global $wpdb;
		$table = self::get_table_name();

		$limit = isset( $args['limit'] ) ? (int) $args['limit'] : 5;
		$type  = $args['type'] ?? null;

		$where  = "WHERE status = 'success'";
		$params = array();

		if ( $type ) {
			$is_fetchable = ($type === 'image' || $type === 'tryon');
			$is_fetchable = apply_filters('try_aura_recent_activity_type', $is_fetchable, $type );

			if( $is_fetchable === false ) return [];

			if ( $type === 'tryon' ) {
				if ( ! class_exists( 'WooCommerce' ) ) {
					return array();
				}
				$where .= " AND generated_from = 'tryon'";
			} else {
				$where   .= ' AND type = %s';
				$params[] = $type;
			}
		} else {
			$type_list    = [ 'image', 'tryon' ];
			$type_list    = apply_filters('try_aura_recent_activity_type_list', $type_list);
			$types_quoted = [];

			foreach( $type_list as $type_item ) {
				$types_quoted[] = "'$type_item'";
			}
			
			$all_types  = '(' . implode(', ', $types_quoted) . ')';
			$where     .= ' AND type in '. $all_types;
		}

		if ( ! class_exists( 'WooCommerce' ) ) {
			$where .= " AND generated_from != 'tryon'";
		}

		$sql = "SELECT * FROM $table $where ORDER BY created_at DESC LIMIT $limit";
		if ( ! empty( $params ) ) {
			$sql = $wpdb->prepare( $sql, $params );
		}

		$results = $wpdb->get_results( $sql, ARRAY_A );

		foreach ( $results as &$result ) {
			$result['object_name'] = '';
			if ( ! empty( $result['object_id'] ) ) {
				$result['object_name'] = get_the_title( $result['object_id'] );
			}
			$result['human_time_diff'] = human_time_diff( strtotime( $result['created_at'] ), current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'try-aura' );
		}

		return $results;
	}
}

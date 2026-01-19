<?php
/**
 * Usage Manager.
 *
 * @package TryAura
 */

namespace Dokan\TryAura\Database;

use Dokan\TryAura\Models\Usage;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Usage Manager class.
 */
class UsageManager {

	/**
	 * Cache group.
	 *
	 * @var string
	 */
	const CACHE_GROUP = 'tryaura_usage';

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
			'object_id'      => ! empty( $usage->object_id ) ? (int) $usage->object_id : null,
			'object_type'    => $usage->object_type ?? null,
			'meta'           => is_array( $usage->meta ) ? wp_json_encode( $usage->meta ) : $usage->meta,
			'created_at'     => $usage->created_at ?? current_time( 'mysql' ),
		);

		$wpdb->insert( self::get_table_name(), $insert_data ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

		wp_cache_set( 'last_changed', microtime(), self::CACHE_GROUP );

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

		$start_date = isset( $args['start_date'] ) ? sanitize_text_field( $args['start_date'] ) : null;
		$end_date   = isset( $args['end_date'] ) ? sanitize_text_field( $args['end_date'] ) : null;

		$last_changed = wp_cache_get( 'last_changed', self::CACHE_GROUP );
		if ( ! $last_changed ) {
			$last_changed = microtime();
			wp_cache_set( 'last_changed', $last_changed, self::CACHE_GROUP );
		}

		$cache_key = 'stats_' . md5( wp_json_encode( $args ) ) . ':' . $last_changed;
		$stats     = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false !== $stats ) {
			return $stats;
		}

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


		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
		$image_count = $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i $where AND type = 'image'", array_merge( array( $table ), $params ) ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
		//$video_count = $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i $where AND type = 'video'", array_merge( array( $table ), $params ) ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
		$total_tokens = $wpdb->get_var( $wpdb->prepare( "SELECT SUM(total_tokens) FROM %i $where", array_merge( array( $table ), $params ) ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
		//$video_seconds = $wpdb->get_var( $wpdb->prepare( "SELECT SUM(video_seconds) FROM %i $where AND type = 'video'", array_merge( array( $table ), $params ) ) );

		$stats = array(
			'image_count'   => (int) $image_count,
			'total_tokens'  => (int) $total_tokens,
		);

		$stats = apply_filters('try_aura_admin_dashboard_stats_data', $stats, $table, $where, $params);

		if ( class_exists( 'WooCommerce' ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
			$stats['tryon_count'] = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i $where AND generated_from = 'tryon'", array_merge( array( $table ), $params ) ) );
		}

		wp_cache_set( $cache_key, $stats, self::CACHE_GROUP );

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
		$type  = isset( $args['type'] ) ? sanitize_text_field( $args['type'] ) : null;

		$last_changed = wp_cache_get( 'last_changed', self::CACHE_GROUP );
		if ( ! $last_changed ) {
			$last_changed = microtime();
			wp_cache_set( 'last_changed', $last_changed, self::CACHE_GROUP );
		}

		$cache_key = 'recent_activities_' . md5( wp_json_encode( $args ) ) . ':' . $last_changed;
		$results   = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false !== $results ) {
			return $results;
		}

		$where  = "WHERE status = 'success'";
		$params = array( $table );

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

		$params[] = $limit;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber, PluginCheck.Security.DirectDB.UnescapedDBParameter
		$results = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i $where ORDER BY created_at DESC LIMIT %d", ...$params ), ARRAY_A );

		foreach ( $results as &$result ) {
			$result['object_name'] = '';
			if ( ! empty( $result['object_id'] ) ) {
				$result['object_name'] = get_the_title( $result['object_id'] );
			}
			$result['human_time_diff'] = human_time_diff( strtotime( $result['created_at'] ), current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'try-aura' ); // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested
		}

		wp_cache_set( $cache_key, $results, self::CACHE_GROUP );

		return $results;
	}
}

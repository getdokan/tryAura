<?php
/**
 * Usage Model.
 *
 * @package TryAura
 */

namespace Dokan\TryAura\Models;

use Dokan\TryAura\Abstracts\Model;

/**
 * Usage Model class.
 *
 * @since PLUGIN_SINCE
 *
 * @property int          $id
 * @property int          $user_id
 * @property string       $provider
 * @property string       $model
 * @property string       $type
 * @property string       $generated_from
 * @property string       $prompt
 * @property int          $input_tokens
 * @property int          $output_tokens
 * @property int          $total_tokens
 * @property float        $video_seconds
 * @property int          $output_count
 * @property string       $status
 * @property string       $error_message
 * @property int          $object_id
 * @property string       $object_type
 * @property string|array $meta
 * @property string       $created_at
 */
class Usage extends Model {
}

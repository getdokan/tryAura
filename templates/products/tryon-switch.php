<?php
/**
 * Template for displaying a switch to enable/disable a product.
 *
 * @since PLUGIN_SINCE
 *
 * @var int $product_id Product ID.
 * @var bool $checked True if the product is enabled.
 *
 * @package TryAura
 */

if ( ! defined( 'ABSPATH' ) ) exit;
?>

<div class="tryaura">
	<label class="relative inline-flex items-center cursor-pointer">
		<input type="checkbox" class="sr-only peer try-aura-toggle-try-on" data-product-id="<?php echo esc_attr( $product_id ); ?>" <?php checked( $checked ); ?> />
		<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
	</label>
</div>

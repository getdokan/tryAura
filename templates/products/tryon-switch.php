<?php
/**
 * Template for displaying a switch to enable/disable a product.
 *
 * @since 1.0.0
 *
 * @var int $product_id Product ID.
 * @var bool $checked True if the product is enabled.
 *
 * @package TryAura
 */

if ( ! defined( 'ABSPATH' ) ) exit;
?>

<label class="tryaura-try-on" aria-label="<?php esc_attr_e( 'Enable try-on for this product', 'tryaura' ); ?>">
	<input type="checkbox" class="tryaura-try-on__input tryaura-toggle-try-on" data-product-id="<?php echo esc_attr( $product_id ); ?>" <?php checked( $checked ); ?> />
	<span class="tryaura-try-on__track" aria-hidden="true"></span>
</label>

<?php

namespace Dokan\TryAura\Abstracts;

/**
 * Abstract Model class.
 */
abstract class Model {

	/**
	 * Data holder.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @var array
	 */
	protected array $data = array();

	/**
	 * Constructor.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param array $data Model data.
	 */
	public function __construct( array $data = array() ) {
		$this->data = $data;
	}

	/**
	 * Magic getter.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param string $name Property name.
	 *
	 * @return mixed|null
	 */
	public function __get( string $name ) {
		return $this->data[ $name ] ?? null;
	}

	/**
	 * Magic setter.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @param string $name  Property name.
	 * @param mixed  $value Property value.
	 */
	public function __set( string $name, $value ) {
		$this->data[ $name ] = $value;
	}

	/**
	 * Convert model to array.
	 *
	 * @since PLUGIN_SINCE
	 *
	 * @return array
	 */
	public function to_array(): array {
		return $this->data;
	}
}

<?php

namespace Dokan\TryAura\Abstracts;

/**
 * Abstract Model class.
 */
abstract class Model {

	/**
	 * Data holder.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected array $data = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Model data.
	 */
	public function __construct( array $data = array() ) {
		$this->data = $data;
	}

	/**
	 * Magic getter.
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function to_array(): array {
		return $this->data;
	}
}

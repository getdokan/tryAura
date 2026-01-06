<?php

namespace Dokan\TryAura\Abstracts;

/**
 * Abstract Model class.
 */
abstract class Model {

	/**
	 * Data holder.
	 *
	 * @var array
	 */
	protected array $data = array();

	/**
	 * Constructor.
	 *
	 * @param array $data Model data.
	 */
	public function __construct( array $data = array() ) {
		$this->data = $data;
	}

	/**
	 * Magic getter.
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
	 * @param string $name  Property name.
	 * @param mixed  $value Property value.
	 */
	public function __set( string $name, $value ) {
		$this->data[ $name ] = $value;
	}

	/**
	 * Convert model to array.
	 *
	 * @return array
	 */
	public function to_array(): array {
		return $this->data;
	}
}

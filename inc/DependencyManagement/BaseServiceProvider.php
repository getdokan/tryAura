<?php

namespace Dokan\TryAura\DependencyManagement;

use Dokan\TryAura\ThirdParty\Packages\League\Container\Definition\DefinitionInterface;
use Dokan\TryAura\ThirdParty\Packages\League\Container\ServiceProvider\AbstractServiceProvider;

/**
 * Base class for the service providers used to register classes in the container.
 */
abstract class BaseServiceProvider extends AbstractServiceProvider {
	protected $services = [];
	protected $tags = [];

	/**
	 * {@inheritDoc}
	 *
	 * Check if the service provider can provide the given service alias.
	 *
	 * @param string $alias The service alias to check.
	 * @return bool True if the service provider can provide the service, false otherwise.
	 */
	public function provides( string $alias ): bool {
		if ( array_key_exists( $alias, $this->services ) || in_array( $alias, $this->services, true ) || in_array( $alias, $this->tags, true ) ) {
			return true;
		}

		foreach ( $this->services as $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}

			$implements = class_implements( $class );
			if ( $implements && in_array( $alias, $implements, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Register a class in the container and add tags for all the interfaces it implements.
	 *
	 * @param string     $id       Entry ID (typically a class or interface name).
	 * @param mixed|null $concrete Concrete entity to register under that ID, null for automatic creation.
	 * @param bool       $shared   Whether to register the class as shared (`get` always returns the same instance)
	 *                             or not.
	 *
	 * @return DefinitionInterface
	 */
	protected function add_with_implements_tags( string $id, $concrete = null, bool $shared = false ): DefinitionInterface {
		$definition = $this->getContainer()->add( $id, $concrete )->setShared( $shared );

		foreach ( class_implements( $id ) as $interface ) {
			$definition->addTag( $interface );
			if ( ! in_array( $interface, $this->services, true ) ) {
				$this->services[] = $interface;
			}
		}

		return $definition;
	}

	/**
	 * Register a shared class in the container and add tags for all the interfaces it implements.
	 *
	 * @param string     $id       Entry ID (typically a class or interface name).
	 * @param mixed|null $concrete Concrete entity to register under that ID, null for automatic creation.
	 *
	 * @return DefinitionInterface
	 */
	protected function share_with_implements_tags( string $id, $concrete = null ): DefinitionInterface {
		return $this->add_with_implements_tags( $id, $concrete, true );
	}

	/**
	 * Adds tags to the given definition.
	 *
	 * @param DefinitionInterface $definition The definition to which tags will be added.
	 * @param array $tags An array of tags to add to the definition.
	 *
	 * @return void
	 */
	protected function add_tags( DefinitionInterface $definition, $tags ) {
		foreach ( $tags as $tag ) {
			$definition = $definition->addTag( $tag );
		}
	}
}

<?php

namespace Dokan\TryAura\DependencyManagement;

use Dokan\TryAura\ThirdParty\Packages\League\Container\ServiceProvider\BootableServiceProviderInterface;

/**
 * Base class for the service providers used to register classes in the container or/and to register the other service providers.
 */
abstract class BootableServiceProvider extends BaseServiceProvider implements BootableServiceProviderInterface {

}

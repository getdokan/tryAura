<?php

declare(strict_types=1);

namespace Dokan\TryAura\ThirdParty\Packages\League\Container\Exception;

use Dokan\TryAura\ThirdParty\Packages\Psr\Container\ContainerExceptionInterface;
use RuntimeException;

class ContainerException extends RuntimeException implements ContainerExceptionInterface
{
}

<?php

declare(strict_types=1);

namespace Dokan\TryAura\ThirdParty\Packages\League\Container\Exception;

use Dokan\TryAura\ThirdParty\Packages\Psr\Container\NotFoundExceptionInterface;
use InvalidArgumentException;

class NotFoundException extends InvalidArgumentException implements NotFoundExceptionInterface
{
}

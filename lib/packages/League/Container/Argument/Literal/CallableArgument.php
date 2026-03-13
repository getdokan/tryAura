<?php

declare(strict_types=1);

namespace Dokan\TryAura\ThirdParty\Packages\League\Container\Argument\Literal;

use Dokan\TryAura\ThirdParty\Packages\League\Container\Argument\LiteralArgument;

class CallableArgument extends LiteralArgument
{
    public function __construct(callable $value)
    {
        parent::__construct($value, LiteralArgument::TYPE_CALLABLE);
    }
}

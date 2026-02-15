<?php

declare(strict_types=1);

namespace Dokan\TryAura\ThirdParty\Packages\League\Container\Argument\Literal;

use Dokan\TryAura\ThirdParty\Packages\League\Container\Argument\LiteralArgument;

class IntegerArgument extends LiteralArgument
{
    public function __construct(int $value)
    {
        parent::__construct($value, LiteralArgument::TYPE_INT);
    }
}

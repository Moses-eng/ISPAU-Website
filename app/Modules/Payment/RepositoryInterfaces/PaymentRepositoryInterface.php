<?php

namespace App\Modules\Payment\RepositoryInterfaces;

use App\Modules\Payment\Models\PaymentModel;
use Illuminate\Database\Eloquent\Collection;

interface PaymentRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?PaymentModel;
    public function create(array $data): PaymentModel;
    public function update(PaymentModel $payment, array $data): PaymentModel;
    public function delete(PaymentModel $payment): bool;
}

<?php

namespace App\Console\Commands;

use App\Models\MerchandiseOrder;
use App\Models\Order;
use App\Models\TicketPackage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OrdersCancelExpired extends Command
{
    protected $signature = 'orders:cancel-expired';

    protected $description = 'Cancel expired pending orders and restore ticket stock';

    public function handle()
    {
        $ticketOrders = Order::where('payment_status', 'pending')
            ->whereNull('payment_proof')
            ->where('expires_at', '<', now())
            ->with('issuedTickets')
            ->get();

        $ticketCount = 0;
        foreach ($ticketOrders as $order) {
            DB::transaction(function () use ($order, &$ticketCount) {
                $ticketsByPackage = $order->issuedTickets->groupBy('ticket_package_id');
                foreach ($ticketsByPackage as $packageId => $tickets) {
                    TicketPackage::where('id', $packageId)->increment('stock', $tickets->count());
                }
                $order->update([
                    'payment_status' => 'failed',
                    'rejected_reason' => 'Pesanan dibatalkan karena melebihi batas waktu pembayaran.',
                ]);
                $ticketCount++;
            });
        }

        $merchCount = MerchandiseOrder::where('status', 'pending')
            ->whereNull('payment_proof')
            ->where('expires_at', '<', now())
            ->update([
                'status' => 'rejected',
                'rejection_reason' => 'Pesanan dibatalkan karena melebihi batas waktu pembayaran.',
            ]);

        $this->info("Cancelled {$ticketCount} ticket orders and {$merchCount} merchandise orders.");

        return Command::SUCCESS;
    }
}

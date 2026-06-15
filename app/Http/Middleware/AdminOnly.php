<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'operator_produk'])) {
            abort(403, 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.');
        }

        // operator_produk: dashboard redirect, event dashboard & merchandise only
        if ($user->role === 'operator_produk') {
            $path = $request->path();
            $allowed = $path === 'admin/dashboard'
                || preg_match('#^admin/events/[^/]+$#', $path)
                || str_contains($path, '/merchandise');
            if (!$allowed) {
                abort(403, 'Akses ditolak. Operator Produk hanya dapat mengakses Dashboard dan Logger Penjualan Merch.');
            }
        }

        return $next($request);
    }
}
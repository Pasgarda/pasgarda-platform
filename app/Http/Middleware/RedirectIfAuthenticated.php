<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::user();
                if (in_array($user->role, ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'operator_produk'])) {
                    return redirect('/admin/dashboard');
                }
                return redirect('/');
            }
        }

        return $next($request);
    }
}
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessScoreAggregationJob;
use App\Jobs\SendEmailJob;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (!in_array(auth()->user()->role, ['super_admin'])) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
                'activity_type' => 'forbidden_access',
                'details' => "User role '{$request->user()->role}' tried to access user management",
            ]);
            abort(403, 'Only super_admin can manage users.');
        }

        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'created_at' => $u->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'search' => $request->query('search'),
            'roleFilter' => $request->query('role'),
        ]);
    }

    public function updateRole(Request $request, $id)
    {
        if (!in_array(auth()->user()->role, ['super_admin'])) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
                'activity_type' => 'forbidden_access',
                'details' => "User role '{$request->user()->role}' tried to update user role",
            ]);
            abort(403, 'Only super_admin can manage users.');
        }

        $request->validate([
            'role' => 'required|in:super_admin,admin,operator_gate,operator_nilai,operator_produk,spectator,coach',
        ]);

        $user = User::findOrFail($id);
        $oldRole = $user->role;
        $user->update(['role' => $request->role]);

        if ($request->role === 'coach') {
            // Find all contingents matching the coach email or name
            $contingents = \App\Models\Contingent::where('coach_email', $user->email)
                ->orWhere('coach_name', $user->name)
                ->get();
            foreach ($contingents as $con) {
                ProcessScoreAggregationJob::dispatch($con->event_id, $con->id);
            }

            // Send coach promotion email
            if ($user->email) {
                try {
                    $coachUrl = url('/coach/dashboard');
                    $subject = "Selamat! Anda Telah Menjadi Pelatih di PASGARDA";
                    $body = "Halo {$user->name},\n\nSelamat! Akun Anda telah ditingkatkan menjadi Pelatih (Coach) di platform PASGARDA.\n\nSilakan buka Portal Pelatih untuk mengakses fitur pelatih:\n{$coachUrl}\n\nDi portal ini Anda dapat melihat nilai kontingen Anda, mengelola data, dan memantau perkembangan peserta.\n\nTerima kasih,\nPanitia PASGARDA";
                    SendEmailJob::dispatch($user->email, $subject, $body);
                } catch (\Exception $e) {
                    Log::error("Gagal mengirim email coach promotion: " . $e->getMessage());
                }
            }
        }

        ActivityLog::create([
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'activity_type' => 'role_change',
            'details' => "Changed user {$user->email} ({$user->name}) role from '{$oldRole}' to '{$request->role}'",
        ]);

        return back()->with('status', "Role {$user->name} berhasil diubah menjadi {$request->role}.");
    }
}

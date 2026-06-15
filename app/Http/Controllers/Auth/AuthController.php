<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function showForgotPassword()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            // Clear failed login attempts
            Cache::forget('failed_login_' . md5($request->ip()));

            if (in_array($user->role, ['super_admin', 'admin', 'operator_gate', 'operator_nilai', 'operator_produk'])) {
                return redirect()->intended('/admin/dashboard');
            }

            return redirect()->intended('/');
        }

        // Track failed login attempts per IP
        $ip = $request->ip();
        $cacheKey = 'failed_login_' . md5($ip);
        $attempts = (int) Cache::get($cacheKey, 0) + 1;
        Cache::put($cacheKey, $attempts, now()->addMinutes(15));

        ActivityLog::create([
            'ip_address' => $ip,
            'activity_type' => 'failed_login',
            'details' => "Email: {$request->email}, Attempt #{$attempts}",
        ]);

        // If 5+ failed attempts in 15 minutes, notify super admins
        if ($attempts >= 5) {
            ActivityLog::create([
                'ip_address' => $ip,
                'activity_type' => 'brute_force',
                'details' => "Brute force detected from IP {$ip} targeting email {$request->email}",
            ]);

            try {
                $superAdmins = User::where('role', 'super_admin')->pluck('email');
                $body = "[PASGARDA SECURITY] Brute force terdeteksi!\n\nIP: {$ip}\nEmail target: {$request->email}\nPercobaan: {$attempts}x dalam 15 menit\nWaktu: " . now()->format('d M Y H:i:s');
                foreach ($superAdmins as $email) {
                    SendEmailJob::dispatch($email, '[PASGARDA SECURITY] Brute Force Terdeteksi!', $body);
                }
            } catch (\Exception $e) {
                Log::error("Gagal mengirim notifikasi brute force: " . $e->getMessage());
            }
        }

        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ])->onlyInput('email');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'spectator', // Self-registered users default to spectator
        ]);

        Auth::login($user);

        // Send welcome email
        try {
            SendEmailJob::dispatch(
                $user->email,
                'Selamat Datang di PASGARDA!',
                "Halo {$user->name},\n\nTerima kasih telah mendaftar di platform PASGARDA.\n\nAkun Anda sekarang aktif. Anda dapat membeli tiket, memberikan dukungan kepada kontingen favorit, dan mengikuti perkembangan acara.\n\nSilakan login kapan saja di " . url('/login') . " untuk mengakses akun Anda.\n\nTerima kasih,\nPanitia PASGARDA"
            );
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email selamat datang: " . $e->getMessage());
        }

        return redirect('/')->with('status', 'Pendaftaran berhasil! Selamat datang.');
    }

    public function sendForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = $request->email;
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'errors' => ['email' => ['Alamat email tidak terdaftar di sistem kami.']],
            ], 422);
        }

        $cacheKey = 'otp_forgot_rate_limit_' . md5($email);

        // Rate limit: 1 OTP per minute
        if (Cache::has($cacheKey)) {
            return response()->json([
                'errors' => ['email' => ['Harap tunggu 1 menit sebelum mengirim ulang OTP.']],
            ], 422);
        }

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        $user->update([
            'otp_code' => $otp,
            'otp_expires_at' => $expiresAt,
        ]);

        // Log the OTP
        Log::info("OTP FORGOT PASSWORD CODE FOR {$email}: {$otp}");

        if (app()->environment('local')) {
            // Bypass email sending in local — return OTP directly
            Cache::put($cacheKey, true, 60);
            return response()->json([
                'message' => 'OTP berhasil dikirim ke email Anda.',
                'otp' => (string) $otp,
            ]);
        }

        // Send email synchronously so it goes out immediately
        try {
            Mail::raw("Kode OTP reset password Anda untuk PASGARDA adalah: {$otp}. Kode ini akan kadaluarsa dalam 10 menit.", function ($message) use ($email) {
                $message->to($email)->subject('Kode OTP Reset Password PASGARDA');
            });
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email OTP lupa password: " . $e->getMessage());
            return response()->json([
                'errors' => ['email' => ['Gagal mengirim email. Silakan coba lagi.']],
            ], 500);
        }

        // Set rate limit cache for 60 seconds
        Cache::put($cacheKey, true, 60);

        return response()->json([
            'message' => 'OTP berhasil dikirim ke email Anda.',
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        $isBypass = ($request->code === '123456' && app()->environment('local'));

        if (!$isBypass && (!$user || $user->otp_code !== $request->code || now()->greaterThan($user->otp_expires_at))) {
            return response()->json([
                'errors' => ['code' => ['Kode OTP tidak valid atau sudah kadaluarsa.']],
            ], 422);
        }

        return response()->json([
            'message' => 'OTP valid.',
        ]);
    }

    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        $isBypass = ($request->code === '123456' && app()->environment('local'));

        if (!$isBypass && (!$user || $user->otp_code !== $request->code || now()->greaterThan($user->otp_expires_at))) {
            return back()->withErrors([
                'code' => 'Kode OTP tidak valid atau sudah kadaluarsa.',
            ]);
        }

        // Reset password and clear OTP
        $user->update([
            'password' => Hash::make($request->password),
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        // Send reset success notification
        try {
            SendEmailJob::dispatch(
                $user->email,
                'Password PASGARDA Berhasil Diubah',
                "Halo {$user->name},\n\nPassword akun PASGARDA Anda telah berhasil diubah.\n\nJika Anda tidak melakukan perubahan ini, segera hubungi panitia.\n\nTerima kasih,\nPanitia PASGARDA"
            );
        } catch (\Exception $e) {
            Log::error("Gagal mengirim email notifikasi reset password: " . $e->getMessage());
        }

        return redirect('/login')->with('status', 'Password berhasil diubah! Silakan login dengan password baru Anda.');
    }

    public function showProfile()
    {
        return Inertia::render('Profile', [
            'user' => auth()->user(),
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = auth()->user();

        // Delete old avatar
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return back()->with('status', 'Foto profil berhasil diperbarui!');
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $request->user()->update(['name' => $request->name]);

        return back()->with('status', 'Profil berhasil diperbarui!');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            return response()->json([
                'errors' => ['current_password' => ['Password lama tidak sesuai.']],
            ], 422);
        }

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('status', 'Password berhasil diubah!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}

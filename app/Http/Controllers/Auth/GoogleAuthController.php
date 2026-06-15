<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function redirectToGoogle()
    {
        // If Google credentials are not set, simulate/mock the login for local development
        if (empty(config('services.google.client_id')) || empty(config('services.google.client_secret'))) {
            return $this->handleMockLogin();
        }

        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect('/login')->withErrors([
                'email' => 'Gagal masuk dengan Google. Silakan coba lagi.',
            ]);
        }

        $user = User::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->getName() ?? explode('@', $googleUser->getEmail())[0],
                'google_id' => $googleUser->getId(),
                'role' => 'spectator', // Spectators login via Google
            ]
        );

        // Send welcome email for newly registered users
        if ($user->wasRecentlyCreated) {
            try {
                SendEmailJob::dispatch(
                    $user->email,
                    'Selamat Datang di PASGARDA!',
                    "Halo {$user->name},\n\nSelamat! Akun PASGARDA Anda berhasil dibuat melalui Google.\n\nAkun Anda sekarang aktif. Anda dapat membeli tiket, memberikan dukungan kepada kontingen favorit, dan mengikuti perkembangan acara.\n\nTerima kasih,\nPanitia PASGARDA"
                );
            } catch (\Exception $e) {
                Log::error("Gagal mengirim email selamat datang Google: " . $e->getMessage());
            }
        }

        // Update google_id if not present
        if (empty($user->google_id)) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        Auth::login($user);

        return redirect('/');
    }

    private function handleMockLogin()
    {
        // Generate mock Google user
        $mockEmail = 'spectator.mock@pasgarda.com';
        $user = User::firstOrCreate(
            ['email' => $mockEmail],
            [
                'name' => 'Spectator Mock (Google Dev)',
                'google_id' => 'mock_google_id_12345',
                'role' => 'spectator',
            ]
        );

        if ($user->wasRecentlyCreated) {
            try {
                SendEmailJob::dispatch(
                    $user->email,
                    'Selamat Datang di PASGARDA!',
                    "Halo {$user->name},\n\nSelamat! Akun PASGARDA Anda berhasil dibuat.\n\nAkun Anda sekarang aktif. Silakan jelajahi platform PASGARDA.\n\nTerima kasih,\nPanitia PASGARDA"
                );
            } catch (\Exception $e) {
                Log::error("Gagal mengirim email selamat datang mock: " . $e->getMessage());
            }
        }

        Auth::login($user);

        return redirect('/')->with('status', 'Berhasil login menggunakan Akun Google Simulasi (Dev Mode).');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\RolePermission;
use App\Models\Contingent;
use App\Models\IssuedTicket;
use App\Models\JuryScore;
use App\Models\Order;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\SocialMediaLike;
use App\Models\SupporterLog;
use App\Models\VoteLog;
use App\Models\MerchandiseOrder;
use App\Models\MerchandiseSale;
use App\Models\MerchandisePurchase;
use App\Models\ActivityLog;
use App\Models\VisitorCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ControlRoomController extends Controller
{
    public function index($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        if (!RolePermission::canAccess($event->id, auth()->user()->role, 'control_room')) {
            abort(403, 'Akses ditolak. Hanya Super Admin yang dapat mengakses Platform Control Room.');
        }

        $referer = request()->headers->get('referer', '');
        $fromControlRoom = str_contains($referer, '/control-room');

        if (!session('control_room_authenticated') || !$fromControlRoom) {
            session()->forget('control_room_authenticated');
            return Inertia::render('Admin/ControlRoom', [
                'event' => $event,
                'needsPin' => true,
            ]);
        }

        return $this->dashboard(request(), $slug);
    }

    private function dashboard(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $contingentCount = Contingent::where('event_id', $event->id)->count();
        $scoreCount = Score::where('event_id', $event->id)->count();
        $juryScoreCount = JuryScore::where('event_id', $event->id)->count();
        $voteCount = VoteLog::where('event_id', $event->id)->count();
        $supporterCount = SupporterLog::where('event_id', $event->id)->count();
        $likeCount = SocialMediaLike::count();
        $orderCount = Order::where('event_id', $event->id)->count();
        $checkedInCount = IssuedTicket::whereHas('order', function ($q) use ($event) {
            $q->where('event_id', $event->id);
        })->where('check_in_status', true)->count();
        $visitorCount = VisitorCount::sum('count') ?: 0;

        if (!RolePermission::where('event_id', $event->id)->exists()) {
            RolePermission::seedDefaults($event->id);
        } else {
            RolePermission::ensureModulesExist($event->id);
        }
        $rolePermissions = RolePermission::getRolePermissions($event->id);

        return Inertia::render('Admin/ControlRoom', [
            'event' => $event,
            'needsPin' => false,
            'rolePermissions' => $rolePermissions,
            'stats' => [
                'contingents' => $contingentCount,
                'scores' => $scoreCount,
                'jury_scores' => $juryScoreCount,
                'votes' => $voteCount,
                'supporters' => $supporterCount,
                'likes' => $likeCount,
                'orders' => $orderCount,
                'checked_in' => $checkedInCount,
                'visitors' => $visitorCount,
            ],
        ]);
    }

    public function verifyPin(Request $request, $slug)
    {
        if ($request->isMethod('GET')) {
            return redirect()->to('/admin/events/' . $slug . '/control-room');
        }

        $request->validate(['pin' => 'required|string']);

        if ($request->pin !== '647205') {
            return back()->withErrors(['pin' => 'PIN salah']);
        }

        session(['control_room_authenticated' => true]);
        session()->save();

        return $this->dashboard($request, $slug);
    }

    public function reset($slug)
    {
        if (session('control_room_authenticated') !== true) {
            return back()->with('status', 'Akses ditolak. Verifikasi PIN terlebih dahulu.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();

        if (!RolePermission::canAccess($event->id, auth()->user()->role, 'control_room')) {
            abort(403, 'Akses ditolak.');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        VoteLog::where('event_id', $event->id)->delete();
        SupporterLog::where('event_id', $event->id)->delete();
        SocialMediaLike::whereIn('contingent_id', Contingent::where('event_id', $event->id)->pluck('id'))->delete();

        JuryScore::where('event_id', $event->id)->delete();
        Score::where('event_id', $event->id)->delete();
        ScoreFinalRound::where('event_id', $event->id)->delete();
        DB::table('score_pbb_details')->truncate();

        Order::where('event_id', $event->id)->delete();
        MerchandiseOrder::where('event_id', $event->id)->delete();
        MerchandiseSale::where('event_id', $event->id)->delete();
        MerchandisePurchase::where('event_id', $event->id)->delete();

        VisitorCount::truncate();
        ActivityLog::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        Cache::flush();

        return back()->with('status', 'Semua data operasional berhasil di-reset ke 0!');
    }

    public function resetItem(Request $request, $slug)
    {
        if (session('control_room_authenticated') !== true) {
            return back()->with('status', 'Akses ditolak. Verifikasi PIN terlebih dahulu.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();

        if (!RolePermission::canAccess($event->id, auth()->user()->role, 'control_room')) {
            abort(403, 'Akses ditolak.');
        }

        $type = $request->input('type');
        $label = '';

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $resetType = $type;
        $label = match ($resetType) {
            'scores' => 'Nilai & Skor Juri',
            'votes' => 'Vote',
            'supporters' => 'Supporter',
            'likes' => 'Likes Sosmed',
            'orders' => 'Orders & Tiket',
            'merchandise' => 'Merchandise',
            'visitors' => 'Visitor Count',
            'activity' => 'Activity Log',
            default => '',
        };

        if ($resetType === 'scores') {
            JuryScore::where('event_id', $event->id)->delete();
            Score::where('event_id', $event->id)->delete();
            ScoreFinalRound::where('event_id', $event->id)->delete();
            DB::table('score_pbb_details')->truncate();
        } elseif ($resetType === 'votes') {
            VoteLog::where('event_id', $event->id)->delete();
        } elseif ($resetType === 'supporters') {
            SupporterLog::where('event_id', $event->id)->delete();
        } elseif ($resetType === 'likes') {
            SocialMediaLike::whereIn('contingent_id', Contingent::where('event_id', $event->id)->pluck('id'))->delete();
        } elseif ($resetType === 'orders') {
            Order::where('event_id', $event->id)->delete();
        } elseif ($resetType === 'merchandise') {
            MerchandiseOrder::where('event_id', $event->id)->delete();
            MerchandiseSale::where('event_id', $event->id)->delete();
            MerchandisePurchase::where('event_id', $event->id)->delete();
        } elseif ($resetType === 'visitors') {
            VisitorCount::truncate();
        } elseif ($resetType === 'activity') {
            ActivityLog::truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        Cache::flush();

        return back()->with('status', "Data {$type} berhasil di-reset!");
    }

    public function downloadDatabase($slug)
    {
        if (session('control_room_authenticated') !== true) {
            return back()->with('status', 'Akses ditolak. Verifikasi PIN terlebih dahulu.');
        }

        $event = Event::where('slug', $slug)->firstOrFail();

        if (!RolePermission::canAccess($event->id, auth()->user()->role, 'control_room')) {
            abort(403, 'Akses ditolak.');
        }

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $filename = "backup_{$event->slug}_" . date('Y-m-d_His') . ".sql";
        $filepath = storage_path("app/backups/{$filename}");

        if (!is_dir(storage_path('app/backups'))) {
            mkdir(storage_path('app/backups'), 0755, true);
        }

        // Try XAMPP path first (local dev), then system PATH, then common Linux paths
        $mysqldumpPath = '/Applications/XAMPP/xamppfiles/bin/mysqldump';
        if (!file_exists($mysqldumpPath)) {
            $mysqldumpPath = trim(exec('which mysqldump 2>/dev/null'));
        }
        if (!$mysqldumpPath || !file_exists($mysqldumpPath)) {
            $alternatives = ['/usr/bin/mysqldump', '/usr/local/bin/mysqldump', '/usr/bin/mariadb-dump', '/usr/local/mysql/bin/mysqldump'];
            foreach ($alternatives as $alt) {
                if (file_exists($alt)) {
                    $mysqldumpPath = $alt;
                    break;
                }
            }
        }
        if (!$mysqldumpPath || !file_exists($mysqldumpPath)) {
            return back()->with('status', 'Gagal membuat backup database: mysqldump tidak ditemukan di server.');
        }

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port') ?: 3306;

        // Try without --no-tablespaces first (older mysqldump might not support it)
        $command = sprintf(
            '%s --host=%s --port=%s --user=%s --password=%s --databases %s 2>&1',
            escapeshellarg($mysqldumpPath),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($dbName)
        );

        exec($command, $output, $exitCode);

        if ($exitCode === 0) {
            file_put_contents($filepath, implode("\n", $output));
        }

        // If that failed, try with socket (common Linux socket path)
        if ($exitCode !== 0) {
            $socketPaths = ['/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock', '/var/run/mysqld/mysqld.sock', '/var/lib/mysql/mysql.sock', '/run/mysqld/mysqld.sock'];
            foreach ($socketPaths as $socket) {
                if (file_exists($socket)) {
                    $command = sprintf(
                        '%s --socket=%s --user=%s --password=%s --databases %s 2>&1',
                        escapeshellarg($mysqldumpPath),
                        escapeshellarg($socket),
                        escapeshellarg($dbUser),
                        escapeshellarg($dbPass),
                        escapeshellarg($dbName)
                    );
                    exec($command, $output, $exitCode);
                    if ($exitCode === 0) {
                        file_put_contents($filepath, implode("\n", $output));
                        break;
                    }
                }
            }
        }

        if ($exitCode !== 0) {
            return back()->with('status', 'Gagal membuat backup database: ' . implode("\n", $output));
        }

        return response()->download($filepath, $filename, [
            'Content-Type' => 'application/sql',
        ])->deleteFileAfterSend(true);
    }
}

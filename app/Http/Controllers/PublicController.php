<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\News;
use App\Models\VisitorCount;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cookie;

class PublicController extends Controller
{
    public function index(Request $request)
    {
        $activeEvent = Event::where('status', 'active')->first();

        // Visitor counter (cookie-based, +1 only first visit)
        $visitorCount = VisitorCount::sum('count') ?: 0;
        $setCookie = false;
        if (!$request->hasCookie('visited_pasgarda')) {
            $today = VisitorCount::firstOrCreate(['date' => now()->format('Y-m-d')]);
            $today->increment('count');
            $visitorCount = VisitorCount::sum('count');
            $setCookie = true;
        }

        // Enabled testimonials for public display
        $testimonials = Testimonial::with('user:id,name,avatar')
            ->whereHas('user')
            ->enabled()
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'user_name' => $t->user?->name ?? 'User tidak dikenal',
                'user_avatar' => $t->user?->avatar,
                'rating' => $t->rating,
                'message' => $t->message,
                'created_at' => $t->created_at->diffForHumans(),
            ]);

        // Historical Hall of Fame Winners
        $hallOfFame = \App\Models\HallOfFame::orderBy('year', 'desc')->get()->map(fn($item) => [
            'year' => $item->year,
            'event_name' => $item->event_name,
            'champion' => $item->champion,
            'runner_up' => $item->runner_up,
            'best_commander' => $item->best_commander,
            'favorite' => $item->favorite,
        ])->toArray();

        if (empty($hallOfFame)) {
            $hallOfFame = [
                [
                    'year' => 2025,
                    'event_name' => 'LPBB PASGARDA VOL.19',
                    'champion' => 'SMA Negeri 1 Samarinda',
                    'runner_up' => 'SMK Negeri 1 Samarinda',
                    'best_commander' => 'Danton SMA Negeri 1 Samarinda',
                    'favorite' => 'SMA Negeri 3 Samarinda',
                ],
                [
                    'year' => 2024,
                    'event_name' => 'LPBB PASGARDA VOL.18',
                    'champion' => 'SMA Negeri 2 Samarinda',
                    'runner_up' => 'SMA Negeri 1 Samarinda',
                    'best_commander' => 'Danton SMA Negeri 2 Samarinda',
                    'favorite' => 'SMK Negeri 2 Samarinda',
                ],
                [
                    'year' => 2023,
                    'event_name' => 'LPBB PASGARDA VOL.17',
                    'champion' => 'SMA Negeri 3 Samarinda',
                    'runner_up' => 'SMA Negeri 2 Samarinda',
                    'best_commander' => 'Danton SMA Negeri 3 Samarinda',
                    'favorite' => 'SMA Negeri 1 Samarinda',
                ],
            ];
            foreach ($hallOfFame as $hof) {
                \App\Models\HallOfFame::create($hof);
            }
        }

        // News & Announcements
        $news = \App\Models\News::latest()->take(20)->get()->map(fn($item) => [
            'id' => $item->id,
            'title' => $item->title,
            'category' => $item->category,
            'summary' => $item->summary,
            'date' => $item->date,
            'image_url' => $item->image_url,
        ])->toArray();

        if (empty($news)) {
            $news = [
                [
                    'title' => 'Pendaftaran LOMBA BARIS GARDA 55 VOL 20 Resmi Ditutup!',
                    'category' => 'Announcement',
                    'summary' => 'Panitia mengumumkan pendaftaran kontingen resmi ditutup dengan 40 sekolah terverifikasi.',
                    'date' => '01 Jun 2026',
                ],
                [
                    'title' => 'Mengintip Desain Piala Bergilir Tahun Ini: Chequered Champions',
                    'category' => 'Competition',
                    'summary' => 'Piala bergilir tahun ini didesain khusus bernuansa emas dan motif catur yang mewah.',
                    'date' => '28 Mei 2026',
                ],
                [
                    'title' => 'Prestasi Paskibra SMAN 5 Samarinda di Kancah Provinsi',
                    'category' => 'Achievement',
                    'summary' => 'Paskibra SMA Negeri 5 Samarinda meraih Juara Harapan 1 dalam ajang HUT Provinsi Kaltim.',
                    'date' => '15 Mei 2026',
                ],
            ];
            foreach ($news as $n) {
                \App\Models\News::create($n);
            }
            $news = \App\Models\News::latest()->take(20)->get()->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category,
                'summary' => $item->summary,
                'date' => $item->date,
                'image_url' => $item->image_url,
            ])->toArray();
        }

        if ($setCookie) {
            Cookie::queue('visited_pasgarda', true, 60 * 24 * 365);
        }

        $homeSlider = [];
        if ($activeEvent) {
            $content = \App\Models\EventContent::where('event_id', $activeEvent->id)
                ->where('key', 'home_slider')
                ->first();
            if ($content) {
                $homeSlider = $content->value ?? [];
            }
        }

        return Inertia::render('Welcome', [
            'activeEvent' => $activeEvent ? [
                'slug' => $activeEvent->slug,
                'name' => $activeEvent->name,
                'date_start' => $activeEvent->date_start->format('d M Y'),
                'date_end' => $activeEvent->date_end?->format('d M Y'),
                'date_range' => $activeEvent->date_start->day . '-' . $activeEvent->date_end->day . ' ' . $activeEvent->date_start->locale('id')->isoFormat('MMMM Y'),
                'venue' => $activeEvent->venue,
            ] : null,
            'hallOfFame' => $hallOfFame,
            'news' => $news,
            'visitorCount' => $visitorCount,
            'testimonials' => $testimonials,
            'homeSlider' => $homeSlider,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function faq()
    {
        $activeEvent = \App\Models\Event::where('status', 'active')->first();
        if (!$activeEvent) {
            $activeEvent = \App\Models\Event::first();
        }

        return Inertia::render('Public/Faq', [
            'activeEvent' => $activeEvent ? [
                'slug' => $activeEvent->slug,
                'name' => $activeEvent->name,
            ] : null,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function showNews(News $news)
    {
        $activeEvent = Event::where('status', 'active')->first() ?? Event::first();

        return Inertia::render('Public/NewsDetail', [
            'article' => [
                'id' => $news->id,
                'title' => $news->title,
                'category' => $news->category,
                'summary' => $news->summary,
                'content' => $news->content,
                'date' => $news->date,
                'image_url' => $news->image_url,
            ],
            'activeEvent' => $activeEvent ? [
                'slug' => $activeEvent->slug,
                'name' => $activeEvent->name,
            ] : null,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Contingent;
use App\Models\IssuedTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // Retrieve registered contingents that are verified
        $contingents = Contingent::where('event_id', $event->id)
            ->where('status', 'verified')
            ->select('id', 'school_name', 'region', 'category_type', 'logo_path', 'is_reguler', 'sort_order')
            ->orderBy('sort_order')
            ->get();

        // Organize contingents by category
        $categoriesList = [
            'SMP' => $contingents->where('category_type', 'U16')->values(),
            'SMA' => $contingents->where('category_type', 'U19')->values(),
            'SD' => $contingents->where('category_type', 'U12')->values(),
            'Purna' => $contingents->where('category_type', 'Purna')->values(),
        ];

        // Static Event Schedule Matrix details
        $scheduleData = \App\Models\EventSchedule::where('event_id', $event->id)->get();
        $schedule = [];
        foreach ($scheduleData as $item) {
            $schedule[$item->day_type] = [
                'date' => $item->date_string,
                'categories' => is_string($item->categories) ? json_decode($item->categories, true) : $item->categories,
                'timeline' => is_string($item->timeline) ? json_decode($item->timeline, true) : $item->timeline,
            ];
        }

        if (empty($schedule)) {
            $defaultSchedules = [
                'day_1' => [
                    'date' => 'Sabtu, 20 Juni 2026',
                    'categories' => ['U-16 (SMP)', 'Purna / Senior'],
                    'timeline' => [
                        ['time' => '07:30 - 08:00', 'activity' => 'Registrasi & Daftar Ulang Kontingen Hari ke-1'],
                        ['time' => '08:00 - 08:30', 'activity' => 'Upacara Pembukaan LOMBA BARIS GARDA 55 VOL 20'],
                        ['time' => '08:30 - 12:00', 'activity' => 'Sesi Penampilan Kategori U-16 (SMP) - Babak Penyisihan'],
                        ['time' => '12:00 - 13:00', 'activity' => 'Istirahat & Hiburan Pendukung'],
                        ['time' => '13:00 - 17:30', 'activity' => 'Sesi Penampilan Kategori Purna / Senior'],
                        ['time' => '17:30 - 18:00', 'activity' => 'Evaluasi Juri & Pengumuman Finalis Hari ke-1'],
                    ]
                ],
                'day_2' => [
                    'date' => 'Minggu, 21 Juni 2026',
                    'categories' => ['U-12 (SD)', 'U-19 (SMA)'],
                    'timeline' => [
                        ['time' => '07:30 - 08:00', 'activity' => 'Registrasi & Daftar Ulang Kontingen Hari ke-2'],
                        ['time' => '08:00 - 12:00', 'activity' => 'Sesi Penampilan Kategori U-12 (SD)'],
                        ['time' => '12:00 - 13:00', 'activity' => 'Istirahat & Ice Breaking'],
                        ['time' => '13:00 - 16:30', 'activity' => 'Sesi Penampilan Kategori U-19 (SMA) - Babak Penyisihan'],
                        ['time' => '16:30 - 18:00', 'activity' => 'Babak Final (Top 2 U-16 SMP & Top 2 U-19 SMA)'],
                        ['time' => '18:00 - 19:30', 'activity' => 'Istirahat & Persiapan Pengumuman Juara'],
                        ['time' => '19:30 - 21:00', 'activity' => 'Closing Ceremony: Pengumuman Juara & Pembagian Hadiah'],
                    ]
                ]
            ];
            foreach ($defaultSchedules as $dayType => $data) {
                \App\Models\EventSchedule::create([
                    'event_id' => $event->id,
                    'day_type' => $dayType,
                    'date_string' => $data['date'],
                    'categories' => $data['categories'],
                    'timeline' => $data['timeline'],
                ]);
            }
            $schedule = $defaultSchedules;
        }

        $visitorToday = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', today())
            ->count();

        $visitorDay1 = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', $event->date_start)
            ->count();

        $visitorDay2 = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', $event->date_end)
            ->count();

        return Inertia::render('Event/Show', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'name' => $event->name,
                'description' => $event->description,
                'date_start' => $event->date_start->format('Y-m-d'),
                'date_end' => $event->date_end->format('Y-m-d'),
                'venue' => $event->venue,
                'leaderboard_status' => $event->leaderboard_status,
                'final_tab_status' => $this->getEventSetting($event, 'final_tab_status'),
                'ticket_sale_status' => $event->ticket_sale_status ?? 'open',
                'voting_day_1_status' => $event->voting_day_1_status ?? 'active',
                'voting_day_2_status' => $event->voting_day_2_status ?? 'active',
                'visitor_today' => $visitorToday,
                'visitor_day_1' => $visitorDay1,
                'visitor_day_2' => $visitorDay2,
            ],
            'categoriesList' => $categoriesList,
            'schedule' => $schedule,
            'registrationClosed' => true, // Registration form is closed for this event
            'totalContingents' => $contingents->count(),
            'auth' => [
                'user' => auth()->user(),
            ],
            'eventContents' => $event->contents->pluck('value', 'key'),
        ]);
    }

    public function showLeaderboard($slug)
    {
        return redirect()->to("/events/{$slug}/leaderboard/rekap");
    }

    private function getLeaderboardData($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        // Preload supporter counts (1 query)
        $supporterCounts = SupporterLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')
            ->pluck('total', 'contingent_id');

        // Preload merch qty (1 query)
        $merchQtys = DB::table('merchandise_sales')
            ->whereIn('contingent_id', function ($q) use ($event) {
                $q->select('id')->from('contingents')->where('event_id', $event->id);
            })
            ->selectRaw('contingent_id, COALESCE(SUM(qty), 0) as total')
            ->groupBy('contingent_id')
            ->pluck('total', 'contingent_id');

        // Preload vote timing (1 query) — earlier MAX(created_at) = earlier to reach final count
        $voteLastTimes = \App\Models\VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        // Preload merch timing (1 query)
        $merchLastTimes = DB::table('merchandise_sales')
            ->whereIn('contingent_id', function ($q) use ($event) {
                $q->select('id')->from('contingents')->where('event_id', $event->id);
            })
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        // Preload supporter timing (1 query)
        $supporterLastTimes = \App\Models\IssuedTicket::whereNotNull('supporter_contingent_id')
            ->whereIn('supporter_contingent_id', function ($q) use ($event) {
                $q->select('id')->from('contingents')->where('event_id', $event->id);
            })
            ->selectRaw('supporter_contingent_id as contingent_id, MAX(created_at) as last_at')
            ->groupBy('supporter_contingent_id')
            ->pluck('last_at', 'contingent_id');

        $contingents = Contingent::where('event_id', $event->id)
            ->withCount('voteLogs')
            ->with(['scores', 'socialMediaLike'])
            ->get()
            ->map(function ($c) use ($supporterCounts, $merchQtys, $voteLastTimes, $merchLastTimes, $supporterLastTimes) {
                $score = $c->scores->first();

                return [
                    'id' => $c->id,
                    'school_name' => $c->school_name,
                    'region' => $c->region,
                    'category_type' => $c->category_type,
                    'logo_path' => $c->logo_path,
                    'votes_count' => $c->vote_logs_count,
                    'vote_last_at' => $voteLastTimes->get($c->id),
                    'merch_last_at' => $merchLastTimes->get($c->id),
                    'supporter_last_at' => $supporterLastTimes->get($c->id),
                    'supporter_days' => (int) ($supporterCounts->get($c->id, 0)),
                    'merch_qty' => (int) ($merchQtys->get($c->id, 0)),
                    'reels_likes' => $c->socialMediaLike?->likes_count_reels ?? 0,
                    'posts_likes' => $c->socialMediaLike?->likes_count_posts ?? 0,
                    'is_reguler' => (bool) $c->is_reguler,
                    'coach_name' => $c->coach_name,
                    'score' => $score ? [
                        'pbb_score' => (int) $score->pbb_score,
                        'danton_score' => (int) $score->danton_score,
                        'vafor_score' => (int) $score->vafor_score,
                        'kostum_score' => (int) $score->kostum_score,
                        'kostum_penalty' => (int) ($score->kostum_penalty ?? 0),
                        'makeup_score' => (int) $score->makeup_score,
                        'makeup_penalty' => (int) ($score->makeup_penalty ?? 0),
                        'penalties_score' => (int) $score->penalties_score,
                        'nilai_kontingen_bonus' => (int) $score->nilai_kontingen_bonus,
                        'grand_total' => (int) $score->grand_total,
                    ] : null,
                ];
            });

        $finalRoundScores = \App\Models\ScoreFinalRound::where('event_id', $event->id)
            ->with('contingent')
            ->get()
            ->map(function ($fs) {
                return [
                    'id' => $fs->id,
                    'event_id' => $fs->event_id,
                    'contingent_id' => $fs->contingent_id,
                    'pbb_score' => (int) $fs->pbb_score,
                    'danton_score' => (int) $fs->danton_score,
                    'vafor_score' => (int) $fs->vafor_score,
                    'score_juri_1' => (int) $fs->score_juri_1,
                    'score_juri_2' => (int) $fs->score_juri_2,
                    'penalties' => (int) $fs->penalties,
                    'voting_bonus' => (int) $fs->voting_bonus,
                    'total_score' => (int) $fs->total_score,
                    'contingent' => $fs->contingent ? [
                        'id' => $fs->contingent->id,
                        'school_name' => $fs->contingent->school_name,
                        'category_type' => $fs->contingent->category_type,
                    ] : null,
                ];
            });

        $visitorToday = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', today())
            ->count();

        $visitorDay1 = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', $event->date_start)
            ->count();

        $visitorDay2 = IssuedTicket::whereHas('order', fn ($q) => $q->where('event_id', $event->id))
            ->whereDate('checked_in_at', $event->date_end)
            ->count();

        $authContingentId = null;
        $authRole = null;
        if (auth()->check()) {
            $authUser = auth()->user();
            $authRole = $authUser->role;
            $coachContingent = \App\Models\Contingent::where('event_id', $event->id)
                ->where(function ($query) use ($authUser) {
                    $query->where('coach_email', $authUser->email)
                          ->orWhere('coach_name', $authUser->name);
                })
                ->first();
            if ($coachContingent) {
                $authContingentId = $coachContingent->id;
            }
        }

        return [
            'event' => $event,
            'contingents' => $contingents,
            'finalRoundScores' => $finalRoundScores,
            'authContingentId' => $authContingentId,
            'authRole' => $authRole,
            'visitorToday' => $visitorToday,
            'visitorDay1' => $visitorDay1,
            'visitorDay2' => $visitorDay2,
        ];
    }

    public function showLeaderboardVote($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];
        $authRole = $data['authRole'];

        return Inertia::render('Event/LeaderboardVote', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
                'voting_status' => $eventData->voting_status,
            ],
            'contingents' => $data['contingents'],
            'authContingentId' => $data['authContingentId'],
            'authRole' => $authRole,
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showLeaderboardSupporter($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardSupporter', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
                'supporter_status' => $eventData->supporter_status,
            ],
            'contingents' => $data['contingents'],
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showLeaderboardVoteFull($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardVoteFull', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'voting_status' => $eventData->voting_status,
            ],
            'contingents' => $data['contingents'],
        ]);
    }

    public function showLeaderboardSupporterFull($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardSupporterFull', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'supporter_status' => $eventData->supporter_status,
            ],
            'contingents' => $data['contingents'],
        ]);
    }

    public function showLeaderboardInstagram($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardInstagram', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
            ],
            'contingents' => $data['contingents'],
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showLeaderboardRekap($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardRekap', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
            ],
            'contingents' => $data['contingents'],
            'authContingentId' => $data['authContingentId'],
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showLeaderboardFinal($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardFinal', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
            ],
            'contingents' => $data['contingents'],
            'finalRoundScores' => $data['finalRoundScores'],
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showLeaderboardJuara($slug)
    {
        $data = $this->getLeaderboardData($slug);
        $eventData = $data['event'];

        return Inertia::render('Event/LeaderboardJuara', [
            'event' => [
                'id' => $eventData->id,
                'slug' => $eventData->slug,
                'name' => $eventData->name,
                'leaderboard_status' => $eventData->leaderboard_status,
            ],
            'contingents' => $data['contingents'],
            'finalRoundScores' => $data['finalRoundScores'],
            'auth' => ['user' => auth()->user()],
        ]);
    }

    public function showJuriDetail($slug, $contingentId)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $contingent = Contingent::where('id', $contingentId)
            ->where('event_id', $event->id)
            ->firstOrFail();

        $score = $contingent->scores()->first();

        $juryScores = JuryScore::where('event_id', $event->id)
            ->where('contingent_id', $contingentId)
            ->get()
            ->groupBy('round')
            ->map(function ($roundScores) {
                return $roundScores->groupBy('jury_type')->map(function ($typeScores) {
                    return $typeScores->map(function ($js) {
                        return [
                            'jury_number' => (int) $js->jury_number,
                            'pbb_score' => (int) $js->pbb_score,
                            'danton_score' => (int) $js->danton_score,
                            'vafor_score' => (int) ((int) $js->variasi_score + (int) $js->formasi_score + (int) $js->danton_vafor_score),
                            'kostum_score' => (int) $js->kostum_score,
                            'makeup_score' => (int) $js->makeup_score,
                            'total_score' => (int) $js->total_score,
                            'pbb_details' => $js->pbb_details,
                            'danton_details' => $js->danton_details,
                            'variasi_details' => $js->variasi_details,
                            'formasi_details' => $js->formasi_details,
                            'danton_vafor_details' => $js->danton_vafor_details,
                            'kostum_details' => $js->kostum_details,
                            'makeup_details' => $js->makeup_details,
                        ];
                    })->keyBy('jury_number');
                });
            });

        $juryMembers = JuryMember::where('event_id', $event->id)
            ->where('round', 'rekap')
            ->where('is_active', true)
            ->orderBy('jury_number')
            ->get()
            ->groupBy('jury_type')
            ->map(function ($items) {
                return $items->map(function ($m) {
                    return ['id' => (int) $m->jury_number, 'name' => $m->name];
                })->keyBy('id');
            });

        $rubrics = ScoringRubric::getAllGrouped($event->id);

        return Inertia::render('Event/JuriDetail', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'name' => $event->name,
            ],
            'contingent' => [
                'id' => $contingent->id,
                'school_name' => $contingent->school_name,
                'region' => $contingent->region,
                'category_type' => $contingent->category_type,
                'score' => $score ? [
                    'pbb_score' => (int) $score->pbb_score,
                    'danton_score' => (int) $score->danton_score,
                    'vafor_score' => (int) $score->vafor_score,
                    'kostum_score' => (int) $score->kostum_score,
                    'kostum_penalty' => (int) ($score->kostum_penalty ?? 0),
                    'makeup_score' => (int) $score->makeup_score,
                    'makeup_penalty' => (int) ($score->makeup_penalty ?? 0),
                    'penalties_score' => (int) $score->penalties_score,
                    'grand_total' => (int) $score->grand_total,
                ] : null,
            ],
            'juryScores' => $juryScores,
            'juryMembers' => $juryMembers,
            'rubrics' => $rubrics,
        ]);
    }

    public function showJuriDetailFinal($slug, $contingentId)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $contingent = Contingent::where('id', $contingentId)
            ->where('event_id', $event->id)
            ->firstOrFail();

        $finalScore = ScoreFinalRound::where('contingent_id', $contingentId)
            ->where('event_id', $event->id)
            ->first();

        $juryScores = JuryScore::where('event_id', $event->id)
            ->where('contingent_id', $contingentId)
            ->where('round', 'final')
            ->get()
            ->groupBy('round')
            ->map(function ($roundScores) {
                return $roundScores->groupBy('jury_type')->map(function ($typeScores) {
                    return $typeScores->map(function ($js) {
                        return [
                            'jury_number' => (int) $js->jury_number,
                            'pbb_score' => (int) $js->pbb_score,
                            'danton_score' => (int) $js->danton_score,
                            'vafor_score' => (int) $js->vafor_score,
                            'total_score' => (int) $js->total_score,
                            'pbb_details' => $js->pbb_details,
                            'danton_details' => $js->danton_details,
                            'variasi_details' => $js->variasi_details,
                            'formasi_details' => $js->formasi_details,
                            'danton_vafor_details' => $js->danton_vafor_details,
                        ];
                    })->keyBy('jury_number');
                });
            });

        $juryMembers = JuryMember::where('event_id', $event->id)
            ->where('round', 'final')
            ->where('is_active', true)
            ->orderBy('jury_number')
            ->get()
            ->groupBy('jury_type')
            ->map(function ($items) {
                return $items->map(function ($m) {
                    return ['id' => (int) $m->jury_number, 'name' => $m->name];
                })->keyBy('id');
            });

        return Inertia::render('Event/JuriDetailFinal', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'name' => $event->name,
            ],
            'contingent' => [
                'id' => $contingent->id,
                'school_name' => $contingent->school_name,
                'region' => $contingent->region,
                'category_type' => $contingent->category_type,
            ],
            'finalScore' => $finalScore ? [
                'pbb_score' => (int) $finalScore->pbb_score,
                'danton_score' => (int) $finalScore->danton_score,
                'vafor_score' => (int) $finalScore->vafor_score,
                'voting_bonus' => (int) $finalScore->voting_bonus,
                'penalties' => (int) $finalScore->penalties,
                'total_score' => (int) $finalScore->total_score,
            ] : null,
            'juryScores' => $juryScores,
            'juryMembers' => $juryMembers,
        ]);
    }

    private function getEventSetting($event, string $key, string $default = 'show'): string
    {
        $path = "settings/{$event->id}.json";
        if (!Storage::exists($path)) {
            return $default;
        }
        $settings = json_decode(Storage::get($path), true);
        return $settings[$key] ?? $default;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Contingent;
use App\Models\Event;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoreAccessToken;
use App\Models\ScorePbbDetail;
use App\Models\ScoringRubric;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ScoreTokenController extends Controller
{
    // ==================== PUBLIC PORTAL ====================

    public function showPortal($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        return Inertia::render('Event/RecapPortal', [
            'event' => ['slug' => $event->slug, 'name' => $event->name],
            'verified' => false,
            'contingent' => null,
            'score' => null,
            'juryScores' => [],
            'pbbItems' => [],
            'dantonItems' => [],
            'variasiItems' => [],
            'formasiItems' => [],
            'dantonVaforItems' => [],
            'kostumItems' => [],
            'makeupItems' => [],
        ]);
    }

    public function redirectVerify($slug)
    {
        $event = \App\Models\Event::where('slug', $slug)->first();
        if (!$event) abort(404);
        return redirect()->to("/events/{$event->slug}/rekap");
    }

    public function verifyToken(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $request->validate(['token' => 'required|string|max:20']);

        $token = ScoreAccessToken::where('token', $request->token)
            ->where('event_id', $event->id)
            ->where('is_active', true)
            ->with('contingent')
            ->first();

        if (!$token) {
            return back()->withErrors(['token' => 'Token tidak valid atau sudah tidak aktif.']);
        }

        $contingent = $token->contingent;
        if (!$contingent) {
            return back()->withErrors(['token' => 'Kontingen tidak ditemukan.']);
        }

        $score = Score::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->first();

        $juryScores = JuryScore::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->where('round', 'rekap')
            ->orderBy('jury_type')
            ->orderBy('jury_number')
            ->get();

        $juryScoresGrouped = $juryScores
            ->groupBy('jury_type')
            ->map(function ($typeScores) {
                return $typeScores->keyBy('jury_number')->map(function ($js) {
                    return [
                        'jury_number' => (int) $js->jury_number,
                        'pbb_details' => $js->pbb_details,
                        'danton_details' => $js->danton_details,
                        'variasi_details' => $js->variasi_details,
                        'formasi_details' => $js->formasi_details,
                        'danton_vafor_details' => $js->danton_vafor_details,
                        'kostum_details' => $js->kostum_details,
                        'makeup_details' => $js->makeup_details,
                        'total_score' => (float) $js->total_score,
                    ];
                });
            });

        return Inertia::render('Event/RecapPortal', [
            'event' => ['slug' => $event->slug, 'name' => $event->name],
            'verifiedToken' => $request->token,
            'verified' => true,
            'contingent' => [
                'id' => $contingent->id,
                'school_name' => $contingent->school_name,
                'category_type' => $contingent->category_type,
                'region' => $contingent->region,
                'is_reguler' => (bool) $contingent->is_reguler,
                'coach_name' => $contingent->coach_name,
            ],
            'score' => $score ? [
                'pbb_score' => (float) $score->pbb_score,
                'danton_score' => (float) $score->danton_score,
                'variasi_score' => (float) ($score->variasi_score ?? 0),
                'formasi_score' => (float) ($score->formasi_score ?? 0),
                'danton_vafor_score' => (float) ($score->danton_vafor_score ?? 0),
                'vafor_score' => (float) ($score->vafor_score ?? 0),
                'kostum_score' => (float) $score->kostum_score,
                'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                'makeup_score' => (float) $score->makeup_score,
                'penalties_score' => (float) $score->penalties_score,
                'grand_total' => (float) $score->grand_total,
            ] : null,
            'juryScores' => $juryScoresGrouped->toArray(),
            'pbbItems' => $contingent->category_type === 'U12' ? $this->getChildRubrics($event->id, 'rekap', 'pbb_u12') : $this->getChildRubrics($event->id, 'rekap', 'pbb'),
            'dantonItems' => $this->getChildRubrics($event->id, 'rekap', 'danton'),
            'variasiItems' => $this->getChildRubrics($event->id, 'rekap', 'variasi'),
            'formasiItems' => $this->getChildRubrics($event->id, 'rekap', 'formasi'),
            'dantonVaforItems' => $this->getChildRubrics($event->id, 'rekap', 'danton_vafor'),
            'kostumItems' => $this->getChildRubrics($event->id, 'rekap', 'kostum'),
            'makeupItems' => $this->getChildRubrics($event->id, 'rekap', 'makeup'),
        ]);
    }

    // ==================== ADMIN ====================

    public function showAdmin($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin', 'operator_nilai'])) {
            abort(403);
        }

        $contingents = Contingent::where('event_id', $event->id)
            ->orderBy('category_type')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($c) use ($event) {
                $token = ScoreAccessToken::where('event_id', $event->id)
                    ->where('contingent_id', $c->id)
                    ->first();
                return [
                    'id' => $c->id,
                    'school_name' => $c->school_name,
                    'category_type' => $c->category_type,
                    'region' => $c->region,
                    'token' => $token ? [
                        'id' => $token->id,
                        'token' => $token->token,
                        'is_active' => (bool) $token->is_active,
                        'created_at' => $token->created_at->format('d M Y H:i'),
                    ] : null,
                ];
            });

        $totalWithTokens = ScoreAccessToken::where('event_id', $event->id)->count();
        $totalActiveTokens = ScoreAccessToken::where('event_id', $event->id)->where('is_active', true)->count();

        return Inertia::render('Admin/ScoreTokens', [
            'event' => $event,
            'contingents' => $contingents,
            'totalWithTokens' => $totalWithTokens,
            'totalActiveTokens' => $totalActiveTokens,
        ]);
    }

    public function generate(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin', 'operator_nilai'])) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'contingent_id' => 'required|exists:contingents,id',
        ]);

        $contingent = Contingent::where('id', $request->contingent_id)
            ->where('event_id', $event->id)
            ->firstOrFail();

        $existing = ScoreAccessToken::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->first();

        if ($existing) {
            if ($existing->is_active) {
                return response()->json(['error' => 'Kontingen ini sudah memiliki token aktif.'], 422);
            }
            $existing->update(['is_active' => true, 'token' => $this->generateUniqueToken($event->id)]);
            $token = $existing;
        } else {
            $token = ScoreAccessToken::create([
                'event_id' => $event->id,
                'contingent_id' => $contingent->id,
                'token' => $this->generateUniqueToken($event->id),
                'created_by' => $user->id,
            ]);
        }

        return back()->with('success', 'Token berhasil dibuat: ' . $token->token);
    }

    public function generateAll($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin', 'operator_nilai'])) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $contingents = Contingent::where('event_id', $event->id)->get();

        foreach ($contingents as $c) {
            $existing = ScoreAccessToken::where('event_id', $event->id)
                ->where('contingent_id', $c->id)
                ->first();

            if ($existing && $existing->is_active) {
                continue;
            }

            if ($existing) {
                $existing->update(['is_active' => true, 'token' => $this->generateUniqueToken($event->id)]);
            } else {
                ScoreAccessToken::create([
                    'event_id' => $event->id,
                    'contingent_id' => $c->id,
                    'token' => $this->generateUniqueToken($event->id),
                    'created_by' => $user->id,
                ]);
            }
        }

        $count = ScoreAccessToken::where('event_id', $event->id)->where('is_active', true)->count();
        return back()->with('success', "Token aktif untuk {$count} kontingen.");
    }

    public function revoke($slug, $id)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $token = ScoreAccessToken::where('id', $id)
            ->where('event_id', $event->id)
            ->firstOrFail();

        $token->update(['is_active' => false]);

        return back()->with('success', 'Token telah dinonaktifkan.');
    }

    // ==================== EXPORT ====================

    public function exportPdf(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $request->validate(['token' => 'required|string|max:20']);

        $token = ScoreAccessToken::where('token', $request->token)
            ->where('event_id', $event->id)
            ->where('is_active', true)
            ->with('contingent')
            ->firstOrFail();

        $contingent = $token->contingent;

        $score = Score::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->first();

        $juryScoresList = JuryScore::where('event_id', $event->id)
            ->where('contingent_id', $contingent->id)
            ->where('round', 'rekap')
            ->orderBy('jury_type')
            ->orderBy('jury_number')
            ->get();

        $juryScores = $juryScoresList
            ->groupBy('jury_type')
            ->map(function ($typeScores) {
                return $typeScores->keyBy('jury_number')->map(function ($js) {
                    return [
                        'jury_number' => (int) $js->jury_number,
                        'pbb_details' => $js->pbb_details,
                        'danton_details' => $js->danton_details,
                        'variasi_details' => $js->variasi_details,
                        'formasi_details' => $js->formasi_details,
                        'danton_vafor_details' => $js->danton_vafor_details,
                        'kostum_details' => $js->kostum_details,
                        'makeup_details' => $js->makeup_details,
                    ];
                });
            })->toArray();

        $pbbItems = $contingent->category_type === 'U12' ? $this->getChildRubrics($event->id, 'rekap', 'pbb_u12') : $this->getChildRubrics($event->id, 'rekap', 'pbb');
        $dantonItems = $this->getChildRubrics($event->id, 'rekap', 'danton');
        $variasiItems = $this->getChildRubrics($event->id, 'rekap', 'variasi');
        $formasiItems = $this->getChildRubrics($event->id, 'rekap', 'formasi');
        $dantonVaforItems = $this->getChildRubrics($event->id, 'rekap', 'danton_vafor');
        $kostumItems = $this->getChildRubrics($event->id, 'rekap', 'kostum');
        $makeupItems = $this->getChildRubrics($event->id, 'rekap', 'makeup');

        $pdf = Pdf::loadView('pdf.rekap-nilai', [
            'event' => ['slug' => $event->slug, 'name' => $event->name],
            'contingent' => [
                'school_name' => $contingent->school_name,
                'category_type' => $contingent->category_type,
                'region' => $contingent->region,
                'is_reguler' => (bool) $contingent->is_reguler,
                'coach_name' => $contingent->coach_name,
            ],
            'score' => $score ? [
                'pbb_score' => (float) $score->pbb_score,
                'danton_score' => (float) $score->danton_score,
                'vafor_score' => (float) ($score->vafor_score ?? 0),
                'kostum_score' => (float) $score->kostum_score,
                'kostum_penalty' => (float) ($score->kostum_penalty ?? 0),
                'makeup_score' => (float) $score->makeup_score,
                'penalties_score' => (float) $score->penalties_score,
                'grand_total' => (float) $score->grand_total,
            ] : null,
            'juryScores' => $juryScores,
            'pbbItems' => $pbbItems,
            'dantonItems' => $dantonItems,
            'variasiItems' => $variasiItems,
            'formasiItems' => $formasiItems,
            'dantonVaforItems' => $dantonVaforItems,
            'kostumItems' => $kostumItems,
            'makeupItems' => $makeupItems,
        ]);

        return $pdf->download("rekap_nilai_{$event->slug}_{$contingent->id}.pdf");
    }

    // ==================== HELPERS ====================

    private function generateUniqueToken($eventId)
    {
        do {
            $token = strtoupper(Str::random(8));
        } while (ScoreAccessToken::where('event_id', $eventId)->where('token', $token)->exists());

        return $token;
    }

    public function getChildRubrics($eventId, $round, $code)
    {
        $parent = ScoringRubric::where('event_id', $eventId)
            ->where('round', $round)
            ->whereNull('parent_id')
            ->where('code', $code)
            ->first();

        if (!$parent) {
            $items = $this->getDefaultItems($code);
        } else {
            $items = ScoringRubric::where('parent_id', $parent->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->pluck('name')
                ->toArray();
        }

        $prefixMap = [
            'pbb' => 'pbb', 'pbb_u12' => 'pbb_u12', 'danton' => 'dn',
            'danton_vafor' => 'dv', 'variasi' => 'vr', 'formasi' => 'fm',
            'kostum' => 'ks', 'makeup' => 'mk',
        ];
        $prefix = $prefixMap[$code] ?? $code;
        $result = [];
        foreach ($items as $idx => $name) {
            $result[$prefix . '_' . str_pad($idx + 1, 2, '0', STR_PAD_LEFT)] = $name;
        }
        return $result;
    }

    private function getDefaultItems($code)
    {
        $defaults = [
            'pbb' => [
                'Sikap Sempurna', 'Sikap Istirahat', 'Periksa Kerapihan', 'Hormat',
                'Lencang Kanan', 'Setengah Lencang Kanan', 'Lencang Kiri', 'Hadap Kanan',
                'Hadap Kiri', 'Hadap Serong Kanan', 'Hadap Serong Kiri', 'Balik Kanan',
                'Jalan di Tempat', 'Langkah Biasa', 'Langkah Tegap', 'Langkah Perlahan',
                'Langkah Ke Samping Kanan', 'Langkah Ke Samping Kiri', 'Langkah Ke Depan',
                'Langkah Ke Belakang', 'Balik Kanan Maju', 'Belok Kanan', 'Belok Kiri',
                'Tiap-tiap Banjar Dua Kali Belok Kanan', 'Haluan Kanan', 'Haluan Kiri',
                'Melintang Kanan', 'Melintang Kiri', 'Hormat Kanan', 'Sikap Komando',
                'Variasi & Formasi Unsur PBB'
            ],
            'pbb_u12' => [
                'Sikap Sempurna', 'Sikap Istirahat di Tempat', 'Periksa Kerapihan',
                'Hormat', 'Lencang Kanan', 'Lencang Kiri', 'Hadap Kanan', 'Hadap Kiri',
                'Hadap Serong Kanan', 'Hadap Serong Kiri', 'Balik Kanan', 'Jalan di Tempat',
                'Langkah Biasa', 'Langkah Tegap', 'Langkah Perlahan',
                'Langkah Ke Samping Kanan', 'Langkah Ke Samping Kiri',
                'Belok Kanan', 'Belok Kiri', 'Haluan Kanan', 'Haluan Kiri',
                'Melintang Kanan', 'Melintang Kiri', 'Hormat Kanan',
                'Sikap Komando', 'Variasi & Formasi Unsur PBB'
            ],
            'danton' => [
                'Sikap', 'Volume', 'Artikulasi', 'Intonasi, Ritme, Tempo',
                'Penguasaan Materi', 'Penguasaan Lapangan', 'Penguasaan Pasukan'
            ],
            'variasi' => [
                'Opening & Ending Variasi', 'Pembawaan Tema & Konsep',
                'Kesesuaian Gerakan Dengan Tema & Konsep', 'Kesopanan & Keamanan Gerakan',
                'Tingkat Kesulitan & Detail Gerakan', 'Kerapihan & Kekompakan', 'Unsur PBB',
                'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
                'Penguasaan Ruang & Materi'
            ],
            'formasi' => [
                'Kombinasi & Pemilihan Gerakan', 'Pembawaan Tema & Konsep',
                'Ending Celebration (Setelah Tutup Formasi)', 'Kesesuaian Gerakan Dengan Tema & Konsep',
                'Kesopanan & Keamanan Gerakan', 'Tingkat Kesulitan & Detail Gerakan', 'Unsur PBB',
                'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
                'Penguasaan Ruang & Materi'
            ],
            'danton_vafor' => [
                'Cara Pembawaan Pesan/Narasi',
                'Kombinasi/Kolaborasi Dengan Pasukan',
                'Penguasaan Materi Variasi & Formasi'
            ],
            'kostum' => [
                'Kesesuaian Gender/Konsep', 'Keselarasan Penutup Kepala Dengan Kostum',
                'Body Fitting/Ukuran Baju dan Kenyamanan', 'Cuttingan', 'Desain Kostum',
                'Kesesuaian Kostum Dengan Konsep Vafor', 'Keindahan/Perpaduan Warna',
                'Kharisma Pembawaan Kostum', 'Kesopanan', 'Kerapihan', 'Kebersihan',
                'Kesesuaian Sepatu Dengan Desain Kostum', 'Kreativitas & Atribut',
                'Kesesuaian Atribut Dengan Desain Kostum', 'Kreativitas Bentuk Kostum/Atribut / Kesesuaian Penempatan Atribut'
            ],
            'makeup' => [
                'Kesesuaian Make Up Dengan Desain Kostum', 'Kesesuaian Make Up Dengan Konsep Vafor',
                'Kesesuaian Make Up Dengan Gender', 'Kharisma Pembawaan Make Up', 'Kreativitas',
                'Ketahanan', 'Kenyamanan', 'Kerapihan', 'Kebersihan'
            ],
        ];

        return $defaults[$code] ?? [];
    }
}

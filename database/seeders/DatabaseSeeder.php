<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Contingent;
use App\Models\TicketPackage;
use App\Models\User;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\VoteLog;
use App\Models\JuryScore;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\MerchandiseSale;
use App\Models\MerchandiseProduct;
use App\Models\MerchandisePurchase;
use App\Models\SocialMediaLike;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key checks for clean seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('vote_logs')->truncate();
        DB::table('issued_tickets')->truncate();
        DB::table('orders')->truncate();
        DB::table('ticket_packages')->truncate();
        DB::table('jury_scores')->truncate();
        DB::table('scores')->truncate();
        DB::table('scores_final_round')->truncate();
        DB::table('merchandise_sales')->truncate();
        DB::table('merchandise_products')->truncate();
        DB::table('merchandise_purchases')->truncate();
        DB::table('social_media_likes')->truncate();
        DB::table('contingents')->truncate();
        DB::table('events')->truncate();
        DB::table('users')->truncate();
        DB::table('news')->truncate();
        DB::table('hall_of_fames')->truncate();
        DB::table('event_schedules')->truncate();
        DB::table('testimonials')->truncate();
        DB::table('event_contents')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create Active Event
        $event = Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'LOMBA BARIS GARDA 55 VOL 20 "Chequered Champions"',
            'description' => 'Kejuaraan baris-berbaris akbar multi-event tingkat SMP, SMA, SD, dan Purna se-Kalimantan Timur.',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Lapangan SMA Negeri 5 Samarinda',
            'status' => 'active',
            'max_tickets_per_user' => 15,
            'leaderboard_status' => 'draft',
            'qris_image' => 'qris/S752aqs5YO9oN9HmNxvRLD6S5vgSdzStrMFo9CZQ.jpg',
            'wa_contacts' => [
                ['name' => 'Zahra', 'phone' => '081234567890'],
                ['name' => 'Tegar', 'phone' => '089876543210']
            ],
            'merchandise_wa_contacts' => [
                ['name' => 'Zahra', 'number' => '081234567890'],
                ['name' => 'Tegar', 'number' => '089876543210']
            ],
            'gate_schedules' => [
                ['day' => 'day_1', 'start_time' => '07:30', 'end_time' => '18:00'],
                ['day' => 'day_2', 'start_time' => '07:30', 'end_time' => '21:00']
            ]
        ]);

        // 2. Create Ticket Packages
        // Silver: online purchase (1 vote, 1 sharing, 1 supporter day, 1 doorprize)
        $silver = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Silver',
            'type' => 'online',
            'price' => 25000.00,
            'validity_days' => 1,
            'vote_allowance' => 1,
            'sharing_allowance' => 1,
            'coupon_allowance' => 1,
            'stock' => 5000,
            'is_active' => true,
        ]);

        // Gold: OTS only (2 votes, 1 doorprize, no supporter)
        $gold = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Gold',
            'type' => 'ots',
            'price' => 40000.00,
            'validity_days' => 1,
            'vote_allowance' => 2,
            'coupon_allowance' => 1,
            'stock' => 3000,
            'is_active' => true,
        ]);

        // Platinum: OTS only (3 votes, 2 doorprize, no supporter)
        $platinum = TicketPackage::create([
            'event_id' => $event->id,
            'name' => 'Platinum',
            'type' => 'ots',
            'price' => 50000.00,
            'validity_days' => 2,
            'vote_allowance' => 3,
            'coupon_allowance' => 2,
            'stock' => 1500,
            'is_active' => true,
        ]);

        // 2b. Create Merchandise Products
        $merchProducts = [
            ['name' => '1 Pcs', 'price' => 2000, 'points' => 1],
            ['name' => '1 Dus', 'price' => 25000, 'points' => 50],
        ];
        foreach ($merchProducts as $mp) {
            MerchandiseProduct::create([
                'event_id' => $event->id,
                'name' => $mp['name'],
                'price' => $mp['price'],
                'points' => $mp['points'],
                'is_active' => true,
            ]);
        }

        // 3. Create Users
        $password = bcrypt('password');

        User::create([
            'name' => 'Panitia PASGARDA',
            'email' => 'admin@pasgarda.com',
            'role' => 'super_admin',
            'password' => $password,
        ]);

        User::create([
            'name' => 'Admin User',
            'email' => 'admin2@pasgarda.com',
            'role' => 'admin',
            'password' => $password,
        ]);

        User::create([
            'name' => 'Master Gate',
            'email' => 'gate@pasgarda.com',
            'role' => 'operator_gate',
            'password' => $password,
        ]);

        for ($i = 1; $i <= 6; $i++) {
            User::create([
                'name' => 'Operator Gate ' . $i,
                'email' => 'gate' . $i . '@pasgarda.com',
                'role' => 'operator_gate',
                'password' => $password,
            ]);
        }

        User::create([
            'name' => 'Operator Nilai',
            'email' => 'nilai@pasgarda.com',
            'role' => 'operator_nilai',
            'password' => $password,
        ]);

        User::create([
            'name' => 'Operator Nilai 1',
            'email' => 'nilai1@pasgarda.com',
            'role' => 'operator_nilai',
            'jury_number' => 1,
            'password' => $password,
        ]);

        User::create([
            'name' => 'Operator Nilai 2',
            'email' => 'nilai2@pasgarda.com',
            'role' => 'operator_nilai',
            'jury_number' => 2,
            'password' => $password,
        ]);

        User::create([
            'name' => 'Operator Nilai 3',
            'email' => 'nilai3@pasgarda.com',
            'role' => 'operator_nilai',
            'jury_number' => 3,
            'password' => $password,
        ]);

        User::create([
            'name' => 'Master Monitor',
            'email' => 'nilai4@pasgarda.com',
            'role' => 'operator_nilai',
            'jury_number' => null,
            'password' => $password,
        ]);

        User::create([
            'name' => 'Operator Produk',
            'email' => 'produk@pasgarda.com',
            'role' => 'operator_produk',
            'password' => $password,
        ]);

        $spectator = User::create([
            'name' => 'Spectator User',
            'email' => 'spectator@pasgarda.com',
            'role' => 'spectator',
            'password' => $password,
        ]);

        for ($i = 1; $i <= 6; $i++) {
            User::create([
                'name' => 'Spectator User ' . $i,
                'email' => 'spectator' . $i . '@pasgarda.com',
                'role' => 'spectator',
                'password' => $password,
            ]);
        }

        // 4. Contingents Data
        $contingentsList = [
            // U12 (SD)
            ['name' => 'SDN 009 BALIKPAPAN UTARA', 'category' => 'U12', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SDN 013 BALIKPAPAN SELATAN', 'category' => 'U12', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SDN 027 SUNGAI KUNJANG', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SDN 004 SUNGAI PINANG', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SDN 005 BALIKPAPAN KOTA', 'category' => 'U12', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SDN 010 LOA JANAN ILIR', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SDN 008 AWANGLONG (A)', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SDN 010 SAMARINDA KOTA', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'HOPS MANAGEMENT', 'category' => 'U12', 'region' => 'Samarinda', 'is_reguler' => true],

            // U16 (SMP)
            ['name' => 'SMPN 6 BALIKPAPAN', 'category' => 'U16', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMPN 5 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMPN 31 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMPN 22 BALIKPAPAN', 'category' => 'U16', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMPN 1 TENGGARONG', 'category' => 'U16', 'region' => 'Tenggarong', 'is_reguler' => false],
            ['name' => 'SMPN 2 TENGGARONG (A)', 'category' => 'U16', 'region' => 'Tenggarong', 'is_reguler' => false],
            ['name' => 'SMPN 3 BALIKPAPAN', 'category' => 'U16', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMPN 2 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'PASHIMENT SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMPN 5 BALIKPAPAN', 'category' => 'U16', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMPN 34 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMPN 7 SAMARINDA (A)', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMPN 14 BALIKPAPAN', 'category' => 'U16', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'MTS NEGERI SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => true],
            ['name' => 'SMPN 37 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => true],
            ['name' => 'SMPN 2 TENGGARONG (B)', 'category' => 'U16', 'region' => 'Tenggarong', 'is_reguler' => true],
            ['name' => 'SMPN 15 SAMARINDA', 'category' => 'U16', 'region' => 'Samarinda', 'is_reguler' => true],

            // U19 (SMA)
            ['name' => 'SMAN 2 BALIKPAPAN', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMKN 4 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMK TI LABBAIKA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMKN 8 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMAN 3 SAMARINDA (A)', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMK NUSANTARA BALIKPAPAN', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMAN 2 SAMARINDA (A)', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'PASHIMENT SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMKN 2 BALIKPAPAN', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMAN 8 BALIKPAPAN (A)', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMAN 7 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMAN 16 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMAN 8 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SMA KARTIKA BALIKPAPAN', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMAN 3 BALIKPAPAN', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => false],
            ['name' => 'SMAN 8 BALIKPAPAN (B)', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => true],
            ['name' => 'SMPN 22 BPP (UNO TEAM\'S)', 'category' => 'U19', 'region' => 'Balikpapan', 'is_reguler' => true],
            ['name' => 'SMK UTAMA AL-JABAR NUR', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => true],
            ['name' => 'SMAN 11 SAMARINDA', 'category' => 'U19', 'region' => 'Samarinda', 'is_reguler' => true],

            // Purna / Club
            ['name' => 'ALPHA ACADEMY', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'HOPS MANAGEMENT', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'PASTRIGANA', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'WIJAYA MANAGEMENT (A)', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'PASHIMENT SAMARINDA (A)', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'OUTSIDER SUPER SQUAD', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SAWAN MANAGEMENT', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'SAMURAJA CLUB', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => false],
            ['name' => 'PASISTAR', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => true],
            ['name' => 'SMADA DRILL TEAM', 'category' => 'Purna', 'region' => 'Samarinda', 'is_reguler' => true],
            ['name' => 'PURNA SMP 2 TENGGARONG', 'category' => 'Purna', 'region' => 'Tenggarong', 'is_reguler' => true],
        ];

        // 31 Movements of PBB default list
        $pbbMovements = [
            'Sikap Sempurna', 'Sikap Istirahat', 'Periksa Kerapihan', 'Hormat', 'Lencang Kanan',
            'Setengah Lencang Kanan', 'Lencang Kiri', 'Hadap Kanan', 'Hadap Kiri', 'Hadap Serong Kanan',
            'Hadap Serong Kiri', 'Balik Kanan', 'Jalan di Tempat', 'Langkah Biasa', 'Langkah Tegap',
            'Langkah Perlahan', 'Langkah Ke Samping Kanan', 'Langkah Ke Samping Kiri', 'Langkah Ke Depan',
            'Langkah Ke Belakang', 'Balik Kanan Maju', 'Belok Kanan', 'Belok Kiri', 'Tiap-tiap Banjar Dua Kali Belok Kanan',
            'Haluan Kanan', 'Haluan Kiri', 'Melintang Kanan', 'Melintang Kiri', 'Hormat Kanan',
            'Sikap Komando', 'Variasi & Formasi Unsur PBB'
        ];

        $dantonItems = [
            'Sikap', 'Volume', 'Artikulasi', 'Intonasi, Ritme, Tempo',
            'Penguasaan Materi', 'Penguasaan Lapangan', 'Penguasaan Pasukan'
        ];

        $variasiItems = [
            'Opening & Ending Variasi', 'Pembawaan Tema & Konsep',
            'Kesesuaian Gerakan Dengan Tema & Konsep', 'Kesopanan & Keamanan Gerakan',
            'Tingkat Kesulitan & Detail Gerakan', 'Kerapihan & Kekompakan', 'Unsur PBB',
            'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
            'Penguasaan Ruang & Materi'
        ];

        $formasiItems = [
            'Kombinasi & Pemilihan Gerakan', 'Pembawaan Tema & Konsep',
            'Ending Celebration (Setelah Tutup Formasi)', 'Kesesuaian Gerakan Dengan Tema & Konsep',
            'Kesopanan & Keamanan Gerakan', 'Tingkat Kesulitan & Detail Gerakan', 'Unsur PBB',
            'Penjiwaan, Ekspresi, Pengucapan Kalimat', 'Semangat & Kestabilan Penampilan',
            'Penguasaan Ruang & Materi'
        ];

        $dantonVaforItems = [
            'Cara Pembawaan Pesan/Narasi',
            'Kombinasi/Kolaborasi Dengan Pasukan',
            'Penguasaan Materi Variasi & Formasi'
        ];

        $kostumItems = [
            'Kesesuaian Gender/Konsep', 'Keselarasan Penutup Kepala Dengan Kostum',
            'Body Fitting/Ukuran Baju dan Kenyamanan', 'Cuttingan', 'Desain Kostum',
            'Kesesuaian Kostum Dengan Konsep Vafor', 'Keindahan/Perpaduan Warna',
            'Kharisma Pembawaan Kostum', 'Kesopanan', 'Kerapihan', 'Kebersihan',
            'Kesesuaian Sepatu Dengan Desain Kostum', 'Kreativitas & Atribut',
            'Kesesuaian Atribut Dengan Desain Kostum', 'Kreativitas Bentuk Kostum/Atribut / Kesesuaian Penempatan Atribut'
        ];

        $makeupItems = [
            'Kesesuaian Make Up Dengan Desain Kostum', 'Kesesuaian Make Up Dengan Konsep Vafor',
            'Kesesuaian Make Up Dengan Gender', 'Kharisma Pembawaan Make Up', 'Kreativitas',
            'Ketahanan', 'Kenyamanan', 'Kerapihan', 'Kebersihan'
        ];

        $packages = [$silver, $gold, $platinum];

        foreach ($contingentsList as $idx => $cData) {
            $contingent = Contingent::create([
                'event_id' => $event->id,
                'school_name' => $cData['name'],
                'region' => $cData['region'],
                'category_type' => $cData['category'],
                'logo_path' => null,
                'is_reguler' => $cData['is_reguler'],
                'status' => 'verified',
                'coach_name' => 'Coach ' . $cData['name'],
                'coach_phone' => '0812' . str_pad($idx, 8, '0', STR_PAD_LEFT),
            ]);

            // Create a user for the coach so they can login
            User::create([
                'name' => 'Coach ' . $cData['name'],
                'email' => 'coach' . $idx . '@pasgarda.com',
                'role' => 'coach',
                'password' => bcrypt('password'),
            ]);

            // 5. Seed Votes & Supporter Days (multiples of 10 and differing by 10)
            $votesCount = 10 * ($idx + 1);
            for ($i = 0; $i < $votesCount; $i++) {
                $pkg = $packages[array_rand($packages)];
                
                $order = Order::create([
                    'user_id' => $spectator->id,
                    'event_id' => $event->id,
                    'midtrans_transaction_id' => 'MID-TX-' . $contingent->id . '-' . $i . '-' . uniqid(),
                    'total_price' => $pkg->price,
                    'payment_status' => 'paid',
                    'payment_method' => 'qris',
                ]);

                $ticket = IssuedTicket::create([
                    'order_id' => $order->id,
                    'ticket_package_id' => $pkg->id,
                    'unique_qr_hash' => 'QR-' . $contingent->id . '-' . $i . '-' . uniqid(),
                    'buyer_name' => 'Spectator ' . $i,
                    'buyer_email' => 'spectator' . $i . '@example.com',
                    'check_in_status' => true,
                    'checked_in_at' => now(),
                    'vote_tokens_remaining' => 0,
                    'days_remaining' => 0,
                    'coupon_tokens_remaining' => 0,
                ]);

                VoteLog::create([
                    'event_id' => $event->id,
                    'issued_ticket_id' => $ticket->id,
                    'contingent_id' => $contingent->id,
                    'created_at' => now()->subHours(rand(1, 48)),
                ]);

                \App\Models\SupporterLog::create([
                    'event_id' => $event->id,
                    'issued_ticket_id' => $ticket->id,
                    'contingent_id' => $contingent->id,
                    'created_at' => now()->subHours(rand(1, 48)),
                ]);
            }

            // 6. Seed Merchandise Sales
            $merchCount = rand(5, 40);
            for ($i = 0; $i < $merchCount; $i++) {
                $qty = rand(1, 4);
                MerchandiseSale::create([
                    'event_id' => $event->id,
                    'contingent_id' => $contingent->id,
                    'buyer_name' => 'Buyer ' . $i,
                    'qty' => $qty,
                    'total_price' => $qty * 60000.00,
                ]);
            }

            // 7. Seed Social Media Likes
            SocialMediaLike::create([
                'contingent_id' => $contingent->id,
                'likes_count_reels' => rand(100, 1500),
                'likes_count_posts' => rand(100, 1500),
            ]);

        }

        // 8. Seed News & Announcements
        \App\Models\News::create([
            'title' => 'Pendaftaran LOMBA BARIS GARDA 55 VOL 20 Resmi Ditutup!',
            'category' => 'Announcement',
            'summary' => 'Panitia mengumumkan pendaftaran kontingen resmi ditutup dengan 40 sekolah terverifikasi.',
            'date' => '01 Jun 2026',
        ]);
        \App\Models\News::create([
            'title' => 'Mengintip Desain Piala Bergilir Tahun Ini: Chequered Champions',
            'category' => 'Competition',
            'summary' => 'Piala bergilir tahun ini didesain khusus bernuansa emas dan motif catur yang mewah.',
            'date' => '28 Mei 2026',
        ]);
        \App\Models\News::create([
            'title' => 'Prestasi Paskibra SMAN 5 Samarinda di Kancah Provinsi',
            'category' => 'Achievement',
            'summary' => 'Paskibra SMA Negeri 5 Samarinda meraih Juara Harapan 1 dalam ajang HUT Provinsi Kaltim.',
            'date' => '15 Mei 2026',
        ]);

        // 9. Seed Hall of Fame Historis
        \App\Models\HallOfFame::create([
            'year' => 2025,
            'event_name' => 'LPBB PASGARDA VOL.19',
            'champion' => 'SMA Negeri 1 Samarinda',
            'runner_up' => 'SMK Negeri 1 Samarinda',
            'best_commander' => 'Danton SMA Negeri 1 Samarinda',
            'favorite' => 'SMA Negeri 3 Samarinda',
        ]);
        \App\Models\HallOfFame::create([
            'year' => 2024,
            'event_name' => 'LPBB PASGARDA VOL.18',
            'champion' => 'SMA Negeri 2 Samarinda',
            'runner_up' => 'SMA Negeri 1 Samarinda',
            'best_commander' => 'Danton SMA Negeri 2 Samarinda',
            'favorite' => 'SMK Negeri 2 Samarinda',
        ]);
        \App\Models\HallOfFame::create([
            'year' => 2023,
            'event_name' => 'LPBB PASGARDA VOL.17',
            'champion' => 'SMA Negeri 3 Samarinda',
            'runner_up' => 'SMA Negeri 2 Samarinda',
            'best_commander' => 'Danton SMA Negeri 3 Samarinda',
            'favorite' => 'SMA Negeri 1 Samarinda',
        ]);

        // 10. Seed Event Schedules
        \App\Models\EventSchedule::create([
            'event_id' => $event->id,
            'day_type' => 'day_1',
            'date_string' => 'Sabtu, 20 Juni 2026',
            'categories' => ['U-16 (SMP)', 'Purna / Senior'],
            'timeline' => [
                ['time' => '07:30 - 08:00', 'activity' => 'Registrasi & Daftar Ulang Kontingen Hari ke-1'],
                ['time' => '08:00 - 08:30', 'activity' => 'Upacara Pembukaan LOMBA BARIS GARDA 55 VOL 20'],
                ['time' => '08:30 - 12:00', 'activity' => 'Sesi Penampilan Kategori U-16 (SMP) - Babak Penyisihan'],
                ['time' => '12:00 - 13:00', 'activity' => 'Istirahat & Hiburan Pendukung'],
                ['time' => '13:00 - 17:30', 'activity' => 'Sesi Penampilan Kategori Purna / Senior'],
                ['time' => '17:30 - 18:00', 'activity' => 'Evaluasi Juri & Pengumuman Finalis Hari ke-1'],
            ],
        ]);
        \App\Models\EventSchedule::create([
            'event_id' => $event->id,
            'day_type' => 'day_2',
            'date_string' => 'Minggu, 21 Juni 2026',
            'categories' => ['U-12 (SD)', 'U-19 (SMA)'],
            'timeline' => [
                ['time' => '07:30 - 08:00', 'activity' => 'Registrasi & Daftar Ulang Kontingen Hari ke-2'],
                ['time' => '08:00 - 12:00', 'activity' => 'Sesi Penampilan Kategori U-12 (SD)'],
                ['time' => '12:00 - 13:00', 'activity' => 'Istirahat & Ice Breaking'],
                ['time' => '13:00 - 16:30', 'activity' => 'Sesi Penampilan Kategori U-19 (SMA) - Babak Penyisihan'],
                ['time' => '16:30 - 18:00', 'activity' => 'Babak Final (Top 2 U-16 SMP & Top 2 U-19 SMA)'],
                ['time' => '18:00 - 19:30', 'activity' => 'Istirahat & Persiapan Pengumuman Juara'],
                ['time' => '19:30 - 21:00', 'activity' => 'Closing Ceremony: Pengumuman Juara & Pembagian Hadiah'],
            ],
        ]);

        // 11. Seed Testimonials
        \App\Models\Testimonial::create([
            'user_id' => $spectator->id,
            'rating' => 5,
            'message' => 'Acara yang luar biasa! Paskibra se-Kaltim tampil sangat memukau dan tertib.',
            'status' => 'enabled',
        ]);
        \App\Models\Testimonial::create([
            'user_id' => $spectator->id,
            'rating' => 5,
            'message' => 'Tiket checkout sangat mudah menggunakan QRIS, dan quickcount live-nya seru banget untuk dipantau!',
            'status' => 'enabled',
        ]);

        // 12. Seed Event Content
        \App\Models\EventContent::create([
            'event_id' => $event->id,
            'key' => 'judges',
            'value' => [
                ['name' => 'Haryoto', 'role' => 'Ketua Juri PBB', 'image_url' => ''],
                ['name' => 'Bahari Pradana', 'role' => 'Juri Vafor', 'image_url' => ''],
                ['name' => 'Mutiara Kinanti Alfida', 'role' => 'Juri Makeup & Kostum', 'image_url' => ''],
            ]
        ]);
        \App\Models\EventContent::create([
            'event_id' => $event->id,
            'key' => 'banthal_prize',
            'value' => [
                [
                    'type' => 'category',
                    'label' => 'Juara Umum U-19 SMA',
                    'items' => [
                        ['title' => 'Piala Bergilir Danrem 091/ASN', 'description' => 'Untuk juara umum kategori U-19 SMA'],
                        ['title' => 'Uang Pembinaan Rp 5.000.000', 'description' => 'Dana apresiasi pembinaan'],
                    ]
                ],
                [
                    'type' => 'category',
                    'label' => 'Juara Umum U-16 SMP',
                    'items' => [
                        ['title' => 'Piala Bergilir Kapolresta Samarinda', 'description' => 'Untuk juara umum kategori U-16 SMP'],
                        ['title' => 'Uang Pembinaan Rp 3.500.000', 'description' => 'Dana apresiasi pembinaan'],
                    ]
                ]
            ]
        ]);
        \App\Models\EventContent::create([
            'event_id' => $event->id,
            'key' => 'useful_links',
            'value' => [
                ['label' => 'Buku Panduan Juknis Lomba', 'url' => 'https://example.com/juknis-lomba'],
                ['label' => 'Formulir Pendaftaran Ulang', 'url' => 'https://example.com/daftar-ulang'],
            ]
        ]);

        // Delegate scoring, rubrics, and juries generation to PopulateAllContingentScoresSeeder
        $this->call(PopulateAllContingentScoresSeeder::class);
    }
}

import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Search, HelpCircle, Ticket, Vote, Award, User, ChevronDown, ChevronUp, Heart, Crown, Phone, FileText } from 'lucide-react';
import ScrollReveal from '../../Components/ScrollReveal';
import Footer from '../../Components/Footer';

export default function Faq({ activeEvent, auth }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openIndex, setOpenIndex] = useState(null);

    const categories = [
        { id: 'all', label: 'Semua Kategori', icon: HelpCircle },
        { id: 'auth', label: 'Akun & Pendaftaran', icon: User },
        { id: 'pendaftaran', label: 'Pendaftaran Lomba', icon: FileText },
        { id: 'ticket', label: 'Penjualan Tiket', icon: Ticket },
        { id: 'vote', label: 'Voting Favorit', icon: Vote },
        { id: 'scoring', label: 'Penilaian Juri', icon: Award },
        { id: 'supporter', label: 'Supporter', icon: Heart },
        { id: 'juara', label: 'Juara & Penghargaan', icon: Crown },
    ];

    const faqData = [
        // ==================== AKUN & PENDAFTARAN ====================
        {
            category: 'auth',
            question: 'Bagaimana cara membuat akun di platform PASGARDA?',
            answer: 'Anda dapat mendaftar dengan mengklik tombol "Masuk" di beranda lalu memilih tab "Daftar". Masukkan nama lengkap, alamat email, dan password baru Anda. Setelah berhasil, Anda akan otomatis masuk ke sistem. Anda juga bisa mendaftar menggunakan akun Google.'
        },
        {
            category: 'auth',
            question: 'Bagaimana cara login menggunakan Google?',
            answer: 'Pada halaman masuk, klik tombol "Google". Anda akan diarahkan ke halaman login Google. Pilih akun Google Anda, lalu izinkan akses. Setelah berhasil, Anda akan otomatis masuk ke platform tanpa perlu memasukkan password.'
        },
        {
            category: 'auth',
            question: 'Bagaimana cara login menggunakan kode OTP email?',
            answer: 'Pada halaman masuk, masukkan alamat email Anda lalu klik "Kirim OTP". Periksa kotak masuk email Anda untuk kode OTP 6-digit. Masukkan kode tersebut untuk masuk ke platform. Metode ini berguna jika Anda lupa password.'
        },
        {
            category: 'auth',
            question: 'Bagaimana cara pelatih/coach mengakses Portal Perwakilan Kontingen (Portal Rep)?',
            answer: 'Daftarkan akun Anda di platform. Jika akun Anda belum dikaitkan dengan kontingen sekolah Anda, masuk ke Portal Rep di halaman detail Event. Anda akan melihat daftar sekolah dan status pelatih. Silakan hubungi admin panitia via tombol WhatsApp yang disediakan untuk menghubungkan email Anda ke kontingen sekolah Anda.'
        },
        {
            category: 'auth',
            question: 'Bagaimana jika saya lupa password akun saya?',
            answer: 'Klik tautan "Lupa Password" pada halaman masuk. Masukkan alamat email Anda untuk menerima kode OTP 6-digit. Masukkan kode tersebut beserta password baru Anda untuk mereset password.'
        },
        {
            category: 'auth',
            question: 'Apakah akun saya bisa digunakan untuk membeli lebih dari satu tiket?',
            answer: 'Ya, satu akun dapat membeli hingga batas maksimum tiket per user yang ditentukan untuk event (biasanya batasnya adalah 15 tiket per akun).'
        },

        // ==================== PENDAFTARAN LOMBA ====================
        {
            category: 'pendaftaran',
            question: 'Bagaimana cara mendaftarkan kontingen untuk lomba?',
            answer: 'Pendaftaran dilakukan secara online via Google Form ATAU offline di Sekretariat Paskibra SMAN 5 Samarinda (Senin–Jumat, pukul 16.00–17.30 WITA). Pendaftaran Kejurcab dibuka hingga 30 Mei 2026, sedangkan pendaftaran reguler hingga 6 Juni 2026.'
        },
        {
            category: 'pendaftaran',
            question: 'Berapa biaya pendaftaran lomba per kategori?',
            answer: 'Biaya pendaftaran untuk peserta Kejurcab: U-12 Rp 750.000, U-16 Rp 700.000, U-19 Rp 700.000, Purna/Senior Rp 750.000. Untuk peserta reguler: U-12 Rp 800.000, U-16 Rp 750.000, U-19 Rp 750.000, Purna/Senior Rp 800.000.'
        },
        {
            category: 'pendaftaran',
            question: 'Bagaimana cara pembayaran biaya pendaftaran?',
            answer: 'Pembayaran dilakukan melalui transfer ke Bank BCA No. Rekening 513-513-0351 atas nama Fajar Tegar Rosyandi. Setelah transfer, konfirmasi ke nomor 0838-1323-9571 (Almira) dengan format: "Bukti Bayar (Jumlah Tim)_Nama Sekolah". Pembayaran harus LUNAS 100% sebelum 6 Juni 2026 pukul 17.00 WITA.'
        },
        {
            category: 'pendaftaran',
            question: 'Apa saja berkas yang wajib dilampirkan saat pendaftaran?',
            answer: 'Berkas yang wajib dilampirkan: a) Pas foto 3x4 Peserta, Pelatih, dan Official, b) Surat Rekomendasi/Surat Tugas/FC Kartu Pelajar/FC Tanda Pengenal. Berkas dikumpulkan secara ONLINE paling lambat 12 Juni 2026.'
        },
        {
            category: 'pendaftaran',
            question: 'Apa itu Technical Meeting (TM) dan siapa yang harus hadir?',
            answer: 'Technical Meeting dilaksanakan pada 6 Juni 2026 di SMA Negeri 5 Samarinda. TM disarankan dihadiri oleh Danton dan Pelatih. Peserta yang tidak mengikuti TM dianggap telah menyetujui hasil TM. Nomor urut peserta diundi dan diberikan pada saat TM.'
        },
        {
            category: 'pendaftaran',
            question: 'Bagaimana cara daftar ulang (re-registrasi)?',
            answer: 'Daftar ulang dilakukan secara online via Google Form maksimal 12 Juni 2026 pukul 21.00 WITA. Perubahan/pergantian susunan pasukan setelah daftar ulang wajib melapor ke panitia paling lambat saat DP 2. Apabila saat absensi di DP 2 peserta tidak sesuai berkas, akan dikenakan pengurangan nilai.'
        },
        {
            category: 'pendaftaran',
            question: 'Apakah uang pendaftaran bisa dikembalikan jika batal?',
            answer: 'Uang pendaftaran tidak dapat dikembalikan, kecuali jika kuota U-12 atau Purna/Senior tidak mencapai 10 peserta maka kategori akan ditiadakan dan uang pendaftaran dikembalikan.'
        },

        // ==================== PENJUALAN TIKET ====================
        {
            category: 'ticket',
            question: 'Bagaimana cara membeli tiket secara online?',
            answer: 'Buka halaman Event, pilih menu "Beli Tiket", tentukan jumlah paket tiket yang diinginkan, isi nama dan email pembeli, lalu lakukan pembayaran via Midtrans (QRIS, Transfer Bank, dll). E-ticket ber-QR Code akan diterbitkan secara otomatis setelah pembayaran sukses.'
        },
        {
            category: 'ticket',
            question: 'Apa perbedaan lengkap tiket Online, Silver, Gold, dan Platinum?',
            answer: 'Tiket Online (Rp25rb): 1 hari, 1 vote, 1 token sharing. Tiket Silver (Rp25rb): 1 hari, 1 vote, 1 kupon doorprize. Tiket Gold (Rp40rb): 1 hari, 2 vote, 1 kupon doorprize. Tiket Platinum (Rp50rb): 2 hari, 3 vote, 2 kupon doorprize. Tiket Silver, Gold, dan Platinum hanya dijual On The Spot (OTS).'
        },
        {
            category: 'ticket',
            question: 'Apakah ada batas pembelian tiket online?',
            answer: 'Ya, tiket online dibatasi untuk 700 pembelian pertama. Setelah kuota terpenuhi, hanya tersedia pembelian tiket On The Spot (OTS) di lokasi acara.'
        },
        {
            category: 'ticket',
            question: 'Apakah peserta lomba perlu membeli tiket?',
            answer: 'Peserta lomba tidak dikenakan biaya tiket masuk pada hari tampil. Jika peserta ingin menonton di luar hari tampil, maka dikategorikan sebagai penonton dan wajib membeli tiket.'
        },
        {
            category: 'ticket',
            question: 'Bagaimana cara check-in tiket di gerbang masuk?',
            answer: 'Tunjukkan QR Code tiket Anda (dari email atau menu "Tiket Saya") kepada operator gate. Operator akan memindai QR Code Anda. Setelah check-in berhasil, token voting Anda akan aktif dan siap digunakan. Tiket OTS akan langsung di-scan oleh operator gate saat pembelian.'
        },
        {
            category: 'ticket',
            question: 'Bagaimana cara klaim kupon doorprize?',
            answer: 'Setelah check-in, buka menu "Tiket Saya" dan pilih tiket yang memiliki kupon doorprize (paket Silver, Gold, Platinum). Klik tombol "Klaim Kupon" untuk mengikuti undian doorprize. Setiap tiket memiliki kuota kupon yang berbeda sesuai paketnya.'
        },
        {
            category: 'ticket',
            question: 'Apa itu token sharing produk sponsor?',
            answer: 'Token sharing terdapat pada tiket Online. Token ini memungkinkan Anda untuk berbagi ("sharing") produk sponsor ke kontingen favorit Anda. Setiap tiket Online memberikan 1 token sharing yang bisa dialokasikan ke kontingen pilihan Anda.'
        },
        {
            category: 'ticket',
            question: 'Apakah tiket OTS bisa dibatalkan?',
            answer: 'Ya, tiket OTS yang sudah diterbitkan dapat dibatalkan oleh admin panitia melalui panel OTS. Pembatalan akan menghapus tiket dan pendapatan terkait.'
        },

        // ==================== VOTING FAVORIT ====================
        {
            category: 'vote',
            question: 'Bagaimana cara menggunakan token voting yang saya miliki?',
            answer: 'Setelah tiket Anda berhasil di-check-in di gerbang masuk, token voting Anda akan aktif. Buka menu "Tiket Saya", pilih tiket yang aktif, lalu gunakan tombol alokasi voting untuk memilih kontingen favorit Anda.'
        },
        {
            category: 'vote',
            question: 'Dapatkah saya membagi token voting saya ke beberapa sekolah?',
            answer: 'Ya, jika Anda memiliki lebih dari 1 token voting (seperti tiket paket Gold atau Platinum), Anda bisa mengalokasikan token tersebut untuk beberapa kontingen sekolah yang berbeda secara fleksibel.'
        },
        {
            category: 'vote',
            question: 'Apakah saya bisa mem-vote sekolah tempat saya menjadi pelatih?',
            answer: 'Tidak bisa. Sistem PASGARDA memiliki proteksi self-voting otomatis. Jika nama akun Anda terdeteksi sama dengan nama pelatih kontingen tersebut, sistem akan menolak alokasi suara Anda demi keadilan kompetisi.'
        },
        {
            category: 'vote',
            question: 'Apakah saya bisa vote untuk kontingen yang tampil di hari berbeda?',
            answer: 'Tiket Silver dan Gold hanya dapat memberikan vote untuk satuan yang tampil di hari pembelian tiket. Tiket Platinum dapat dibeli pada Hari Ke-1 dan dapat memberikan vote untuk satuan yang berbeda hari tampil.'
        },
        {
            category: 'vote',
            question: 'Apa yang dimaksud dengan Kontingen Terbaik?',
            answer: 'Kontingen Terbaik adalah kontingen yang memperoleh ranking vote tertinggi dari seluruh penonton. Pemenang Kontingen Terbaik ditentukan dari total vote yang terkumpul selama acara berlangsung.'
        },

        // ==================== PENILAIAN JURI ====================
        {
            category: 'scoring',
            question: 'Bagaimana rumus perhitungan nilai di Penampilan Pertama?',
            answer: 'Penampilan Pertama adalah babak utama yang menentukan seluruh peringkat juara.\n\nUntuk U-12:\n→ Penampilan Pertama menentukan SEMUA juara, termasuk Juara Umum.\n→ Rumus: PBB (3 Juri) + Danton (3 Juri) + Vafor (2 Juri) + Kostum + Make Up – Pengurangan Nilai\n\nUntuk U-16 & U-19:\n→ Penampilan Pertama menentukan juara selain Juara Umum Garda (Juara Utama, Harapan, PBB Terbaik, Danton Terbaik, Vafor Terbaik, Kostum Terbaik, Make Up Terbaik, Pelatih Terbaik, dll).\n→ Rumus: PBB (3 Juri) + Danton (3 Juri) + Vafor (2 Juri) – Pengurangan Nilai\n→ Juara Umum Garda ditentukan melalui babak The Final (khusus 2 tim terbaik).'
        },
        {
            category: 'scoring',
            question: 'Berapa jumlah dewan juri dan apa saja yang dinilai?',
            answer: 'Terdapat total 10 juri yang terdiri dari: 3 Juri PBB & Danton, 2 Juri Vafor, 2 Juri Kostum, 2 Juri Make Up, dan 1 Juri Pembantu. Dewan Juri berasal dari Tentara Nasional Indonesia (TNI) dan Juri Profesional.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana ketentuan waktu penampilan PBB dan Vafor?',
            answer: 'Untuk U-12: PBB 4 menit 30 detik, Vafor 4 menit. Untuk U-16, U-19 & Purna/Senior: PBB 5 menit 30 detik, Vafor 4 menit. Peringatan 1 = waktu dimulai, Peringatan 2 = sisa 2 menit, Peringatan 3 = waktu habis. Melebihi waktu akan mendapat pengurangan nilai 1 poin/detik.'
        },
        {
            category: 'scoring',
            question: 'Apa saja materi yang dinilai dalam PBB?',
            answer: 'Materi PBB untuk U-16, U-19 & Purna terdiri dari 31 gerakan mulai dari Berhimpun, Berkumpul, Sikap Sempurna, hingga Bubar. Untuk U-12 terdiri dari 23 gerakan. Peraturan yang digunakan adalah Peraturan Panglima TNI No. 57 & 58 Tahun 2018.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana penilaian Danton?',
            answer: 'Penilaian Danton mencakup 7 aspek: Sikap, Volume, Artikulasi, Intonasi/Ritme/Tempo, Penguasaan Materi, Penguasaan Lapangan, dan Penguasaan Pasukan. Danton menempati kotak berukuran 60x60 cm dan tidak perlu melakukan penghormatan kepada dewan juri saat akan tampil.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana penilaian Vafor (Variasi & Formasi)?',
            answer: 'Vafor dinilai oleh 2 juri dengan materi meliputi: Opening & Ending, Pembawaan Tema, Kesesuaian Gerakan, Tingkat Kesulitan, Kerapihan & Kekompakan, Unsur PBB, Penjiwaan, dan Penguasaan Ruang. Dilarang menggunakan musik tetap dan properti berbahaya seperti pedang, golok, atau keris.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana penilaian Kostum?',
            answer: 'Kostum dinilai oleh 2 juri saat DP 2 dan lapangan Vafor. Aspek penilaian: Kesesuaian Gender/Konsep, Body Fitting, Desain Kostum, Kreativitas Bentuk & Perpaduan Warna, Kebersihan & Kerapihan, serta Kesesuaian Atribut. Dilarang menggunakan PDU, atribut PPI/ormas/partai politik, atau kaos olahraga.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana penilaian Make Up?',
            answer: 'Make Up dinilai oleh 2 juri saat DP 2 dan lapangan Vafor. Aspek penilaian: Kesesuaian dengan Desain Kostum, Kesesuaian dengan Konsep Vafor, Kesesuaian dengan Gender, Kreativitas, Ketahanan, Kenyamanan, serta Kerapihan & Kebersihan Make Up.'
        },
        {
            category: 'scoring',
            question: 'Apa saja sanksi pengurangan nilai?',
            answer: 'Pengurangan nilai bervariasi: administrasi tidak lengkap (-50/pleton), terlambat daftar ulang (-20/pleton), tidak ikut apel pembukaan (-50/pleton), kekurangan anggota (-50/orang), atribut terlepas (-5/atribut dari nilai kostum), melebihi batas waktu (-1/detik), terlambat tampil setelah 2x panggilan (-200/pleton), vafor menggunakan musik (-50/pleton), merokok di area lomba (-200/pleton), dan lainnya hingga diskualifikasi untuk pelanggaran berat.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana jika nilai akhir sama (tiebreaker)?',
            answer: 'Jika nilai akhir sama, tiebreaker ditentukan secara berurutan: 1) Umum Garda: variabel tertinggi PBB, 2) Peringkat: variabel tertinggi PBB, 3) PBB: Berkumpul + Periksa Kerapihan, 4) Danton: Penguasaan Materi + Lapangan, 5) Variasi Formasi: Tingkat Kesulitan + Penjiwaan, 6) Kostum: Kreativitas Bentuk & Perpaduan Warna, 7) Make Up: Kesesuaian dengan Desain Kostum.'
        },
        {
            category: 'scoring',
            question: 'Apa itu The Final dan bagaimana cara penentuannya?',
            answer: 'The Final memperebutkan PIALA JUARA UMUM GARDA. Peserta The Final adalah 2 tim peringkat tertinggi tiap kategori U-16 dan U-19 dari total nilai PBB + Danton + Vafor + Kontingen – Pengurangan Nilai. The Final dilaksanakan sesuai hari tampil tiap kategori. Perolehan nilai The Final tidak mempengaruhi peringkat Juara Utama, Danton, maupun Vafor pada penampilan pertama.'
        },
        {
            category: 'scoring',
            question: 'Bagaimana perhitungan Nilai Kontingen dari voting?',
            answer: 'Nilai Kontingen dihitung berdasarkan ranking vote: Ranking 1 = 1,0% × (PBB + Danton), Ranking 2 = 0,8%, Ranking 3 = 0,6%, Ranking 4 = 0,4%, Ranking 5 = 0,3%, Ranking 6 = 0,2%, Ranking 7 = 0,1%, Ranking 8+ = tidak mendapat nilai.'
        },

        // ==================== SUPPORTER ====================
        {
            category: 'supporter',
            question: 'Apa yang dimaksud dengan Supporter Terbaik?',
            answer: 'Supporter Terbaik adalah kategori juara yang diberikan kepada kontingen dengan total pembelian tiket online terbanyak. Semakin banyak tiket online yang dibeli oleh pendukung suatu kontingen, semakin besar peluang kontingen tersebut menjadi Supporter Terbaik.'
        },
        {
            category: 'supporter',
            question: 'Bagaimana cara mendukung kontingen favorit saya?',
            answer: 'Anda dapat mendukung kontingen favorit dengan membeli tiket online dan mengalokasikan token supporter ke kontingen pilihan Anda. Setiap pembelian tiket online menambah poin supporter untuk kontingen yang Anda dukung.'
        },
        {
            category: 'supporter',
            question: 'Apa perbedaan vote dengan supporter?',
            answer: 'Vote adalah suara untuk menentukan Kontingen Terbaik berdasarkan ranking voting. Supporter adalah kategori terpisah yang dihitung berdasarkan total pembelian tiket online terbanyak untuk suatu kontingen. Keduanya memberikan peluang juang yang berbeda.'
        },

        // ==================== JUARA & PENGHARGAAN ====================
        {
            category: 'juara',
            question: 'Apa saja kategori juara yang diperebutkan?',
            answer: 'Kategori juara meliputi: Juara Umum Garda (Piala Bergilir), Juara Utama 1/2/3, Juara Harapan 1/2/3, Juara Madya, Bina, Mula, Purwa, Caraka, Wira, Potensial, Perintis, Siaga (bervariasi per kategori umur), serta kategori khusus: PBB Terbaik, Vafor Terbaik, Danton Terbaik, Pelatih Terbaik, Kostum Terbaik, Make Up Terbaik, Sponsor Terbaik, Kontingen Terbaik, Kreator Terfavorit, Peserta Terfavorit, dan Supporter Terfavorit.'
        },
        {
            category: 'juara',
            question: 'Apa itu Juara Umum Garda?',
            answer: 'Juara Umum Garda adalah gelar tertinggi yang memperebutkan Piala Bergilir. Pemenang ditentukan melalui babak The Final, diikuti oleh 2 tim peringkat tertinggi tiap kategori U-16 dan U-19. Juara Umum Garda mendapatkan Piala Bergilir + Uang Pembinaan + Sertifikat + Medali.'
        },
        {
            category: 'juara',
            question: 'Bagaimana cara menentukan Sponsor Terbaik?',
            answer: 'Sponsor Terbaik ditentukan dari total pembelian produk sponsor terbanyak oleh kontingen. Semakin banyak kontingen membeli produk sponsor, semakin besar peluang menjadi Sponsor Terbaik.'
        },
        {
            category: 'juara',
            question: 'Bagaimana cara menentukan Kreator Terfavorit?',
            answer: 'Kreator Terfavorit ditentukan dari total likes Reels Instagram terbanyak. Kontingen dengan jumlah likes reels tertinggi akan meraih gelar Kreator Terfavorit.'
        },
        {
            category: 'juara',
            question: 'Bagaimana cara menentukan Peserta Terfavorit?',
            answer: 'Peserta Terfavorit ditentukan dari total likes Instagram (posts) terbanyak. Kontingen dengan engagement Instagram tertinggi akan meraih gelar Peserta Terfavorit.'
        },
        {
            category: 'juara',
            question: 'Bagaimana cara menentukan Pelatih Terbaik?',
            answer: 'Pelatih Terbaik ditentukan secara otomatis oleh sistem, yaitu pelatih dari kontingen yang meraih Juara Utama 1. Tidak diperlukan input manual untuk kategori ini.'
        },
    ];

    const handleAccordionToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Filter FAQs based on category and search query
    const filteredFaqs = faqData.filter((faq) => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] font-sans selection:bg-gold-primary selection:text-black">
            <Head title="FAQ - Pusat Bantuan" />



            {/* Header Section */}
            <header className="relative py-16 bg-checkerboard border-b border-bronze-muted/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-deep-black/20 via-[#2A1A0A]/30 to-deep-black"></div>
                <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                    <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest text-gold-cream border border-gold-primary/30 rounded-full bg-accent-maroon/30 uppercase mb-4">
                        Pusat Bantuan Publik
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                        Ada yang Bisa Kami <span className="text-gold-primary">Bantu?</span>
                    </h1>
                    <p className="text-sm text-text-primary/75 max-w-xl mx-auto mb-8">
                        Cari jawaban atas pertanyaan umum mengenai tiket masuk, sistem voting favorit, alur pendaftaran, dan metode penilaian juri.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-lg mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bronze-muted">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari pertanyaan, kata kunci, atau topik..."
                            className="block w-full pl-10 pr-4 py-3 bg-deep-black/80 border border-gold-primary/30 rounded-lg text-text-primary placeholder-bronze-muted/50 focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary transition-all text-sm shadow-xl"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar: Categories */}
                    <ScrollReveal>
                    <div className="md:col-span-1 space-y-2">
                        <h3 className="text-xs font-bold text-gold-cream uppercase tracking-wider mb-4 px-2">
                            Kategori Topik
                        </h3>
                        <div className="flex flex-row md:flex-col overflow-x-auto scroll-smooth md:overflow-x-visible gap-1.5 pb-2 md:pb-0">
                            {categories.map((cat) => {
                                const IconComponent = cat.icon;
                                const isActive = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-semibold transition-all shrink-0 text-left border ${
                                            isActive
                                                ? 'bg-gradient-to-r from-accent-maroon to-accent-burgundy text-white border-accent-burgundy/40 shadow-md'
                                                : 'bg-deep-black/40 border-bronze-muted/10 text-text-muted hover:text-white hover:border-gold-primary/20'
                                        }`}
                                    >
                                        <IconComponent className="h-4 w-4 shrink-0" />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    </ScrollReveal>

                    {/* Accordion Questions List */}
                    <div className="md:col-span-3 space-y-4">
                        <div className="border-b border-bronze-muted/20 pb-3 mb-6 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                                {categories.find((c) => c.id === selectedCategory)?.label || 'Daftar Pertanyaan'}
                            </h2>
                            <span className="text-xs text-text-muted">
                                Menampilkan {filteredFaqs.length} hasil
                            </span>
                        </div>

                        {filteredFaqs.length > 0 ? (
                            <div className="space-y-3">
                                {filteredFaqs.map((faq, idx) => {
                                    const isOpen = openIndex === idx;
                                    return (
                                        <ScrollReveal key={idx} delay={idx * 80}>
                                        <div
                                            className={`premium-card border transition-all duration-300 ${
                                                isOpen
                                                    ? 'border-gold-primary/40 bg-deep-black/60 shadow-lg'
                                                    : 'border-bronze-muted/10 hover:border-gold-primary/20 bg-deep-black/30'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleAccordionToggle(idx)}
                                                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left focus:outline-none"
                                            >
                                                <span className="font-bold text-sm text-white hover:text-gold-light transition-colors">
                                                    {faq.question}
                                                </span>
                                                <span className="text-gold-primary shrink-0">
                                                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </span>
                                            </button>
                                            
                                            {/* Expandable answer */}
                                            {isOpen && (
                                                <div className="px-5 pb-5 pt-1 text-xs text-text-primary/80 leading-relaxed border-t border-bronze-muted/10 animate-fade-in whitespace-pre-line">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                        </ScrollReveal>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-deep-black/20 border border-dashed border-bronze-muted/20 rounded-lg">
                                <HelpCircle className="h-10 w-10 text-bronze-muted mx-auto mb-3" />
                                <h3 className="font-bold text-white text-sm">Tidak Ada Jawaban Ditemukan</h3>
                                <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                                    Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer className="mt-20" />
        </div>
    );
}

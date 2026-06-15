<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'PASGARDA') }}</title>

        <!-- SEO -->
        <meta name="description" content="Lomba Baris Garda 55 (PASGARDA) Vol.20 — Event Paskibra SMA Negeri 5 Samarinda. Ajang lomba baris berbaris (LKBB) se-Kalimantan Timur untuk U-12, U-16, U-19, dan Purna.">
        <meta name="keywords" content="lomba baris, lkbb, lkbb kalimantan, paskibra smala, pasgarda, lomba paskibra, lomba baris berbaris, samarinda, kaltim">
        <meta name="robots" content="index, follow">
        <meta property="og:title" content="PASGARDA — Lomba Baris Garda 55">
        <meta property="og:description" content="Lomba Baris Berbaris (LKBB) se-Kalimantan Timur. Ajang paskibra terbesar di Samarinda.">
        <meta property="og:image" content="https://pasgarda.com/images/pasgarda.png">
        <meta property="og:url" content="https://pasgarda.com">
        <meta property="og:type" content="website">

        <!-- Favicon -->
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="112x112" href="/images/favicon-112x112.png">

        <!-- Google Fonts: Outfit -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

        <!-- Styles / Scripts -->
        @if (app()->environment('local') && Illuminate\Support\Facades\Vite::isRunningHot())
        @php $viteUrl = rtrim(file_get_contents(public_path('hot'))); @endphp
        <script type="module">
            import { injectIntoGlobalHook } from "{{ $viteUrl }}/@react-refresh";
            injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
        </script>
        @endif
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="bg-[#0D0C0A] text-[#F2EDD6] antialiased">
        @inertia
    </body>
</html>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Nilai - {{ $contingent['school_name'] }}</title>
    <style>
        @page { margin: 20px; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            line-height: 1.5;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #8C6828;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header img { max-height: 90px; margin-bottom: 8px; }
        .header h1 { font-size: 18px; color: #8C6828; margin: 5px 0; text-transform: uppercase; letter-spacing: 2px; }
        .header p { font-size: 11px; color: #666; margin: 2px 0; }

        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 3px 8px; font-size: 10px; }
        .info-table td:first-child { font-weight: bold; color: #555; width: 120px; }
        .info-table td:last-child { font-weight: bold; color: #1a1a1a; }

        .section-title {
            background: #8C6828;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0 10px 0;
            border-radius: 3px;
        }
        .sub-section-title {
            background: #F5DEB3;
            color: #4A3728;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 12px 0 6px 0;
            border-radius: 2px;
        }

        .grand-total-box {
            text-align: center;
            border: 2px solid #8C6828;
            padding: 15px;
            margin: 10px 0 20px 0;
            border-radius: 5px;
            background: #FDF8F0;
        }
        .grand-total-box .label { font-size: 10px; color: #8C6828; text-transform: uppercase; letter-spacing: 1px; }
        .grand-total-box .value { font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 5px 0; }

        .score-grid { width: 100%; margin-bottom: 15px; }
        .score-grid td {
            text-align: center;
            padding: 8px 5px;
            border: 1px solid #ddd;
            font-size: 10px;
        }
        .score-grid td.label { font-weight: bold; background: #f5f5f5; color: #555; text-transform: uppercase; font-size: 9px; }
        .score-grid td.value { font-size: 16px; font-weight: bold; color: #1a1a1a; }
        .score-grid td.penalty { color: #dc2626; }

        table.audit {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
        }
        table.audit th {
            background: #8C6828;
            color: #ffffff;
            padding: 5px 6px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
        }
        table.audit th.center { text-align: center; }
        table.audit td {
            padding: 4px 6px;
            border-bottom: 1px solid #eee;
            color: #1a1a1a;
        }
        table.audit td.center { text-align: center; }
        table.audit tr:nth-child(even) { background: #fafafa; }
        table.audit .total-row td { font-weight: bold; background: #FDF8F0; border-top: 2px solid #8C6828; }
        table.audit .section-separator td {
            background: #F5DEB3;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            color: #4A3728;
            padding: 4px 6px;
            border-top: 2px solid #8C6828;
        }

        .footer {
            text-align: center;
            font-size: 8px;
            color: #999;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        .badge-reguler {
            font-size: 8px;
            color: #8C6828;
            border: 1px solid #8C6828;
            padding: 1px 5px;
            border-radius: 2px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .no-data {
            text-align: center;
            color: #999;
            font-style: italic;
            padding: 15px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            <tr>
                <td style="width:33%;text-align:left;vertical-align:middle;">
                    <img src="{{ public_path('images/garda event.png') }}" alt="Garda Event" style="max-height:90px;display:block;">
                </td>
                <td style="width:33%;text-align:center;vertical-align:middle;">
                    <img src="{{ public_path('images/lombabaris.png') }}" alt="Lomba Baris" style="max-height:90px;display:inline-block;">
                </td>
                <td style="width:34%;text-align:right;vertical-align:middle;">
                    <img src="{{ public_path('images/pasgarda.png') }}" alt="PASGARDA" style="max-height:90px;display:block;">
                </td>
            </tr>
        </table>
        <h1>Rekap Nilai Kontingen</h1>
        <p>{{ $event['name'] }}</p>
    </div>

    <table class="info-table">
        <tr><td>Kontingen</td><td>{{ $contingent['school_name'] }} @if($contingent['is_reguler'])<span class="badge-reguler">*Reguler</span>@endif</td></tr>
        <tr><td>Kategori</td><td>{{ $contingent['category_type'] }}</td></tr>
        <tr><td>Wilayah</td><td>{{ $contingent['region'] }}</td></tr>
        <tr><td>Pelatih</td><td>{{ $contingent['coach_name'] }}</td></tr>
    </table>

    @if($score)
    <div class="grand-total-box">
        <div class="label">Grand Total</div>
        <div class="value">{{ round($score['grand_total']) }}</div>
    </div>

    <div class="section-title">Rincian Nilai</div>
    <table class="score-grid">
        <tr>
            <td class="label">PBB</td>
            <td class="label">Danton</td>
            <td class="label">Vafor</td>
            <td class="label">Kostum</td>
            <td class="label">Makeup</td>
            <td class="label">Peng. Kostum</td>
            <td class="label">Penalti</td>
        </tr>
        <tr>
            <td class="value">{{ round($score['pbb_score']) }}</td>
            <td class="value">{{ round($score['danton_score']) }}</td>
            <td class="value">{{ round($score['vafor_score']) }}</td>
            <td class="value">{{ round($score['kostum_score']) }}</td>
            <td class="value">{{ round($score['makeup_score']) }}</td>
            <td class="value penalty">-{{ round($score['kostum_penalty']) }}</td>
            <td class="value penalty">-{{ round($score['penalties_score']) }}</td>
        </tr>
    </table>

    <div class="section-title">Audit Lembar Penilaian per Juri</div>

    {{-- PBB + Danton --}}
    @php
        $pbbData = $juryScores['pbb'] ?? [];
    @endphp
    <div class="sub-section-title">PBB + Danton</div>
    @if(count($pbbData) > 0)
        <table class="audit">
            <thead>
                <tr>
                    <th style="width:30px;text-align:center;">No</th>
                    <th>Unsur Gerakan</th>
                    <th style="width:55px;text-align:center;">Juri 1</th>
                    <th style="width:55px;text-align:center;">Juri 2</th>
                    <th style="width:55px;text-align:center;">Juri 3</th>
                    <th style="width:55px;text-align:center;background:#A07830;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($pbbItems as $key => $label)
                @php
                    $s1 = isset($pbbData[1]['pbb_details'][$key]) && $pbbData[1]['pbb_details'][$key] !== '' ? (int)$pbbData[1]['pbb_details'][$key] : null;
                    $s2 = isset($pbbData[2]['pbb_details'][$key]) && $pbbData[2]['pbb_details'][$key] !== '' ? (int)$pbbData[2]['pbb_details'][$key] : null;
                    $s3 = isset($pbbData[3]['pbb_details'][$key]) && $pbbData[3]['pbb_details'][$key] !== '' ? (int)$pbbData[3]['pbb_details'][$key] : null;
                    $total = ($s1 ?? 0) + ($s2 ?? 0) + ($s3 ?? 0);
                @endphp
                <tr>
                    <td style="text-align:center;">{{ $loop->iteration }}</td>
                    <td>{{ $label }}</td>
                    <td style="text-align:center;">{{ $s1 !== null ? $s1 : '-' }}</td>
                    <td style="text-align:center;">{{ $s2 !== null ? $s2 : '-' }}</td>
                    <td style="text-align:center;">{{ $s3 !== null ? $s3 : '-' }}</td>
                    <td style="text-align:center;font-weight:bold;">{{ $total }}</td>
                </tr>
                @endforeach
                <tr>
                    <td colspan="6" style="background:#F5DEB3;font-weight:bold;font-size:9px;text-transform:uppercase;color:#4A3728;padding:4px 6px;border-top:2px solid #8C6828;">Danton (Komandan)</td>
                </tr>
                @foreach($dantonItems as $key => $label)
                @php
                    $s1 = isset($pbbData[1]['danton_details'][$key]) && $pbbData[1]['danton_details'][$key] !== '' ? (int)$pbbData[1]['danton_details'][$key] : null;
                    $s2 = isset($pbbData[2]['danton_details'][$key]) && $pbbData[2]['danton_details'][$key] !== '' ? (int)$pbbData[2]['danton_details'][$key] : null;
                    $s3 = isset($pbbData[3]['danton_details'][$key]) && $pbbData[3]['danton_details'][$key] !== '' ? (int)$pbbData[3]['danton_details'][$key] : null;
                    $total = ($s1 ?? 0) + ($s2 ?? 0) + ($s3 ?? 0);
                @endphp
                <tr>
                    <td style="text-align:center;">{{ $loop->iteration }}</td>
                    <td>{{ $label }}</td>
                    <td style="text-align:center;">{{ $s1 !== null ? $s1 : '-' }}</td>
                    <td style="text-align:center;">{{ $s2 !== null ? $s2 : '-' }}</td>
                    <td style="text-align:center;">{{ $s3 !== null ? $s3 : '-' }}</td>
                    <td style="text-align:center;font-weight:bold;">{{ $total }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="no-data">Belum ada data penilaian PBB + Danton.</p>
    @endif

    {{-- Variasi + Formasi --}}
    @php
        $vaforData = $juryScores['vafor'] ?? [];
    @endphp
    <div class="sub-section-title">Variasi + Formasi (Vafor)</div>
    @if(count($vaforData) > 0)
        @foreach([1, 2] as $jNum)
        @php $js = $vaforData[$jNum] ?? []; @endphp
        @if($js)
        <table class="audit" style="margin-bottom:8px;">
            <thead>
                <tr>
                    <th>Unsur (Juri {{ $jNum }})</th>
                    <th style="width:55px;text-align:center;">Variasi</th>
                    <th style="width:55px;text-align:center;">Formasi</th>
                    <th style="width:60px;text-align:center;">Danton Vafor</th>
                    <th style="width:55px;text-align:center;background:#A07830;">Total</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $allKeys = collect(array_keys($variasiItems))
                        ->merge(array_keys($formasiItems))
                        ->merge(array_keys($dantonVaforItems))
                        ->unique()
                        ->values()
                        ->toArray();
                @endphp
                @foreach($allKeys as $k)
                @php
                    $label = $variasiItems[$k] ?? $formasiItems[$k] ?? $dantonVaforItems[$k] ?? $k;
                    $a = isset($js['variasi_details'][$k]) && $js['variasi_details'][$k] !== '' ? (int)$js['variasi_details'][$k] : null;
                    $b = isset($js['formasi_details'][$k]) && $js['formasi_details'][$k] !== '' ? (int)$js['formasi_details'][$k] : null;
                    $c = isset($js['danton_vafor_details'][$k]) && $js['danton_vafor_details'][$k] !== '' ? (int)$js['danton_vafor_details'][$k] : null;
                    $total = ($a ?? 0) + ($b ?? 0) + ($c ?? 0);
                @endphp
                <tr>
                    <td>{{ $label }}</td>
                    <td style="text-align:center;">{{ $a !== null ? $a : '-' }}</td>
                    <td style="text-align:center;">{{ $b !== null ? $b : '-' }}</td>
                    <td style="text-align:center;">{{ $c !== null ? $c : '-' }}</td>
                    <td style="text-align:center;font-weight:bold;">{{ $total }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
        @endforeach
    @else
        <p class="no-data">Belum ada data penilaian Variasi & Formasi.</p>
    @endif

    {{-- Kostum + Makeup --}}
    @php
        $makeupData = $juryScores['makeup_kostum'] ?? [];
    @endphp
    <div class="sub-section-title">Kostum + Makeup</div>
    @if(count($makeupData) > 0)
        @foreach([1, 2] as $jNum)
        @php $js = $makeupData[$jNum] ?? []; @endphp
        @if($js)
        <table class="audit" style="margin-bottom:8px;">
            <thead>
                <tr>
                    <th>Unsur (Juri {{ $jNum }})</th>
                    <th style="width:55px;text-align:center;">Kostum</th>
                    <th style="width:55px;text-align:center;">Makeup</th>
                    <th style="width:55px;text-align:center;background:#A07830;">Total</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $allKeys = collect(array_keys($kostumItems))
                        ->merge(array_keys($makeupItems))
                        ->unique()
                        ->values()
                        ->toArray();
                @endphp
                @foreach($allKeys as $k)
                @php
                    $label = $kostumItems[$k] ?? $makeupItems[$k] ?? $k;
                    $a = isset($js['kostum_details'][$k]) && $js['kostum_details'][$k] !== '' ? (int)$js['kostum_details'][$k] : null;
                    $b = isset($js['makeup_details'][$k]) && $js['makeup_details'][$k] !== '' ? (int)$js['makeup_details'][$k] : null;
                    $total = ($a ?? 0) + ($b ?? 0);
                @endphp
                <tr>
                    <td>{{ $label }}</td>
                    <td style="text-align:center;">{{ $a !== null ? $a : '-' }}</td>
                    <td style="text-align:center;">{{ $b !== null ? $b : '-' }}</td>
                    <td style="text-align:center;font-weight:bold;">{{ $total }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
        @endforeach
    @else
        <p class="no-data">Belum ada data penilaian Kostum & Makeup.</p>
    @endif
    @else
    <p class="no-data">Lembar nilai masih dalam bentuk draf. Detail skor akan muncul setelah data disimpan.</p>
    @endif

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis dari Portal Rekap Nilai PASGARDA &mdash; {{ date('d M Y H:i') }}
    </div>
</body>
</html>

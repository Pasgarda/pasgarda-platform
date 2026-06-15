const tiebreakerSort = (arr, fields) => {
    return [...arr].sort((a, b) => {
        for (const f of fields) {
            const diff = parseInt(b[f]) - parseInt(a[f]);
            if (diff !== 0) return diff;
        }
        return 0;
    });
};

export const calculateChampions = (categoryType, contingents = [], scores = [], finalRoundScores = []) => {
    const catContingents = contingents.filter(c => c.category_type === categoryType);

    const scoreCascade = ['pbb', 'danton', 'vafor', 'kostum', 'makeup'];
    const tbCascadePbb = ['pbb', 'tb_pbb_berkumpul_kerapian', 'danton', 'vafor', 'kostum', 'makeup'];
    const tbCascadeDanton = ['danton', 'tb_danton_materi_lapangan', 'pbb', 'vafor', 'kostum', 'makeup'];
    const tbCascadeVafor = ['vafor', 'tb_vafor_detail_penjiwaan', 'pbb', 'danton', 'kostum', 'makeup'];
    const tbCascadeKostum = ['kostumNet', 'tb_kostum_kreativitas_warna', 'kostum', 'pbb', 'danton', 'vafor', 'makeup'];
    const tbCascadeMakeup = ['makeup', 'tb_makeup_kesesuaian_kostum', 'pbb', 'danton', 'vafor', 'kostum'];

    const enriched = catContingents.map(c => {
        let scoreObj = c.score;
        if (!scoreObj && scores) {
            scoreObj = scores.find(s => s.contingent_id === c.id);
        }

        const finalObj = finalRoundScores ? finalRoundScores.find(fs => fs.contingent_id === c.id) : null;

        const pbb = scoreObj ? (parseInt(scoreObj.pbb_score) || 0) : 0;
        const danton = scoreObj ? (parseInt(scoreObj.danton_score) || 0) : 0;
        const vafor = scoreObj ? 
            (parseInt(scoreObj.variasi_score) || 0) + 
            (parseInt(scoreObj.formasi_score) || 0) + 
            (parseInt(scoreObj.danton_vafor_score) || 0) ||
            (parseInt(scoreObj.vafor_score) || 0) : 0;
        const kostum = scoreObj ? (parseInt(scoreObj.kostum_score) || 0) : 0;
        const kostumPenalty = scoreObj ? (parseInt(scoreObj.kostum_penalty) || 0) : 0;
        const kostumNet = kostum - kostumPenalty;
        const makeup = scoreObj ? (parseInt(scoreObj.makeup_score) || 0) : 0;
        const penalties = scoreObj ? (parseInt(scoreObj.penalties_score) || 0) : 0;
        const nilaiKontingenBonus = scoreObj ? (parseInt(scoreObj.nilai_kontingen_bonus) || 0) : 0;

        return {
            ...c,
            scoreObj,
            finalObj,
            pbb,
            danton,
            vafor,
            kostum,
            kostumPenalty,
            kostumNet,
            makeup,
            penalties,
            nilaiKontingenBonus,
            vote_timing: c.vote_last_at ? -Date.parse(c.vote_last_at) : 0,
            merch_timing: c.merch_last_at ? -Date.parse(c.merch_last_at) : 0,
            supporter_timing: c.supporter_last_at ? -Date.parse(c.supporter_last_at) : 0,
            firstRoundTotal: scoreObj ? parseInt(scoreObj.grand_total) : 0,
            juaraScore: pbb + danton + vafor - penalties,
            selectionScore: pbb + danton + vafor + kostumNet + makeup - penalties,
            finalTotal: finalObj ? parseInt(finalObj.total_score) : 0,
            finalPbb: finalObj ? parseInt(finalObj.pbb_score) : 0,
            finalDanton: finalObj ? parseInt(finalObj.danton_score) : 0,
            finalVafor: finalObj ? parseInt(finalObj.vafor_score) : 0,
            finalPenalties: finalObj ? parseInt(finalObj.penalties) : 0,
            votes: c.votes_count || 0,
            supporter: c.supporter_days || 0,
            merch: c.merch_qty || 0,
            likesReels: c.reels_likes || 0,
            likesPosts: c.posts_likes || 0,
            reels_timing: c.social_updated_at ? -Date.parse(c.social_updated_at) : 0,
            posts_timing: c.social_updated_at ? -Date.parse(c.social_updated_at) : 0,
            coach_name: c.coach_name || '',
        };
    });

    const getTeamAtRank = (ranksArray, rankIndex) => {
        return ranksArray[rankIndex] || null;
    };

    let brackets = [];

    if (categoryType === 'U12' || categoryType === 'U16' || categoryType === 'U19') {
        const sortedByFirstRound = tiebreakerSort(enriched, ['juaraScore', ...scoreCascade]).filter(t => t.scoreObj);

        if (categoryType === 'U12') {
            const sortedBySelection = tiebreakerSort(enriched, ['selectionScore', ...scoreCascade]).filter(t => t.scoreObj);
            const champion = getTeamAtRank(sortedBySelection, 0);
            const nonFinalists = sortedByFirstRound;

            const nonRegulerSorted = tiebreakerSort(nonFinalists.filter(t => !t.is_reguler), ['juaraScore', ...scoreCascade]);
            const kejurnasRecipients = nonRegulerSorted.slice(0, 3).map(t => t.id);

            const utamaTeams = nonFinalists.slice(0, 3);
            const utamaIds = new Set(utamaTeams.map(t => t.id));
            const remaining = nonFinalists.filter(t => !utamaIds.has(t.id));

            brackets = [
                { name: 'Juara Umum Garda', team: champion, championScore: champion?.selectionScore ?? 0 },
                { name: 'Utama 1', team: getTeamAtRank(utamaTeams, 0), kejurnasIds: kejurnasRecipients },
                { name: 'Utama 2', team: getTeamAtRank(utamaTeams, 1), kejurnasIds: kejurnasRecipients },
                { name: 'Utama 3', team: getTeamAtRank(utamaTeams, 2), kejurnasIds: kejurnasRecipients },
                { name: 'Harapan 1', team: getTeamAtRank(remaining, 0) },
                { name: 'Harapan 2', team: getTeamAtRank(remaining, 1) },
                { name: 'Harapan 3', team: getTeamAtRank(remaining, 2) },
                { name: 'Madya 1', team: getTeamAtRank(remaining, 3) },
                { name: 'Madya 2', team: getTeamAtRank(remaining, 4) },
                { name: 'Madya 3', team: getTeamAtRank(remaining, 5) },
                { name: 'Bina 1', team: getTeamAtRank(remaining, 6) },
                { name: 'Bina 2', team: getTeamAtRank(remaining, 7) },
                { name: 'Bina 3', team: getTeamAtRank(remaining, 8) },
                { name: 'Mula 1', team: getTeamAtRank(remaining, 9) },
                { name: 'Mula 2', team: getTeamAtRank(remaining, 10) },
                { name: 'Mula 3', team: getTeamAtRank(remaining, 11) },
                { name: 'Purwa 1', team: getTeamAtRank(remaining, 12) }
            ];
            brackets = brackets.map(b => b.isFinal ? b : { ...b, kejurnasIds: [...kejurnasRecipients] });
        } else {
            const sortedBySelection = tiebreakerSort(enriched, ['selectionScore', ...scoreCascade]).filter(t => t.scoreObj);
            const finalists = sortedBySelection.slice(0, 2);

            const sortedFinalists = tiebreakerSort(finalists, ['finalTotal', 'juaraScore', ...scoreCascade]);

            const nonFinalists = sortedByFirstRound;

            const nonRegulerSorted = tiebreakerSort(nonFinalists.filter(t => !t.is_reguler), ['juaraScore', ...scoreCascade]);
            const kejurnasRecipients = nonRegulerSorted.slice(0, 3).map(t => t.id);

            const utamaTeams = nonFinalists.slice(0, 3);
            const utamaIds = new Set(utamaTeams.map(t => t.id));
            const remaining = nonFinalists.filter(t => !utamaIds.has(t.id));

            const makeBrackets = () => {
                if (categoryType === 'U16') {
                    return [
                        { name: 'Juara Grand Final 1 (Juara Umum Garda)', team: getTeamAtRank(sortedFinalists, 0), isFinal: true },
                        { name: 'Juara Grand Final 2', team: getTeamAtRank(sortedFinalists, 1), isFinal: true },
                        { name: 'Utama 1', team: getTeamAtRank(utamaTeams, 0), kejurnasIds: kejurnasRecipients },
                        { name: 'Utama 2', team: getTeamAtRank(utamaTeams, 1), kejurnasIds: kejurnasRecipients },
                        { name: 'Utama 3', team: getTeamAtRank(utamaTeams, 2), kejurnasIds: kejurnasRecipients },
                        { name: 'Harapan 1', team: getTeamAtRank(remaining, 0) },
                        { name: 'Harapan 2', team: getTeamAtRank(remaining, 1) },
                        { name: 'Harapan 3', team: getTeamAtRank(remaining, 2) },
                        { name: 'Madya 1', team: getTeamAtRank(remaining, 3) },
                        { name: 'Madya 2', team: getTeamAtRank(remaining, 4) },
                        { name: 'Madya 3', team: getTeamAtRank(remaining, 5) },
                        { name: 'Bina 1', team: getTeamAtRank(remaining, 6) },
                        { name: 'Bina 2', team: getTeamAtRank(remaining, 7) },
                        { name: 'Bina 3', team: getTeamAtRank(remaining, 8) },
                        { name: 'Mula 1', team: getTeamAtRank(remaining, 9) },
                        { name: 'Mula 2', team: getTeamAtRank(remaining, 10) },
                        { name: 'Mula 3', team: getTeamAtRank(remaining, 11) },
                        { name: 'Purwa 1', team: getTeamAtRank(remaining, 12) },
                        { name: 'Purwa 2', team: getTeamAtRank(remaining, 13) },
                        { name: 'Purwa 3', team: getTeamAtRank(remaining, 14) },
                        { name: 'Caraka 1', team: getTeamAtRank(remaining, 15) },
                        { name: 'Caraka 2', team: getTeamAtRank(remaining, 16) },
                        { name: 'Caraka 3', team: getTeamAtRank(remaining, 17) },
                        { name: 'Wira 1', team: getTeamAtRank(remaining, 18) }
                    ];
                } else {
                    return [
                        { name: 'Juara Grand Final 1 (Juara Umum Garda)', team: getTeamAtRank(sortedFinalists, 0), isFinal: true },
                        { name: 'Juara Grand Final 2', team: getTeamAtRank(sortedFinalists, 1), isFinal: true },
                        { name: 'Utama 1', team: getTeamAtRank(utamaTeams, 0), kejurnasIds: kejurnasRecipients },
                        { name: 'Utama 2', team: getTeamAtRank(utamaTeams, 1), kejurnasIds: kejurnasRecipients },
                        { name: 'Utama 3', team: getTeamAtRank(utamaTeams, 2), kejurnasIds: kejurnasRecipients },
                        { name: 'Harapan 1', team: getTeamAtRank(remaining, 0) },
                        { name: 'Harapan 2', team: getTeamAtRank(remaining, 1) },
                        { name: 'Harapan 3', team: getTeamAtRank(remaining, 2) },
                        { name: 'Madya 1', team: getTeamAtRank(remaining, 3) },
                        { name: 'Madya 2', team: getTeamAtRank(remaining, 4) },
                        { name: 'Madya 3', team: getTeamAtRank(remaining, 5) },
                        { name: 'Bina 1', team: getTeamAtRank(remaining, 6) },
                        { name: 'Bina 2', team: getTeamAtRank(remaining, 7) },
                        { name: 'Bina 3', team: getTeamAtRank(remaining, 8) },
                        { name: 'Mula 1', team: getTeamAtRank(remaining, 9) },
                        { name: 'Mula 2', team: getTeamAtRank(remaining, 10) },
                        { name: 'Mula 3', team: getTeamAtRank(remaining, 11) },
                        { name: 'Purwa 1', team: getTeamAtRank(remaining, 12) },
                        { name: 'Purwa 2', team: getTeamAtRank(remaining, 13) },
                        { name: 'Purwa 3', team: getTeamAtRank(remaining, 14) },
                        { name: 'Caraka 1', team: getTeamAtRank(remaining, 15) },
                        { name: 'Caraka 2', team: getTeamAtRank(remaining, 16) },
                        { name: 'Caraka 3', team: getTeamAtRank(remaining, 17) },
                        { name: 'Wira 1', team: getTeamAtRank(remaining, 18) },
                        { name: 'Wira 2', team: getTeamAtRank(remaining, 19) },
                        { name: 'Wira 3', team: getTeamAtRank(remaining, 20) },
                        { name: 'Potensial 1', team: getTeamAtRank(remaining, 21) },
                        { name: 'Potensial 2', team: getTeamAtRank(remaining, 22) },
                        { name: 'Potensial 3', team: getTeamAtRank(remaining, 23) },
                        { name: 'Perintis 1', team: getTeamAtRank(remaining, 24) },
                        { name: 'Perintis 2', team: getTeamAtRank(remaining, 25) },
                        { name: 'Perintis 3', team: getTeamAtRank(remaining, 26) },
                        { name: 'Siaga 1', team: getTeamAtRank(remaining, 27) }
                    ];
                }
            };

            brackets = makeBrackets();
            brackets = brackets.map(b => b.isFinal ? b : { ...b, kejurnasIds: [...kejurnasRecipients] });
        }
    } else {
        const sortedByJuara = tiebreakerSort(enriched, ['juaraScore', ...scoreCascade]).filter(t => t.scoreObj);
        const nonRegulerSorted = tiebreakerSort(sortedByJuara.filter(t => !t.is_reguler), ['juaraScore', ...scoreCascade]);
        const utamaTeams = sortedByJuara.slice(0, 3);
        const kejurnasRecipients = nonRegulerSorted.slice(0, 3).map(t => t.id);
        const utamaIds = new Set(utamaTeams.map(t => t.id));
        const remaining = sortedByJuara.filter(t => !utamaIds.has(t.id));

        brackets = [
            { name: 'Utama 1', team: getTeamAtRank(utamaTeams, 0), kejurnasIds: kejurnasRecipients },
            { name: 'Utama 2', team: getTeamAtRank(utamaTeams, 1), kejurnasIds: kejurnasRecipients },
            { name: 'Utama 3', team: getTeamAtRank(utamaTeams, 2), kejurnasIds: kejurnasRecipients },
            { name: 'Harapan 1', team: getTeamAtRank(remaining, 0) },
            { name: 'Harapan 2', team: getTeamAtRank(remaining, 1) },
            { name: 'Harapan 3', team: getTeamAtRank(remaining, 2) },
            { name: 'Madya 1', team: getTeamAtRank(remaining, 3) },
            { name: 'Madya 2', team: getTeamAtRank(remaining, 4) },
            { name: 'Madya 3', team: getTeamAtRank(remaining, 5) },
            { name: 'Bina 1', team: getTeamAtRank(remaining, 6) },
            { name: 'Bina 2', team: getTeamAtRank(remaining, 7) },
            { name: 'Bina 3', team: getTeamAtRank(remaining, 8) },
            { name: 'Mula 1', team: getTeamAtRank(remaining, 9) },
            { name: 'Mula 2', team: getTeamAtRank(remaining, 10) },
            { name: 'Mula 3', team: getTeamAtRank(remaining, 11) }
        ];
        brackets = brackets.map(b => b.isFinal ? b : { ...b, kejurnasIds: kejurnasRecipients });
    }

    const sortedByPbb = tiebreakerSort(enriched, tbCascadePbb).filter(t => t.pbb > 0);
    const sortedByVafor = tiebreakerSort(enriched, tbCascadeVafor).filter(t => t.vafor > 0);
    const sortedByDanton = tiebreakerSort(enriched, tbCascadeDanton).filter(t => t.danton > 0);
    const sortedByKostum = tiebreakerSort(enriched, tbCascadeKostum).filter(t => t.kostumNet > 0);
    const sortedByMakeup = tiebreakerSort(enriched, tbCascadeMakeup).filter(t => t.makeup > 0);
    const sortedByReels = tiebreakerSort(enriched, ['likesReels', 'reels_timing']).filter(t => t.likesReels > 0);
    const sortedByPosts = tiebreakerSort(enriched, ['likesPosts', 'posts_timing']).filter(t => t.likesPosts > 0);
    const sortedByJuaraScore = tiebreakerSort(enriched, ['juaraScore', ...scoreCascade]).filter(t => t.juaraScore > 0);
    const sortedByNilaiKontingen = tiebreakerSort(enriched, ['nilaiKontingenBonus', 'vote_timing', ...scoreCascade]).filter(t => t.nilaiKontingenBonus > 0);
    const sortedByMerch = tiebreakerSort(enriched, ['merch', 'merch_timing', 'votes', 'supporter']);
    const sortedByVotes = tiebreakerSort(enriched, ['votes', 'vote_timing', 'supporter', 'merch']);
    const sortedBySupporter = tiebreakerSort(enriched, ['supporter', 'supporter_timing', 'votes', 'merch']);

    const makeAwards = (config) => {
        const { pbbRanks, vaforRanks, dantonRanks, pelatihRanks, kostumRanks, makeupRanks } = config;
        const awards = [];

        for (let i = 0; i < pbbRanks; i++) {
            const label = pbbRanks > 1 ? `PBB Terbaik ${i + 1}` : 'PBB Terbaik';
            awards.push({ name: label, team: getTeamAtRank(sortedByPbb, i), val: getTeamAtRank(sortedByPbb, i)?.pbb });
        }

        for (let i = 0; i < vaforRanks; i++) {
            const label = vaforRanks > 1 ? `Variasi dan Formasi Terbaik ${i + 1}` : 'Variasi dan Formasi Terbaik';
            awards.push({ name: label, team: getTeamAtRank(sortedByVafor, i), val: getTeamAtRank(sortedByVafor, i)?.vafor });
        }

        for (let i = 0; i < dantonRanks; i++) {
            const label = dantonRanks > 1 ? `Danton Terbaik ${i + 1}` : 'Danton Terbaik';
            awards.push({ name: label, team: getTeamAtRank(sortedByDanton, i), val: getTeamAtRank(sortedByDanton, i)?.danton });
        }

        for (let i = 0; i < pelatihRanks; i++) {
            const label = pelatihRanks > 1 ? `Pelatih Terbaik ${i + 1}` : 'Pelatih Terbaik';
            const team = getTeamAtRank(sortedByJuaraScore, i);
            awards.push({
                name: label,
                team,
                isCoach: true,
                val: team?.juaraScore,
            });
        }

        for (let i = 0; i < kostumRanks; i++) {
            const label = kostumRanks > 1 ? `Kostum Terbaik ${i + 1}` : 'Kostum Terbaik';
            awards.push({ name: label, team: getTeamAtRank(sortedByKostum, i), val: getTeamAtRank(sortedByKostum, i)?.kostumNet });
        }

        for (let i = 0; i < makeupRanks; i++) {
            const label = makeupRanks > 1 ? `Make Up Terbaik ${i + 1}` : 'Make Up Terbaik';
            awards.push({ name: label, team: getTeamAtRank(sortedByMakeup, i), val: getTeamAtRank(sortedByMakeup, i)?.makeup });
        }

        awards.push(
            { name: 'Sponsor Terbaik', team: getTeamAtRank(sortedByMerch, 0), metricLabel: 'Pcs Merch', val: getTeamAtRank(sortedByMerch, 0)?.merch },
            { name: 'Kontingen Terbaik', team: getTeamAtRank(sortedByVotes, 0), metricLabel: 'Suara', val: getTeamAtRank(sortedByVotes, 0)?.votes },
            { name: 'Kreator Tervaforit', team: getTeamAtRank(sortedByReels, 0), metricLabel: 'Likes', val: getTeamAtRank(sortedByReels, 0)?.likesReels },
            { name: 'Peserta Terfavorit', team: getTeamAtRank(sortedByPosts, 0), metricLabel: 'Likes', val: getTeamAtRank(sortedByPosts, 0)?.likesPosts },
            { name: 'Supporter Terbaik', team: getTeamAtRank(sortedBySupporter, 0), metricLabel: 'Tiket Online', val: getTeamAtRank(sortedBySupporter, 0)?.supporter }
        );

        return awards;
    };

    let awards = [];
    if (categoryType === 'U12') {
        awards = makeAwards({
            pbbRanks: 3, vaforRanks: 3, dantonRanks: 1,
            pelatihRanks: 1, kostumRanks: 1, makeupRanks: 1
        });
    } else if (categoryType === 'U16') {
        awards = makeAwards({
            pbbRanks: 3, vaforRanks: 3, dantonRanks: 3,
            pelatihRanks: 3, kostumRanks: 3, makeupRanks: 3
        });
    } else if (categoryType === 'U19') {
        const baseAwards = makeAwards({
            pbbRanks: 5, vaforRanks: 5, dantonRanks: 3,
            pelatihRanks: 3, kostumRanks: 3, makeupRanks: 3
        });
        awards = baseAwards;
    } else {
        awards = makeAwards({
            pbbRanks: 3, vaforRanks: 3, dantonRanks: 1,
            pelatihRanks: 1, kostumRanks: 1, makeupRanks: 1
        });
    }

    return { brackets, awards };
};

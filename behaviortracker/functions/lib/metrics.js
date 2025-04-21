"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDailyMetrics = computeDailyMetrics;
exports.generateRecommendations = generateRecommendations;
/**
 * Compute the 14 period metrics + daily score
 */
function computeDailyMetrics(docs) {
    // 1) Group by timeBucket
    const buckets = { morning: [], afternoon: [], evening: [], night: [] };
    docs.forEach(d => buckets[d.timeBucket].push(d));
    // 2) For each bucket calculate your 14 metrics
    const periodMetrics = Object.fromEntries(Object.entries(buckets).map(([period, arr]) => [
        period,
        {
            simple: {
                totalMin: arr.reduce((s, x) => s + x.durMin, 0),
                sessionCount: arr.length,
                avgLen: arr.length ? arr.reduce((s, x) => s + x.durMin, 0) / arr.length : 0,
                moodLiftPct: arr.filter(x => x.moodDelta > 0).length / (arr.length || 1),
                highProdPct: arr.filter(x => x.prodSelf >= 4 || x.yResearch).length / (arr.length || 1),
                activePct: arr.filter(x => x.activeFlag).length / (arr.length || 1),
                topTrigger: (() => {
                    const freq = {};
                    arr.forEach(x => x.triggers.forEach((t) => freq[t] = (freq[t] || 0) + 1));
                    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
                })(),
            },
            diagnostic: {
                triggerDistraction: arr.filter(x => ['boredom', 'habit'].includes(x.triggers[0]) && x.prodSelf <= 2).length / (arr.length || 1),
                notificationHoleRate: arr.filter(x => x.triggers.includes('notification') && x.durMin > 10).length / (arr.filter(x => x.triggers.includes('notification')).length || 1),
                goalAchievement: arr.filter(x => x.yResearch).length / (arr.length || 1),
                moodVolatility: Math.sqrt(arr.reduce((s, x) => s + Math.pow(x.moodDelta - (arr.reduce((ss, yy) => ss + yy.moodDelta, 0) / arr.length), 2), 0) / (arr.length || 1)),
                bedtimeDoomMin: period === 'night' ? arr.filter(x => x.loc === 'bed' && x.moodDelta < 0).reduce((s, x) => s + x.durMin, 0) : 0,
                engagementDiversity: (() => {
                    const counts = Object.keys(arr[0]?.engagement || {}).map(key => arr.filter(x => x.engagement[key]).length);
                    const p = counts.map(c => c / (arr.length || 1));
                    return p.reduce((s, pi) => pi > 0 ? s - pi * Math.log2(pi) : s, 0) / Math.log2(counts.length);
                })(),
                contentMoodCorr: 0 // placeholder
            }
        }
    ]));
    // 3) Daily weighted mean and penalties
    const totalMin = docs.reduce((s, d) => s + d.durMin, 0);
    const raw100 = 100 * docs.reduce((s, d) => s + d.sessionScore * d.durMin, 0) / (totalMin || 1);
    const overMin = Math.max(0, totalMin - docs[0].goalPhoneMin);
    const penaltyA = 30 * overMin / (docs[0].goalPhoneMin || 1);
    const unprodMin = docs.filter(d => !d.yResearch).reduce((s, d) => s + d.durMin, 0);
    const allowed = (docs[0].unprodTolerancePct / 100) * totalMin;
    const penaltyB = 20 * Math.max(0, unprodMin - allowed) / (docs[0].goalPhoneMin || 1);
    const finalScore = Math.max(0, Math.min(100, raw100 - penaltyA - penaltyB));
    return { period: periodMetrics, totalMin, raw100, penaltyA, penaltyB, finalScore };
}
/**
 * Simple rule‑engine or ML placeholder
 */
function generateRecommendations(daily) {
    const tips = [];
    if (daily.period.night.simple.totalMin > 60) {
        tips.push('Limit late‑night scrolling to under 60 min.');
    }
    if (daily.finalScore < 50) {
        tips.push('Try fruitful tasks first (e.g. LinkedIn) to boost your score.');
    }
    return tips;
}

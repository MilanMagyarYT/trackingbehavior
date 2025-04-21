"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyDigest = void 0;
exports.runNightlyLogic = runNightlyLogic;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const resend_1 = require("resend");
const metrics_1 = require("./metrics");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Initialize Resend SDK with API key from functions config
const resendKey = functions.config().resend?.key;
if (!resendKey) {
    throw new Error('Missing Resend API key. Run:\n' +
        'firebase functions:config:set resend.key="YOUR_RESEND_API_KEY"');
}
const resend = new resend_1.Resend(resendKey);
/**
 * Core logic to compute metrics and send emails
 */
async function runNightlyLogic() {
    // 1) Compute yesterday's window
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 1);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    // 2) Fetch all sessions from yesterday
    const snap = await db
        .collectionGroup('sessions')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(endDate))
        .get();
    // 3) Bucket by user ID
    const userBuckets = {};
    snap.forEach(docSnap => {
        const uid = docSnap.ref.parent.parent?.id;
        if (!uid)
            return;
        userBuckets[uid] || (userBuckets[uid] = []);
        userBuckets[uid].push(docSnap.data());
    });
    // 4) Process each user
    await Promise.all(Object.entries(userBuckets).map(async ([uid, docs]) => {
        const daily = (0, metrics_1.computeDailyMetrics)(docs);
        const recs = (0, metrics_1.generateRecommendations)(daily);
        // 5) Write summary to Firestore
        const dateKey = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
        await db
            .doc(`users/${uid}/dailyMetrics/${dateKey}`)
            .set({ ...daily, recommendations: recs, generatedAt: admin.firestore.Timestamp.now() }, { merge: true });
        // 6) Fetch user email and send the digest
        const userSnap = await db.doc(`users/${uid}`).get();
        const email = userSnap.get('authEmail');
        if (typeof email !== 'string')
            return;
        await resend.emails.send({
            from: 'Reports <reports@your-domain.com>',
            to: email,
            subject: `Your Daily Score • ${Math.round(daily.finalScore)}/100`,
            html: `
          <h2>Your score for ${dateKey}: ${Math.round(daily.finalScore)}/100</h2>
          <h3>Top Tips:</h3>
          <ul>
            ${recs.map((tip) => `<li>${tip}</li>`).join('')}
          </ul>
        `,
        });
    }));
}
/**
 * HTTP endpoint to trigger the nightly digest logic
 */
exports.nightlyDigest = functions.https.onRequest(async (req, res) => {
    try {
        await runNightlyLogic();
        res.status(200).send('Nightly digest completed ✅');
    }
    catch (err) {
        console.error('Nightly digest error:', err);
        res.status(500).send('Error: ' + err.message);
    }
});

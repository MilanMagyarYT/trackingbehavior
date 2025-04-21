"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyDigest = void 0;
// functions/src/nightly.ts
var functions = require("firebase-functions");
var admin = require("firebase-admin");
var resend_1 = require("resend"); // 👈 new
var metrics_1 = require("./metrics");
admin.initializeApp();
var db = admin.firestore();
// Initialize Resend with your API key in functions config
var resendKey = functions.config().resend.key;
if (!resendKey) {
    throw new Error('Resend API key not configured. Run:\n' +
        'firebase functions:config:set resend.key="YOUR_KEY"');
}
var resend = new resend_1.Resend(resendKey);
exports.nightlyDigest = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('UTC')
    .onRun(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // … same logic to fetch & compute …
            return [4 /*yield*/, Promise.all(Object.entries(userBuckets).map(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var daily, recs, dateKey, userSnap, email;
                    var uid = _b[0], docs = _b[1];
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                daily = (0, metrics_1.computeDailyMetrics)(docs);
                                recs = (0, metrics_1.generateRecommendations)(daily);
                                dateKey = start.toISOString().slice(0, 10);
                                // write dailyMetrics as before
                                return [4 /*yield*/, db
                                        .doc("users/".concat(uid, "/dailyMetrics/").concat(dateKey))
                                        .set(__assign(__assign({}, daily), { recommendations: recs, generatedAt: admin.firestore.Timestamp.now() }), { merge: true })];
                            case 1:
                                // write dailyMetrics as before
                                _c.sent();
                                return [4 /*yield*/, db.doc("users/".concat(uid)).get()];
                            case 2:
                                userSnap = _c.sent();
                                email = userSnap.get('authEmail');
                                if (typeof email !== 'string')
                                    return [2 /*return*/];
                                // send via Resend
                                return [4 /*yield*/, resend.emails.send({
                                        from: 'Reports <reports@your-domain.com>',
                                        to: email,
                                        subject: "Your Daily Score \u2022 ".concat(Math.round(daily.finalScore), "/100"),
                                        html: "\n            <h2>Your score for ".concat(dateKey, ": ").concat(Math.round(daily.finalScore), "/100</h2>\n            <p>Top tips:</p>\n            <ul>").concat(recs.map(function (t) { return "<li>".concat(t, "</li>"); }).join(''), "</ul>\n          "),
                                    })];
                            case 3:
                                // send via Resend
                                _c.sent();
                                return [2 /*return*/];
                        }
                    });
                }); }))];
            case 1:
                // … same logic to fetch & compute …
                _a.sent();
                console.log('nightlyDigest (Resend) completed');
                return [2 /*return*/, null];
        }
    });
}); });

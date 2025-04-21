"use strict";
// functions/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyDigest = void 0;
// If you wrote your scheduled job in nightly.ts:
var nightly_1 = require("./nightly");
Object.defineProperty(exports, "nightlyDigest", { enumerable: true, get: function () { return nightly_1.nightlyDigest; } });
// (Optionally) export additional functions here as needed

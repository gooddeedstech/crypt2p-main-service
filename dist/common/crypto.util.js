"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmacSha256Hex = hmacSha256Hex;
exports.safeTimingEqual = safeTimingEqual;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.hashToken = hashToken;
exports.randomNumericCode = randomNumericCode;
exports.randomToken = randomToken;
const crypto = __importStar(require("crypto"));
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
function hmacSha256Hex(secret, raw) {
    return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}
function safeTimingEqual(a, b) {
    const s1 = Buffer.from(a);
    const s2 = Buffer.from(b);
    if (s1.length !== s2.length)
        return false;
    return crypto.timingSafeEqual(s1, s2);
}
async function hashPassword(pw) { return argon2.hash(pw, { type: argon2.argon2id }); }
async function verifyPassword(hash, pw) { return argon2.verify(hash, pw); }
function hashToken(token) { return (0, crypto_1.createHash)('sha256').update(token).digest('hex'); }
function randomNumericCode(len = 6) {
    const digits = '0123456789';
    let out = '';
    for (let i = 0; i < len; i++)
        out += digits[Math.floor(Math.random() * digits.length)];
    return out;
}
function randomToken(len = 48) {
    return (0, crypto_1.randomBytes)(len).toString('base64url');
}
//# sourceMappingURL=crypto.util.js.map
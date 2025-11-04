"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
let FraudService = class FraudService {
    evaluateNameMatch(expectedFullName, returnedAcctName) {
        const expected = expectedFullName.toLowerCase().trim();
        const actual = returnedAcctName.toLowerCase().trim();
        const expectedParts = expected.split(/\s+/); // split by space or multiple spaces
        let matchCount = 0;
        for (const part of expectedParts) {
            if (actual.includes(part)) {
                matchCount++;
            }
        }
        const matchPercent = Math.round((matchCount / expectedParts.length) * 100);
        // ✅ Compute risk scoring
        const ok = matchPercent >= 50;
        const severity = matchPercent >= 80 ? 'low'
            : matchPercent >= 50 ? 'medium'
                : 'high';
        const riskScore = 100 - matchPercent;
        return {
            matchPercent,
            ok,
            severity,
            riskScore,
            reason: matchPercent < 50
                ? 'Significant mismatch between names'
                : matchPercent < 80
                    ? 'Minor mismatch — may need manual review'
                    : 'Good match',
        };
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = __decorate([
    (0, common_1.Injectable)()
], FraudService);
//# sourceMappingURL=fraud.service.js.map
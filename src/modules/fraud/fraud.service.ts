import { Injectable } from '@nestjs/common';

@Injectable()
export class FraudService {

  evaluateNameMatch(expectedFullName: string, returnedAcctName: string) {
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
      reason:
        matchPercent < 50
          ? 'Significant mismatch between names'
          : matchPercent < 80
          ? 'Minor mismatch — may need manual review'
          : 'Good match',
    };
  }
}
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

interface PaystackBank {
  name: string;
  code: string;
  slug?: string;
}

interface RubiesBank {
  bankName: string;
  bankCode: string;
}

const BANK_CODE_OVERRIDES: Record<string, string> = {
  '999992': '100004', // OPay → PAYCOM
  '000008': '999991', // Polaris Bank → POLARISBANK
  '000023': '999994', // Providus → TESTBANK (if sandbox)
  '058': '000013',
};

@Injectable()
export class RubiesBankMapperService {
  private readonly logger = new Logger(RubiesBankMapperService.name);
  private readonly paystackUrl = 'https://api.paystack.co/bank?country=nigeria';
  private readonly rubiesUrl = 'https://api-sme-dev.rubies.ng/dev/baas-transaction/bank-list';
  private readonly apiKey = process.env.RUBIES_SECRET_KEY!;

  private rubiesBanks: RubiesBank[] = [];
  private paystackBanks: PaystackBank[] = [];
  private bankMapCache = new Map<string, { rubiesCode: string; rubiesName: string }>();

  constructor(private readonly http: HttpService) {}

  /** ✅ Normalize bank names for fuzzy matching */
  private normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\(.*?\)/g, '') // remove brackets
    .replace(/\b(LIMITED|LTD|MICROFINANCE|MFB|BANK|PLC|DIGITAL|SERVICES|NIGERIA|INC)\b/g, '')
    .replace(/[^A-Z0-9]/g, '') // keep only alphanumerics
    .trim();
  }


  private stringSimilarity(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  const bigrams = (str: string) => {
    const s = str.toUpperCase();
    const pairs: string[] = [];
    for (let i = 0; i < s.length - 1; i++) pairs.push(s.slice(i, i + 2));
    return pairs;
  };
  const pairsA = bigrams(a);
  const pairsB = bigrams(b);
  const intersection = pairsA.filter((p) => pairsB.includes(p)).length;
  return (2.0 * intersection) / (pairsA.length + pairsB.length);
}

/** 🧩 Smart matching between Paystack & Rubies */
private findRubiesMatch(paystackName: string): RubiesBank | undefined {
  const normalizedPaystack = this.normalizeName(paystackName);

  // 1️⃣ Direct equal name match
  let match = this.rubiesBanks.find(
    (rb) => this.normalizeName(rb.bankName) === normalizedPaystack,
  );
  if (match) return match;

  // 2️⃣ Substring inclusion
  match = this.rubiesBanks.find((rb) => {
    const rubiesNorm = this.normalizeName(rb.bankName);
    return (
      rubiesNorm.includes(normalizedPaystack) ||
      normalizedPaystack.includes(rubiesNorm)
    );
  });
  if (match) return match;

  // 3️⃣ Starts/Ends with check
  match = this.rubiesBanks.find((rb) => {
    const rubiesNorm = this.normalizeName(rb.bankName);
    return (
      normalizedPaystack.startsWith(rubiesNorm) ||
      normalizedPaystack.endsWith(rubiesNorm) ||
      rubiesNorm.startsWith(normalizedPaystack) ||
      rubiesNorm.endsWith(normalizedPaystack)
    );
  });
  if (match) return match;

  // 4️⃣ Shared word overlap (e.g. "UNION BANK" vs "UNION BANK OF NIGERIA")
  const paystackWords = normalizedPaystack.split(/[^A-Z]/).filter(Boolean);
  for (const rb of this.rubiesBanks) {
    const rubiesWords = this.normalizeName(rb.bankName)
      .split(/[^A-Z]/)
      .filter(Boolean);
    const overlap = paystackWords.filter((w) => rubiesWords.includes(w)).length;
    if (overlap >= 2) return rb; // at least 2 words overlap
  }

  // 5️⃣ Fuzzy similarity ratio
  let bestMatch: { bank: RubiesBank; score: number } | null = null;
  for (const rb of this.rubiesBanks) {
    const score = this.stringSimilarity(normalizedPaystack, this.normalizeName(rb.bankName));
    if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { bank: rb, score };
    }
  }
  if (bestMatch) {
    this.logger.log(
      `🧠 Fuzzy match (${(bestMatch.score * 100).toFixed(1)}%): ${paystackName} → ${bestMatch.bank.bankName}`,
    );
    return bestMatch.bank;
  }

  return undefined;
}

  /** 🔄 Load Rubies & Paystack bank lists */
  async loadBanks() {
    try {
      const rubiesRes = await firstValueFrom(
        this.http.post(
          this.rubiesUrl,
          { readAll: 'YES' },
          {
            headers: {
              Authorization: this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.rubiesBanks = rubiesRes.data?.data || [];
      this.logger.log(`✅ Loaded ${this.rubiesBanks.length} Rubies banks`);

      const paystackRes = await firstValueFrom(
        this.http.get(this.paystackUrl, {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        }),
      );

      this.paystackBanks = paystackRes.data?.data || [];
      this.logger.log(`✅ Loaded ${this.paystackBanks.length} Paystack banks`);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      this.logger.error(`❌ Failed to load banks: ${msg}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Unable to load bank data',
        error: msg,
      });
    }
  }

  /** 🔍 Find Rubies code by Paystack code */
  async getRubiesBankCode(paystackCode: string) {
    try {
      // ✅ Use cache first
      if (this.bankMapCache.has(paystackCode)) {
        return this.bankMapCache.get(paystackCode)!;
      }

      // ✅ Manual override first
      if (BANK_CODE_OVERRIDES[paystackCode]) {
        const rubiesCode = BANK_CODE_OVERRIDES[paystackCode];
        const rubiesName =
          this.rubiesBanks.find((b) => b.bankCode === rubiesCode)?.bankName ||
          '';
        this.bankMapCache.set(paystackCode, { rubiesCode, rubiesName });

        this.logger.log(`🔁 Override match: Paystack(${paystackCode}) → Rubies(${rubiesCode})`);
        return { paystackCode, rubiesCode, rubiesName };
      }

      // ✅ Load data if empty
      if (!this.rubiesBanks.length || !this.paystackBanks.length) {
        await this.loadBanks();
      }

      const paystackBank = this.paystackBanks.find((b) => b.code === paystackCode);
      if (!paystackBank) {
        throw new RpcException({
          statusCode: 404,
          message: `Paystack bank code ${paystackCode} not found`,
        });
      }

      const normalizedPaystackName = this.normalizeName(paystackBank.name);

     const match = this.findRubiesMatch(paystackBank.name);

      if (!match) {
        this.logger.warn(`⚠️ No Rubies match for ${paystackBank.name} (${paystackCode})`);
        throw new RpcException({
          statusCode: 404,
          message: `No Rubies match found for ${paystackBank.name}`,
        });
      }

      const result = {
        paystackCode,
        paystackName: paystackBank.name,
        rubiesCode: match.bankCode,
        rubiesName: match.bankName,
      };

      this.bankMapCache.set(paystackCode, {
        rubiesCode: match.bankCode,
        rubiesName: match.bankName,
      });

      this.logger.log(
        `🔁 Mapped ${paystackBank.name}: Paystack(${paystackCode}) → Rubies(${match.bankCode})`,
      );

      return result;
    } catch (error: any) {
      if (error instanceof RpcException) throw error;

      const msg = error.message || 'Mapping failed';
      this.logger.error(`❌ Rubies mapping error: ${msg}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Internal error while mapping bank',
        error: msg,
      });
    }
  }

  /** 🧾 Get all mapped banks */
async getAllMappedBanks() {
  try {
    if (!this.rubiesBanks.length || !this.paystackBanks.length) {
      await this.loadBanks();
    }

    const results = [];
    let foundCount = 0;
    let notFoundCount = 0;

    for (const pb of this.paystackBanks) {
      const match = this.findRubiesMatch(pb.name);

      if (match) {
        foundCount++;
        const similarity = this.stringSimilarity(
          this.normalizeName(pb.name),
          this.normalizeName(match.bankName),
        );

        results.push({
          paystackName: pb.name,
          paystackCode: pb.code,
          rubiesCode: match.bankCode,
          rubiesName: match.bankName,
          confidence: similarity.toFixed(2),
        });
      } else {
        notFoundCount++;
        results.push({
          paystackName: pb.name,
          paystackCode: pb.code,
          rubiesCode: 'NOT_FOUND',
          rubiesName: 'NOT_FOUND',
          confidence: '0.00',
        });
      }
    }


    return {
      total: this.paystackBanks.length,
      found: foundCount,
      notFound: notFoundCount,
      updatedAt: new Date().toISOString(),
      mappings: results.sort((a, b) => Number(b.confidence) - Number(a.confidence)), // sort by quality
    };
  } catch (error: any) {
    const msg = error.message || 'Error building mapping list';
    this.logger.error(`❌ getAllMappedBanks error: ${msg}`);
    throw new RpcException({
      statusCode: 500,
      message: 'Unable to fetch mapping list',
      error: msg,
    });
  }
}
}
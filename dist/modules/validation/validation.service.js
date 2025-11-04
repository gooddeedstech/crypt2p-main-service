"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const validation_log_entity_1 = require("../../entities/validation-log.entity");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const fraud_service_1 = require("../fraud/fraud.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let ValidationService = ValidationService_1 = class ValidationService {
    constructor(logRepo, audit, fraud) {
        this.logRepo = logRepo;
        this.audit = audit;
        this.fraud = fraud;
        this.logger = new common_1.Logger(ValidationService_1.name);
        this.cachedBanks = null;
        this.cacheExpiry = 0;
    }
    async writeValidationLog(type, dto, result) {
        await this.logRepo.save({
            validationType: type,
            requestData: dto,
            response: result,
        });
    }
    async getBanks(country = 'nigeria') {
        if (this.cachedBanks && this.cacheExpiry > Date.now()) {
            return this.cachedBanks;
        }
        try {
            const res = await axios_1.default.get(`https://api.paystack.co/bank?country=${country}`, {
                headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
            });
            const banks = res.data.data;
            this.cachedBanks = banks;
            this.cacheExpiry = Date.now() + 1000 * 60 * 60;
            // async log
            // ✅ inside getBanks()
            this.audit.write({
                actorId: 'system',
                actorType: audit_log_entity_1.ActorType.SYSTEM,
                action: 'BANKS_GET',
                responseData: banks,
            });
            return banks;
        }
        catch (err) {
            this.logger.error('Error fetching banks', err.response?.data);
            throw new common_1.HttpException('Failed to retrieve bank list', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async verifyAccount(bankCode, accountNumber, actor) {
        try {
            console.log(`${process.env.PAYSTACK_SECRET_KEY}`);
            const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
            const res = await axios_1.default.get(url, {
                headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
            });
            const result = res.data;
            // ✅ Write audit for compliance history 
            this.audit.write({
                actorId: actor?.id ?? 'system',
                actorType: actor?.type ?? audit_log_entity_1.ActorType.SYSTEM,
                action: 'ACCOUNT_VERIFY',
                targetId: accountNumber,
                requestPayload: { bankCode },
                responseData: result,
            });
            // ✅ Also persist validation log for analytics
            this.writeValidationLog('ACCOUNT_VERIFY', { bankCode, accountNumber }, result);
            return result;
        }
        catch (err) {
            const errMsg = err.response?.data?.message ?? 'Account verification failed';
            throw new common_1.HttpException(errMsg, err.response?.status ?? common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async verifyBVNWithAccount(dto, actor) {
        const { bvn, accountNumber, bankCode, firstName, lastName } = dto;
        const expectedName = `${firstName} ${lastName}`.trim();
        try {
            const payload = {
                country: 'NG',
                type: 'bank_account',
                account_number: accountNumber,
                bvn,
                bank_code: bankCode,
                first_name: firstName,
                last_name: lastName,
            };
            console.log(JSON.stringify(actor));
            const url = actor?.customerCode
                ? `https://api.paystack.co/customer/${actor.customerCode}/identification`
                : `https://api.paystack.co/bank/resolve_bvn/${bvn}`; // ✅ fallback for development
            const res = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const result = res?.data?.data;
            const actualName = result?.account_name?.trim();
            // ✅ Local fraud check
            const nameMatch = this.fraud.evaluateNameMatch(expectedName, actualName);
            const response = {
                status: true,
                message: 'BVN Verified Successfully ✅',
                verified: true,
                provider: 'paystack',
                bvn,
                accountNumber,
                bankCode,
                expectedName,
                actualName,
                matchPercent: nameMatch.matchPercent,
                fraud: nameMatch,
                requiresCustomerCode: !actor?.customerCode, // ✅ show missing upgrade requirement
                timestamp: new Date(),
            };
            await this.audit.write({
                actorId: actor?.id ?? 'system',
                actorType: actor?.type ?? audit_log_entity_1.ActorType.SYSTEM,
                action: 'BVN_VERIFY',
                targetId: bvn,
                requestPayload: dto,
                responseData: response,
            });
            await this.writeValidationLog('BVN_VERIFY', dto, response);
            return response;
        }
        catch (err) {
            this.logger.error('[BVN_VERIFY ERROR]', err?.response?.data || err);
            throw new common_1.HttpException(err.response?.data?.message || 'BVN verification failed', err.response?.status ?? common_1.HttpStatus.BAD_GATEWAY);
        }
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = ValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(validation_log_entity_1.ValidationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_log_service_1.AuditLogService,
        fraud_service_1.FraudService])
], ValidationService);
//# sourceMappingURL=validation.service.js.map
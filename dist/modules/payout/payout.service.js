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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payout_entity_1 = require("../../entities/payout.entity");
const user_entity_1 = require("../../entities/user.entity");
let PayoutService = class PayoutService {
    constructor(payouts, users) {
        this.payouts = payouts;
        this.users = users;
        this.http = axios_1.default.create({
            baseURL: 'https://api.paystack.co',
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
        });
    }
    async ensureRecipient(user) {
        const res = await this.http.post('/transferrecipient', {
            type: 'nuban',
            name: user.fullName || 'Crypt2P User',
            account_number: user.bankAccountNo,
            bank_code: user.bankCode,
            currency: 'NGN',
        });
        return res.data?.data?.recipient_code;
    }
    async sendToBank(params) {
        const user = await this.users.findOne({ where: { id: params.userId } });
        if (!user?.bankAccountNo || !user.bankCode)
            throw new Error('Missing bank details');
        const recipient = await this.ensureRecipient(user);
        const init = await this.http.post('/transfer', {
            source: 'balance',
            amount: Math.round(params.amountNgn * 100),
            recipient,
            reason: params.narration,
        });
        const paystackRef = init.data?.data?.reference;
        return this.payouts.save(this.payouts.create({
            userId: user.id, depositId: 'SET_BY_CALLER', amountNgn: String(params.amountNgn), paystackRef, status: 'PROCESSING'
        }));
    }
};
exports.PayoutService = PayoutService;
exports.PayoutService = PayoutService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payout_entity_1.Payout)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PayoutService);
//# sourceMappingURL=payout.service.js.map
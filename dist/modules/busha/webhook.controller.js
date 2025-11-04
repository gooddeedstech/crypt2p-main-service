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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BushaWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const webhook_event_entity_1 = require("../../entities/webhook-event.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const deposit_entity_1 = require("../../entities/deposit.entity");
const crypto_util_1 = require("../../common/crypto.util");
const notify_service_1 = require("../notify/notify.service");
const trades_service_1 = require("../trades/trades.service");
const payout_service_1 = require("../payout/payout.service");
const user_entity_1 = require("../../entities/user.entity");
const ledger_entity_1 = require("../../entities/ledger.entity");
let BushaWebhookController = class BushaWebhookController {
    constructor(events, wallets, deposits, users, ledger, notify, trades, payout) {
        this.events = events;
        this.wallets = wallets;
        this.deposits = deposits;
        this.users = users;
        this.ledger = ledger;
        this.notify = notify;
        this.trades = trades;
        this.payout = payout;
    }
    verify(raw, sig) {
        const calc = (0, crypto_util_1.hmacSha256Hex)(process.env.BUSHA_WEBHOOK_SECRET, raw);
        if (calc !== sig)
            throw new Error('Invalid signature');
    }
    async handle(req, signature, payload) {
        this.verify(req.rawBody, signature || '');
        const event = await this.events.save(this.events.create({
            provider: 'busha', eventType: payload?.type || 'unknown', payload, signature, status: 'RECEIVED'
        }));
        if (payload?.type === 'deposit.confirmed') {
            const d = payload.data;
            const address = d.address;
            const txHash = d.txHash || d.hash;
            const asset = d.asset;
            const amount = d.amount;
            const network = d.network;
            const wallet = await this.wallets.findOne({ where: { address }, relations: ['user'] });
            if (!wallet) {
                await this.events.update({ id: event.id }, { status: 'IGNORED' });
                return { ignored: true };
            }
            let deposit = await this.deposits.findOne({ where: { txHash } });
            if (!deposit) {
                deposit = await this.deposits.save(this.deposits.create({
                    userId: wallet.user.id, asset, network, txHash, amountAsset: String(amount), status: 'CONFIRMED', bushaRef: d.id || null
                }));
            }
            else {
                deposit.confirmations = 1;
                deposit.status = 'CONFIRMED';
                await this.deposits.save(deposit);
            }
            await this.notify.publish('deposit.confirmed', { userId: deposit.userId, txHash, asset, amount });
            await this.notify.callback('deposit.confirmed', { userId: deposit.userId, txHash, asset, amount });
            const { estNgn, quoteId } = await this.trades.quote({ asset, amount: String(deposit.amountAsset), to: 'NGN' });
            await this.trades.exec(quoteId);
            await this.ledger.save([
                this.ledger.create({ userId: deposit.userId, type: 'CREDIT_DEPOSIT', currency: asset, amount: String(deposit.amountAsset), meta: { txHash } }),
                this.ledger.create({ userId: deposit.userId, type: 'FX', currency: 'NGN', amount: String(estNgn), meta: { quoteId } }),
            ]);
            const user = await this.users.findOne({ where: { id: deposit.userId } });
            const payout = await this.payout.sendToBank({ userId: user.id, amountNgn: Number(estNgn), narration: `Crypt2P—${asset}→NGN ${txHash?.slice(0, 8)}` });
            deposit.amountNgn = String(estNgn);
            deposit.status = 'SETTLED';
            await this.deposits.save(deposit);
            await this.events.update({ id: event.id }, { status: 'PROCESSED' });
            await this.notify.publish('deposit.settled', { userId: deposit.userId, depositId: deposit.id, payoutId: payout.id, amountNgn: estNgn });
            await this.notify.callback('deposit.settled', { userId: deposit.userId, depositId: deposit.id, payoutId: payout.id, amountNgn: estNgn });
            return { ok: true };
        }
        return { ok: true };
    }
};
exports.BushaWebhookController = BushaWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-busha-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BushaWebhookController.prototype, "handle", null);
exports.BushaWebhookController = BushaWebhookController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('busha/webhook'),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_event_entity_1.WebhookEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(deposit_entity_1.Deposit)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(ledger_entity_1.LedgerEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notify_service_1.NotifyService,
        trades_service_1.TradesService,
        payout_service_1.PayoutService])
], BushaWebhookController);
//# sourceMappingURL=webhook.controller.js.map
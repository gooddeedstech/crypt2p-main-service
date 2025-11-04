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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payout = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const deposit_entity_1 = require("./deposit.entity");
let Payout = class Payout {
};
exports.Payout = Payout;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Payout.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payout.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, u => u.payouts, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Payout.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payout.prototype, "depositId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => deposit_entity_1.Deposit, d => d.id, { onDelete: 'CASCADE' }),
    __metadata("design:type", deposit_entity_1.Deposit)
], Payout.prototype, "deposit", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 38, scale: 2 }),
    __metadata("design:type", String)
], Payout.prototype, "amountNgn", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], Payout.prototype, "paystackRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PROCESSING' }),
    __metadata("design:type", String)
], Payout.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "failureReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Payout.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Payout.prototype, "updatedAt", void 0);
exports.Payout = Payout = __decorate([
    (0, typeorm_1.Entity)('payouts')
], Payout);
//# sourceMappingURL=payout.entity.js.map
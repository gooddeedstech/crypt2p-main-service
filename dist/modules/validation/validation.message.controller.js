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
var ValidationMessageController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMessageController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const validation_service_1 = require("./validation.service");
const verify_account_dto_1 = require("./dtos/verify-account.dto");
const verify_bank_dto_1 = require("./dtos/verify-bank.dto");
let ValidationMessageController = ValidationMessageController_1 = class ValidationMessageController {
    constructor(service) {
        this.service = service;
        this.logger = new common_1.Logger(ValidationMessageController_1.name);
    }
    async getBanks(dto) {
        this.logger.log(`➡️ Fetching Banks for country: ${dto?.country ?? 'nigeria'}`);
        try {
            return await this.service.getBanks(dto?.country);
        }
        catch (err) {
            this.logger.error('[banks.get] Error', err);
            throw new common_1.InternalServerErrorException('Failed to fetch banks');
        }
    }
    async verifyAccount(dto) {
        this.logger.log(`➡️ Verifying Bank Account → ${dto.accountNumber} at ${dto.bankCode}`);
        if (!dto.bankCode || !dto.accountNumber) {
            throw new common_1.BadRequestException('bankCode and accountNumber are required');
        }
        try {
            return await this.service.verifyAccount(dto.bankCode, dto.accountNumber);
        }
        catch (err) {
            this.logger.error('[account.verify] Error', err?.response?.data || err);
            throw new common_1.InternalServerErrorException(err?.message || 'Account verification failed');
        }
    }
};
exports.ValidationMessageController = ValidationMessageController;
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: 'banks.get' }),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_bank_dto_1.VerifyBankDto]),
    __metadata("design:returntype", Promise)
], ValidationMessageController.prototype, "getBanks", null);
__decorate([
    (0, microservices_1.MessagePattern)({ cmd: 'account.verify' }),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_account_dto_1.VerifyAccountDto]),
    __metadata("design:returntype", Promise)
], ValidationMessageController.prototype, "verifyAccount", null);
exports.ValidationMessageController = ValidationMessageController = ValidationMessageController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [validation_service_1.ValidationService])
], ValidationMessageController);
//# sourceMappingURL=validation.message.controller.js.map
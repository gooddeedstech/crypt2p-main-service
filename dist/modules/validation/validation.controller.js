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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const validation_service_1 = require("./validation.service");
const verify_account_dto_1 = require("./dtos/verify-account.dto");
const verify_bvn_dto_1 = require("./dtos/verify-bvn.dto");
let ValidationController = class ValidationController {
    constructor(service) {
        this.service = service;
    }
    getBanks() {
        return this.service.getBanks();
    }
    verifyAccount(dto) {
        return this.service.verifyAccount(dto.bankCode, dto.accountNumber);
    }
    verifyBVN(dto) {
        return this.service.verifyBVNWithAccount(dto.bvn, dto.accountNumber, dto.bankCode);
    }
};
exports.ValidationController = ValidationController;
__decorate([
    (0, common_1.Get)('banks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ValidationController.prototype, "getBanks", null);
__decorate([
    (0, common_1.Get)('account'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_account_dto_1.VerifyAccountDto]),
    __metadata("design:returntype", void 0)
], ValidationController.prototype, "verifyAccount", null);
__decorate([
    (0, common_1.Post)('bvn'),
    (0, swagger_1.ApiBody)({ type: verify_bvn_dto_1.VerifyBVNDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof verify_bvn_dto_1.VerifyBVNDto !== "undefined" && verify_bvn_dto_1.VerifyBVNDto) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], ValidationController.prototype, "verifyBVN", null);
exports.ValidationController = ValidationController = __decorate([
    (0, swagger_1.ApiTags)('Identity Validation'),
    (0, common_1.Controller)('validate'),
    __metadata("design:paramtypes", [validation_service_1.ValidationService])
], ValidationController);
//# sourceMappingURL=validation.controller.js.map
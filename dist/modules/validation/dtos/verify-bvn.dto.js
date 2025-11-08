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
exports.VerifyBvnDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class VerifyBvnDto {
}
exports.VerifyBvnDto = VerifyBvnDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'samuel@example.com',
        description: 'User email associated with the Paystack customer record',
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'NG',
        description: 'Country code (always NG for Nigeria)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'bank_account',
        description: 'Type of verification (bank_account for BVN verification)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '0123456789',
        description: 'User’s bank account number (10 digits)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10, { message: 'Account number must be 10 digits' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "account_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '200123456677',
        description: 'User’s BVN number (11 digits)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(11, 11, { message: 'BVN must be 11 digits' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "bvn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '007',
        description: 'Bank code for the selected bank (e.g. Access = 044, Polaris = 076)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "bank_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Asta',
        description: 'First name of the user (used for cross-verification)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Lavista',
        description: 'Last name of the user (used for cross-verification)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "last_name", void 0);
//# sourceMappingURL=verify-bvn.dto.js.map
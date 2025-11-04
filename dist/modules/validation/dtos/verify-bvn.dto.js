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
        example: '12345678901',
        description: '11-digit BVN number',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{11}$/, { message: 'BVN must be exactly 11 digits' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "bvn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '0123456789',
        description: '10-digit NUBAN',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'accountNumber must be 10 digits' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '058',
        description: 'Bank code',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'bankCode must only contain numbers' }),
    (0, class_validator_1.Length)(3, 6, { message: 'bankCode must be 3-6 digits' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Samuel',
        description: 'First name associated with BVN',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'firstName is required' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Osarieme',
        description: 'Last name associated with BVN',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'lastName is required' }),
    __metadata("design:type", String)
], VerifyBvnDto.prototype, "lastName", void 0);
//# sourceMappingURL=verify-bvn.dto.js.map
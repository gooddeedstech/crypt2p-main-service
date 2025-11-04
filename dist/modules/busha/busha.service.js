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
exports.BushaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("../../entities/wallet.entity");
const user_entity_1 = require("../../entities/user.entity");
const busha_client_1 = require("./busha.client");
let BushaService = class BushaService {
    constructor(wallets, users) {
        this.wallets = wallets;
        this.users = users;
        this.client = new busha_client_1.BushaClient();
    }
    async createUserAddress(dto) {
        const user = await this.users.findOne({ where: { id: dto.userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const existing = await this.wallets.findOne({ where: { user: { id: dto.userId }, asset: dto.asset, network: dto.network ?? 'default' }, relations: ['user'] });
        if (existing)
            return existing;
        const res = await this.client.createAddress({ asset: dto.asset, network: dto.network, label: user.email || user.id });
        const address = res?.data?.address ?? res?.address;
        const providerRef = res?.data?.id ?? res?.id;
        const wallet = this.wallets.create({ user, asset: dto.asset, network: dto.network ?? 'default', address, providerRef });
        return this.wallets.save(wallet);
    }
};
exports.BushaService = BushaService;
exports.BushaService = BushaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], BushaService);
//# sourceMappingURL=busha.service.js.map
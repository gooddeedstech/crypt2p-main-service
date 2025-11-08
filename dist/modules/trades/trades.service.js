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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesService = void 0;
const common_1 = require("@nestjs/common");
const busha_client_1 = require("../busha/busha.client");
let TradesService = class TradesService {
    constructor(client) {
        this.client = client;
    }
    async quote(dto) {
        const q = await this.client.createQuote({ side: 'SELL', fromAsset: dto.asset, amount: dto.amount, to: dto.to });
        const quoteId = q?.data?.id ?? q?.id;
        const estNgn = Number(q?.data?.outAmount ?? q?.outAmount);
        return { quoteId, estNgn };
    }
    exec(quoteId) { return this.client.executeTrade({ quoteId }); }
};
exports.TradesService = TradesService;
exports.TradesService = TradesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof busha_client_1.BushaClient !== "undefined" && busha_client_1.BushaClient) === "function" ? _a : Object])
], TradesService);
//# sourceMappingURL=trades.service.js.map
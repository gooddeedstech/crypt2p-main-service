"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BushaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const wallet_entity_1 = require("../../entities/wallet.entity");
const user_entity_1 = require("../../entities/user.entity");
const deposit_entity_1 = require("../../entities/deposit.entity");
const webhook_event_entity_1 = require("../../entities/webhook-event.entity");
const busha_service_1 = require("./busha.service");
const busha_controller_1 = require("./busha.controller");
// import { BushaWebhookController } from './webhook.controller'
const trades_module_1 = require("../trades/trades.module");
const payout_module_1 = require("../payout/payout.module");
const notify_module_1 = require("../notify/notify.module");
const ledger_entity_1 = require("../../entities/ledger.entity");
let BushaModule = class BushaModule {
};
exports.BushaModule = BushaModule;
exports.BushaModule = BushaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([wallet_entity_1.Wallet, user_entity_1.User, deposit_entity_1.Deposit, webhook_event_entity_1.WebhookEvent, ledger_entity_1.LedgerEntry]), trades_module_1.TradesModule, payout_module_1.PayoutModule, notify_module_1.NotifyModule],
        controllers: [busha_controller_1.BushaController,],
        providers: [busha_service_1.BushaService],
        exports: [busha_service_1.BushaService]
    })
], BushaModule);
//# sourceMappingURL=busha.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const validation_service_1 = require("./validation.service");
const validation_log_entity_1 = require("../../entities/validation-log.entity");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const fraud_service_1 = require("../fraud/fraud.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const validation_message_controller_1 = require("./validation.message.controller");
const user_entity_1 = require("../../entities/user.entity");
let ValidationModule = class ValidationModule {
};
exports.ValidationModule = ValidationModule;
exports.ValidationModule = ValidationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                validation_log_entity_1.ValidationLog,
                audit_log_entity_1.AuditLog,
                user_entity_1.User
            ]),
        ],
        controllers: [
            validation_message_controller_1.ValidationMessageController,
        ],
        providers: [
            validation_service_1.ValidationService,
            audit_log_service_1.AuditLogService,
            fraud_service_1.FraudService,
        ],
        exports: [
            validation_service_1.ValidationService, // ✅ used by other modules if needed
        ],
    })
], ValidationModule);
//# sourceMappingURL=validation.module.js.map
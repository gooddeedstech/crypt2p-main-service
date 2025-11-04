"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSchema1720000000000 = void 0;
class InitSchema1720000000000 {
    constructor() {
        this.name = 'InitSchema1720000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        // USERS
        await queryRunner.query(`
        CREATE TABLE "users" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "email" VARCHAR(255) NOT NULL UNIQUE,
            "full_name" VARCHAR(255),
            "password_hash" VARCHAR(255) NOT NULL,
            "bank_account_no" VARCHAR(50),
            "bank_code" VARCHAR(32)
        )`);
        // WALLETS
        await queryRunner.query(`
        CREATE TABLE "wallets" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "asset" VARCHAR(50) NOT NULL,
            "network" VARCHAR(50) NOT NULL DEFAULT 'default',
            "address" VARCHAR(255) NOT NULL UNIQUE,
            "provider_ref" VARCHAR(255),
            "user_id" uuid,
            CONSTRAINT "FK_wallet_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_address" ON "wallets" ("address")`);
        // DEPOSITS
        await queryRunner.query(`
        CREATE TABLE "deposits" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "asset" VARCHAR(32) NOT NULL,
            "network" VARCHAR(32) NOT NULL,
            "tx_hash" VARCHAR(255) NOT NULL UNIQUE,
            "amount_asset" NUMERIC(38,18) NOT NULL,
            "amount_ngn" NUMERIC(38,2),
            "confirmations" INT DEFAULT 0,
            "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            "busha_ref" VARCHAR(255),
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now(),
            CONSTRAINT "FK_deposit_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_deposits_tx_hash" ON "deposits" ("tx_hash")`);
        // PAYOUTS
        await queryRunner.query(`
        CREATE TABLE "payouts" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "deposit_id" uuid NOT NULL,
            "amount_ngn" NUMERIC(38,2) NOT NULL,
            "paystack_ref" VARCHAR(255) UNIQUE,
            "status" VARCHAR(32) NOT NULL DEFAULT 'PROCESSING',
            "failure_reason" VARCHAR(255),
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now(),
            CONSTRAINT "FK_payout_user" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
            CONSTRAINT "FK_payout_deposit" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id")
        )`);
        // LEDGER ENTRIES
        await queryRunner.query(`
        CREATE TABLE "ledger_entries" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "type" VARCHAR(4) NOT NULL,
            "currency" VARCHAR(10) NOT NULL,
            "amount" NUMERIC(38,18) NOT NULL,
            "meta" JSONB,
            "created_at" TIMESTAMP DEFAULT now(),
            CONSTRAINT "FK_ledger_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
        )`);
        // WEBHOOK EVENTS
        await queryRunner.query(`
        CREATE TABLE "webhook_events" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "provider" VARCHAR(50) NOT NULL,
            "event_type" VARCHAR(128) NOT NULL,
            "payload" JSONB NOT NULL,
            "signature" VARCHAR(255) NOT NULL,
            "idempotency_key" VARCHAR(255),
            "status" VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
            "created_at" TIMESTAMP DEFAULT now()
        )`);
        // ✅ VALIDATION LOGS
        await queryRunner.query(`
        CREATE TABLE "validation_logs" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "identifier" VARCHAR(255) NOT NULL,
            "type" VARCHAR(50) NOT NULL,
            "result" VARCHAR(50) NOT NULL,
            "details" JSONB,
            "created_at" TIMESTAMP DEFAULT now()
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_validation_identifier" ON "validation_logs" ("identifier")`);
        // ✅ AUDIT LOGS (Final Correct Copy ✅)
        await queryRunner.query(`
        CREATE TABLE "audit_logs" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "actor_id" VARCHAR(64) NOT NULL,
            "actor_type" VARCHAR(32) NOT NULL,
            "action" VARCHAR(128) NOT NULL,
            "target_id" VARCHAR(128),
            "request_payload" JSONB,
            "response_data" JSONB,
            "action_source" VARCHAR(32) DEFAULT 'API',
            "ip_address" VARCHAR(64),
            "user_agent" VARCHAR(255),
            "created_at" TIMESTAMP DEFAULT now()
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_actor" ON "audit_logs" ("actor_id", "actor_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_action" ON "audit_logs" ("action")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_target" ON "audit_logs" ("target_id")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "validation_logs"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
        await queryRunner.query(`DROP TABLE "payouts"`);
        await queryRunner.query(`DROP TABLE "deposits"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
exports.InitSchema1720000000000 = InitSchema1720000000000;
//# sourceMappingURL=1700000000000-InitSchema.js.map
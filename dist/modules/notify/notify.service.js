"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyService = void 0;
const axios_1 = __importDefault(require("axios"));
const amqplib_1 = __importDefault(require("amqplib"));
class NotifyService {
    constructor() {
        this.ex = process.env.EVENT_EXCHANGE || 'crypt2p.events';
    }
    async channel() {
        if (this.ch)
            return this.ch;
        const url = process.env.RABBITMQ_URL;
        if (!url)
            return undefined;
        const conn = await amqplib_1.default.connect(url);
        const ch = await conn.createChannel();
        await ch.assertExchange(this.ex, 'topic', { durable: true });
        this.ch = ch;
        return ch;
    }
    async publish(routingKey, payload) {
        const ch = await this.channel();
        if (!ch)
            return;
        ch.publish(this.ex, routingKey, Buffer.from(JSON.stringify(payload)), { contentType: 'application/json', persistent: true });
    }
    async callback(event, payload) {
        const url = process.env.GATEWAY_CALLBACK_URL;
        const token = process.env.GATEWAY_CALLBACK_BEARER;
        if (!url)
            return;
        await axios_1.default.post(url, { event, payload }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    }
}
exports.NotifyService = NotifyService;
//# sourceMappingURL=notify.service.js.map
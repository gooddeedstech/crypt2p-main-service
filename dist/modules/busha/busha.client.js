"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BushaClient = void 0;
const axios_1 = __importDefault(require("axios"));
class BushaClient {
    constructor(apiKey = process.env.BUSHA_SECRET_KEY, baseURL = process.env.BUSHA_BASE_URL || 'https://api.commerce.busha.co') {
        this.http = axios_1.default.create({ baseURL, headers: { Authorization: `Bearer ${apiKey}` }, timeout: 15000 });
    }
    createAddress(params) { return this.http.post('/addresses', params).then(r => r.data); }
    createQuote(params) { return this.http.post('/quotes', params).then(r => r.data); }
    executeTrade(params) { return this.http.post('/trades', params).then(r => r.data); }
    getDeposit(id) { return this.http.get(`/deposits/${id}`).then(r => r.data); }
}
exports.BushaClient = BushaClient;
//# sourceMappingURL=busha.client.js.map
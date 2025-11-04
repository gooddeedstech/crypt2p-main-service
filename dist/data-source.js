"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error('DATABASE_URL is required');
}
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    url,
    entities: [__dirname + '/**/*.entity.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
    logging: false
});
//# sourceMappingURL=data-source.js.map
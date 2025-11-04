# Crypt2P — TypeORM + Migrations (Busha-powered)

## Setup
1) Copy `.env.example` → `.env` and fill placeholders.
2) Create database and enable uuid extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
3) Install & run migrations:
```bash
npm install
npm run migration:run
npm run dev
```
Swagger → http://localhost:4007/docs

## Notes
- Email+Password auth with JWT
- TypeORM migrations (no synchronize)
- Busha address creation, webhooks (HMAC), quote+execute SELL
- Paystack payout (optional)
- Notifications: RabbitMQ + optional HTTP callback

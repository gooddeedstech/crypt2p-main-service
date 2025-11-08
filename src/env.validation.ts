import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().optional().default('1d'),
});

export type EnvVars = z.infer<typeof envSchema>;
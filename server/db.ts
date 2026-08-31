import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

export interface TableColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
}

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sslMode = (process.env.PGSSLMODE || '').toLowerCase();
const ssl = sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full'
  ? { rejectUnauthorized: false }
  : undefined;

export const hasDbConfig = Boolean(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER);

export const pool = new Pool({
  host: process.env.PGHOST,
  port: parsePort(process.env.PGPORT, 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl
});

export const query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => {
  return pool.query<T>(text, params);
};

export const getTableColumns = async (tableName: string, tableSchema = 'public'): Promise<TableColumn[]> => {
  const result = await query<TableColumn>(
    `
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `,
    [tableSchema, tableName]
  );

  return result.rows;
};

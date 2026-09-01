import dotenv from 'dotenv';
import { Pool, type QueryResultRow } from 'pg';

dotenv.config();

export interface TableColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
}

const parsePort = (
  value: string | undefined,
  fallback: number
): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
};

// ---------------------------------------------------------
// Database configuration
// ---------------------------------------------------------

const host = process.env.PGHOST;
const database = process.env.PGDATABASE;
const user = process.env.PGUSER;
const port = parsePort(process.env.PGPORT, 5432);

const databricksHost = process.env.DATABRICKS_HOST
  ? (
      process.env.DATABRICKS_HOST.startsWith('http://') ||
      process.env.DATABRICKS_HOST.startsWith('https://')
        ? process.env.DATABRICKS_HOST
        : `https://${process.env.DATABRICKS_HOST}`
    )
  : undefined;
const clientId = process.env.DATABRICKS_CLIENT_ID;
const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;

// IMPORTANT:
// For Lakebase Autoscaling this is supplied by app.yaml
// using:
//   valueFrom: postgres
//
// It resolves to:
// projects/<project>/branches/<branch>/endpoints/<endpoint>
const endpointName = process.env.ENDPOINT_NAME;

const sslMode = (process.env.PGSSLMODE || '').toLowerCase();

const ssl =
  sslMode === 'disable'
    ? undefined
    : {
        rejectUnauthorized: false
      };

export const hasDbConfig = Boolean(
  host &&
  database &&
  user
);

// ---------------------------------------------------------
// Cached Databricks workspace OAuth token
// ---------------------------------------------------------

let workspaceToken: {
  token: string;
  expiresAt: number;
} | null = null;

// ---------------------------------------------------------
// Cached Lakebase PostgreSQL credential
// ---------------------------------------------------------

let postgresToken: {
  token: string;
  expiresAt: number;
} | null = null;

// ---------------------------------------------------------
// Get Databricks workspace OAuth token
// ---------------------------------------------------------

const getWorkspaceToken = async (): Promise<string> => {
  // Reuse token if valid for at least 5 minutes
  if (
    workspaceToken &&
    Date.now() < workspaceToken.expiresAt - 5 * 60 * 1000
  ) {
    return workspaceToken.token;
  }

  if (
    !databricksHost ||
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      'Missing DATABRICKS_HOST, DATABRICKS_CLIENT_ID, or DATABRICKS_CLIENT_SECRET'
    );
  }

  const auth = Buffer
    .from(`${clientId}:${clientSecret}`)
    .toString('base64');

  const response = await fetch(
    `${databricksHost.replace(/\/$/, '')}/oidc/v1/token`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',

        Authorization: `Basic ${auth}`
      },

      body:
        'grant_type=client_credentials&scope=all-apis'
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Databricks OAuth authentication failed: ${response.status} ${text}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  workspaceToken = {
    token: data.access_token,

    expiresAt:
      Date.now() +
      (data.expires_in ?? 3600) * 1000
  };

  return workspaceToken.token;
};

// ---------------------------------------------------------
// Get Lakebase PostgreSQL credential
// ---------------------------------------------------------

const getPostgresCredential =
  async (): Promise<string> => {

    // Reuse credential if valid for at least 5 minutes
    if (
      postgresToken &&
      Date.now() <
        postgresToken.expiresAt - 5 * 60 * 1000
    ) {
      return postgresToken.token;
    }

    if (!databricksHost) {
      throw new Error(
        'Missing DATABRICKS_HOST'
      );
    }

    if (!endpointName) {
      throw new Error(
        'Missing ENDPOINT_NAME. Check app.yaml and make sure the Lakebase resource is referenced with valueFrom: postgres.'
      );
    }

    const token =
      await getWorkspaceToken();

    const response = await fetch(
      `${databricksHost.replace(/\/$/, '')}/api/2.0/postgres/credentials`,
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${token}`,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          endpoint: endpointName
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Lakebase credential generation failed: ${response.status} ${text}`
      );
    }

    const data = (await response.json()) as {
      token: string;
      expires_in?: number;
      expire_time?: string;
    };

    let expiresAt: number;

    if (data.expire_time) {
      expiresAt =
        new Date(data.expire_time).getTime();
    } else {
      expiresAt =
        Date.now() +
        (data.expires_in ?? 3600) * 1000;
    }

    postgresToken = {
      token: data.token,

      expiresAt
    };

    return postgresToken.token;
  };

// ---------------------------------------------------------
// PostgreSQL connection pool
// ---------------------------------------------------------

export const pool = new Pool({
  host,
  port,
  database,
  user,

  /*
   * Lakebase uses a temporary OAuth credential
   * instead of a permanent PostgreSQL password.
   */
  password: async () => {

    /*
     * Keep support for a local PGPASSWORD
     * during development.
     */
    if (process.env.PGPASSWORD) {
      return process.env.PGPASSWORD;
    }

    return getPostgresCredential();
  },

  ssl,

  min: 1,
  max: 10,

  idleTimeoutMillis: 900000,

  connectionTimeoutMillis: 60000
});

// ---------------------------------------------------------
// Generic database query helper
// ---------------------------------------------------------

export const query = async <
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  params: unknown[] = []
) => {
  return pool.query<T>(text, params);
};

// ---------------------------------------------------------
// Get table columns
// ---------------------------------------------------------

export const getTableColumns = async (
  tableName: string,
  tableSchema = 'public'
): Promise<TableColumn[]> => {
  const result =
    await query<TableColumn>(
      `
        SELECT
          a.attname AS column_name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
          t.typname AS udt_name,
          CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable
        FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c
          ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n
          ON n.oid = c.relnamespace
        INNER JOIN pg_catalog.pg_type t
          ON t.oid = a.atttypid
        WHERE n.nspname = $1
          AND c.relname = $2
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
        ORDER BY a.attnum
      `,
      [
        tableSchema,
        tableName
      ]
    );

  return result.rows;
};
import dotenv from 'dotenv';
import { DBSQLClient } from '@databricks/sql';

dotenv.config({ path: ['.env.local', '.env'] });

type DBSession = Awaited<ReturnType<DBSQLClient['openSession']>>;

export interface TableColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
}

// Check if Databricks configuration is present
export const hasDatabricksConfig = Boolean(
  process.env.DATABRICKS_SERVER_HOSTNAME &&
  process.env.DATABRICKS_HTTP_PATH &&
  process.env.DATABRICKS_ACCESS_TOKEN
);

// Databricks client singleton
let client: DBSQLClient | null = null;
let session: DBSession | null = null;
let isConnecting = false;

/**
 * Get or create Databricks client and connect
 */
const getClient = async (): Promise<DBSQLClient> => {
  if (client) {
    return client;
  }

  if (!hasDatabricksConfig) {
    throw new Error('Databricks configuration is not set in environment variables');
  }

  // Prevent multiple simultaneous connection attempts
  while (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (client) {
    return client;
  }

  try {
    isConnecting = true;
    client = new DBSQLClient();

    await client.connect({
      host: process.env.DATABRICKS_SERVER_HOSTNAME!,
      path: process.env.DATABRICKS_HTTP_PATH!,
      token: process.env.DATABRICKS_ACCESS_TOKEN!,
    });

    console.log('[Databricks] Client connected successfully');
    return client;
  } finally {
    isConnecting = false;
  }
};

/**
 * Get or create Databricks session
 */
const getSession = async (): Promise<DBSession> => {
  if (session) {
    return session;
  }

  const databricksClient = await getClient();

  session = await databricksClient.openSession();

  const catalog = process.env.DATABRICKS_CATALOG || 'hive_metastore';
  const schema = process.env.DATABRICKS_SCHEMA || 'genzen_db';

  // Execute catalog and schema selection once per session
  await session.executeStatement(`USE CATALOG ${catalog}`);
  await session.executeStatement(`USE SCHEMA ${schema}`);

  return session;
};

/**
 * Execute a SQL query against Databricks
 */
export const query = async <T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[] }> => {
  const databricksSession = await getSession();

  // Replace $1, $2, etc. with actual values (Databricks doesn't support parameterized queries the same way)
  let queryText = text;
  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`;
    let value: string;

    if (param === null || param === undefined) {
      value = 'NULL';
    } else if (typeof param === 'string') {
      value = `'${param.replace(/'/g, "''")}'`; // Escape single quotes
    } else if (typeof param === 'number' || typeof param === 'boolean') {
      value = String(param);
    } else if (param instanceof Date) {
      value = `'${param.toISOString()}'`;
    } else {
      value = `'${String(param).replace(/'/g, "''")}'`;
    }

    queryText = queryText.replace(placeholder, value);
  });

  const queryOperation = await databricksSession.executeStatement(queryText);
  const result = await queryOperation.fetchAll();
  await queryOperation.close();

  return { rows: result as T[] };
};

/**
 * Get table columns (for schema inspection)
 */
export const getTableColumns = async (
  tableName: string,
  tableSchema?: string
): Promise<TableColumn[]> => {
  const schema = tableSchema || process.env.DATABRICKS_SCHEMA || 'genzen_db';
  const catalog = process.env.DATABRICKS_CATALOG || 'hive_metastore';

  const result = await query<TableColumn>(
    `DESCRIBE TABLE ${catalog}.${schema}.${tableName}`
  );

  return result.rows.map((row: any) => ({
    column_name: row.col_name,
    data_type: row.data_type,
    udt_name: row.data_type,
    is_nullable: 'YES' as 'YES' | 'NO',
  }));
};

/**
 * Close Databricks connection (for cleanup)
 */
export const closeDatabricksConnection = async (): Promise<void> => {
  if (session) {
    await session.close();
    session = null;
  }
  if (client) {
    await client.close();
    client = null;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabricksConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabricksConnection();
  process.exit(0);
});

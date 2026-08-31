const { DBSQLClient } = require("@databricks/sql");

async function getDatabricksClient() {
    const client = new DBSQLClient();

    await client.connect({
        host: process.env.DATABRICKS_SERVER_HOSTNAME,
        path: process.env.DATABRICKS_HTTP_PATH,
        token: process.env.DATABRICKS_TOKEN
    });

    return client;
}

module.exports = getDatabricksClient;
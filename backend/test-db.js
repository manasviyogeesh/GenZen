require("dotenv").config();

const getDatabricksClient = require("./databricks");

async function test() {
    let client;
    let session;
    let operation;

    try {
        console.log("Connecting to Databricks...");

        client = await getDatabricksClient();

        console.log("✅ Connected to Databricks!");

        session = await client.openSession();

        operation = await session.executeStatement(
            "SELECT 1 AS test"
        );

        const result = await operation.fetchAll();

        console.log("Databricks result:");
        console.table(result);

    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error);

    } finally {
        if (operation) await operation.close();
        if (session) await session.close();
        if (client) await client.close();
    }
}

test();
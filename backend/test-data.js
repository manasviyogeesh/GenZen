require("dotenv").config();

const getDatabricksClient = require("./databricks");

async function main() {
    let client;
    let session;
    let operation;

    try {
        console.log("Connecting to Databricks...");

        client = await getDatabricksClient();
        session = await client.openSession();

        console.log("Connected!");

        operation = await session.executeStatement(`
            DESCRIBE TABLE hackathon.graduation_leak.senior_responses
        `);

        const result = await operation.fetchAll();

        console.log("\n📋 senior_responses columns:\n");
        console.table(result);

        await operation.close();
        operation = null;

        // Now get a few actual records
        operation = await session.executeStatement(`
            SELECT *
            FROM hackathon.graduation_leak.senior_responses
            LIMIT 5
        `);

        const rows = await operation.fetchAll();

        console.log("\n📊 Sample data:\n");
        console.table(rows);

    } catch (error) {
        console.error("❌ Error:");
        console.error(error);

    } finally {
        if (operation) await operation.close();
        if (session) await session.close();
        if (client) await client.close();
    }
}

main();
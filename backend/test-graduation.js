require("dotenv").config();

const getDatabricksClient = require("./databricks");

async function main() {
    let client;
    let session;
    let operation;

    try {
        console.log("Connecting to Databricks...");

        client = await getDatabricksClient();
        console.log("Connected!");

        session = await client.openSession();

        operation = await session.executeStatement(
            "SHOW TABLES IN hackathon.graduation_leak"
        );

        const result = await operation.fetchAll();

        console.log("\n📊 Tables in hackathon.graduation_leak:\n");
        console.table(result);

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
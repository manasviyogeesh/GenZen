require("dotenv").config();

const getDatabricksClient = require("./databricks");

async function test() {
    let client;
    let session;
    let operation;

    try {
        client = await getDatabricksClient();
        session = await client.openSession();

        operation = await session.executeStatement(
            "SHOW CATALOGS"
        );

        const result = await operation.fetchAll();

        console.log("\n📚 Databricks Catalogs:\n");
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

test();
require("dotenv").config();

const getDatabricksClient = require("./databricks");

async function showSchemas(catalog) {
    let session;
    let operation;

    try {
        const client = await getDatabricksClient();
        session = await client.openSession();

        operation = await session.executeStatement(
            `SHOW SCHEMAS IN \`${catalog}\``
        );

        const result = await operation.fetchAll();

        console.log(`\n📂 Schemas in ${catalog}:\n`);
        console.table(result);

        await operation.close();
        await session.close();
        await client.close();

    } catch (error) {
        console.error(`❌ Error checking ${catalog}:`);
        console.error(error);
    }
}

async function main() {
    await showSchemas("workspace");
    await showSchemas("hackathon");
}

main();

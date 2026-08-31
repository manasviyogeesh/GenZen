require("dotenv").config();

const express = require("express");
const cors = require("cors");
const getDatabricksClient = require("./databricks");

const app = express();

app.use(cors());
app.use(express.json());


// Test backend
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "GenZen backend is running"
    });
});


// Get senior responses
app.get("/api/senior-responses", async (req, res) => {
    let client;
    let session;
    let operation;

    try {
        client = await getDatabricksClient();
        session = await client.openSession();

        operation = await session.executeStatement(`
            SELECT
                response_id,
                submitted_at,
                graduating_year,
                branch,
                primary_elective,
                elective_rating,
                elective_recommend,
                career_interest,
                internship_experience,
                internship_company_type,
                club_name,
                club_engagement,
                biggest_challenge,
                lesson_learned,
                is_synthetic
            FROM hackathon.graduation_leak.senior_responses
            ORDER BY submitted_at DESC
            LIMIT 100
        `);

        const rows = await operation.fetchAll();

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Databricks query error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to retrieve senior responses"
        });

    } finally {
        if (operation) await operation.close();
        if (session) await session.close();
        if (client) await client.close();
    }
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 GenZen backend running at http://localhost:${PORT}`);
});
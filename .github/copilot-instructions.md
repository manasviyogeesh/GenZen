You are working on the existing GenZen project.

IMPORTANT:
- Do NOT rewrite or replace the existing application.
- Do NOT remove existing features.
- Preserve the existing React frontend architecture.
- Preserve the existing Node.js/Express backend.
- Preserve the existing Databricks integration.
- Reuse existing components, types, API utilities, styling and data patterns whenever possible.
- Before creating a new file, inspect the existing project structure and determine whether an existing file should be extended instead.
- Do not introduce unnecessary dependencies.
- Do not scrape LinkedIn.
- Do not attempt to bypass LinkedIn API restrictions.
- LinkedIn should be treated as an externally provided profile URL.
- Alumni profiles must be voluntarily submitted or imported from authorized institutional data.
- Keep secrets and Databricks credentials in environment variables.
- Never hardcode credentials, tokens or API keys.
- Keep the implementation modular and production-ready.
- After each change, explain which files were changed and why.
- Do not make unrelated changes.

FEATURE TO BUILD:
GenZen Alumni Network.

Goal:
Create an alumni discovery and mentorship feature that connects current students with verified alumni using structured alumni data stored in Databricks.

The system should support:
1. Alumni directory
2. Alumni search and filtering
3. Alumni profile pages
4. LinkedIn profile links
5. Alumni verification/claiming
6. Mentorship topics
7. Integration with the existing GenZen AI/chat functionality
8. Databricks as the alumni data layer

Architecture:

React Frontend
    ↓
Node/Express Backend
    ↓
Databricks
    ↓
Alumni data

The existing GenZen AI/chat system should later be able to query alumni data.

Do not implement web scraping of LinkedIn.

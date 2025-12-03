const axios = require("axios");
require("dotenv").config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key not found in .env");
            return;
        }

        // Try v1beta first
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        console.log(`Fetching models from ${url.replace(apiKey, "HIDDEN_KEY")}...`);

        const response = await axios.get(url);

        console.log("Available Models:");
        const models = response.data.models;
        if (models) {
            models.forEach(m => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models found in response.");
        }

    } catch (error) {
        console.error("Error fetching models:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

listModels();

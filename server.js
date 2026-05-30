const express = require('express');
const cors = require('cors');
const path = require('path');
const { searchAll, extractQueryFromUrl } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    let query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
        // Check if query is a URL
        let isUrl = false;
        try {
            new URL(query);
            isUrl = true;
        } catch (e) {
            isUrl = false;
        }

        if (isUrl) {
            console.log(`Extracting query from URL: ${query}`);
            const extractedQuery = await extractQueryFromUrl(query);
            if (extractedQuery) {
                console.log(`Extracted product title: ${extractedQuery}`);
                query = extractedQuery;
            } else {
                return res.status(400).json({ error: "Could not extract product name from the link. Please type the product name manually." });
            }
        }

        const results = await searchAll(query);
        res.json({ results, query_used: query });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to fetch results. Please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

# 🛒 Smart Product Price Comparison

🚀 **Live Demo:** https://smart-product-price-comparison.onrender.com

## 📌 About

**Smart Product Price Comparison** is a full-stack web scraping application built with Node.js and Express. It lets users search for any product and instantly compare prices across Amazon, Flipkart, Snapdeal, and Myntra — all in one place, without manually visiting each site.


## ✨ Features

- 🔍 **Multi-platform Search** — Simultaneously fetches product listings from Amazon, Flipkart, Snapdeal, and Myntra
- ⚡ **Real-time Scraping** — Live data fetched on every search using Axios and Cheerio
- 💰 **Side-by-side Price Comparison** — Instantly compare prices across platforms to find the best deal
- 🌐 **RESTful API Backend** — Clean Express.js server with CORS support for seamless frontend-backend communication
- 🎨 **Responsive Frontend** — Vanilla HTML, CSS, and JavaScript UI served from the `public/` directory


## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Web Scraping** | Axios + Cheerio |
| **CORS** | cors middleware |
| **Frontend** | HTML, CSS, Vanilla JavaScript |

## 📁 Project Structure


Smart-Product-Price-Comparison/
├── public/               # Frontend assets (HTML, CSS, JS)
├── server.js             # Express server & API routes
├── scraper.js            # Web scraping logic for all platforms
├── package.json          # Project dependencies
└── package-lock.json


## ⚠️ Disclaimer

This project is built for **educational purposes only**. Web scraping may violate the Terms of Service of the platforms being scraped (Amazon, Flipkart, Snapdeal, Myntra). Use responsibly and do not deploy for commercial use. Always review a website's `robots.txt` and ToS before scraping.







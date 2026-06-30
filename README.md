# 🛒 Smart Product Price Comparison

<p align="center">
  <a href="https://smart-product-price-comparison.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20Website-blue?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  Compare product prices from multiple e-commerce platforms in one place using real-time web scraping.
</p>

---

## 📖 About the Project

**Smart Product Price Comparison** is a full-stack web application that helps users compare product prices across multiple popular e-commerce platforms without opening multiple websites.

The application performs **real-time web scraping** whenever a user searches for a product and displays the latest available listings from:

* 🛒 Amazon
* 🛍️ Flipkart
* 🏷️ Snapdeal
* 👕 Myntra

This enables users to quickly find the best available price from a single interface.

---

## ✨ Features

* 🔍 Search products across multiple shopping platforms simultaneously
* ⚡ Real-time web scraping using Axios and Cheerio
* 💰 Compare product prices side-by-side
* 📦 Display product name, price, image, and product link
* 🌐 RESTful Express.js API
* 🎨 Responsive and user-friendly interface
* 🚀 Fast frontend built with HTML, CSS, and JavaScript
* 🔄 Dynamic search results without page refresh

---

## 📸 Preview

> Add screenshots of your application here.

```
assets/
├── home.png
├── search-results.png
└── mobile-view.png
```

Example:

```md
![Home](assets/home.png)

![Results](assets/search-results.png)
```

---

## 🛠️ Tech Stack

| Category     | Technology              |
| ------------ | ----------------------- |
| Runtime      | Node.js                 |
| Backend      | Express.js              |
| Frontend     | HTML5, CSS3, JavaScript |
| Web Scraping | Axios + Cheerio         |
| API          | REST API                |
| Middleware   | CORS                    |
| Deployment   | Render                  |

---

## 📂 Project Structure

```text
Smart-Product-Price-Comparison/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── scraper.js          # Web scraping logic
├── server.js           # Express server
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/your-username/Smart-Product-Price-Comparison.git
```

### Navigate to the project

```bash
cd Smart-Product-Price-Comparison
```

### Install dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

The application will run at:

```
http://localhost:3000
```

---

## 🚀 Live Demo

🌐 **Website**

https://smart-product-price-comparison.onrender.com

---

## 💡 How It Works

1. User enters a product name.
2. The Express server receives the search request.
3. Axios sends HTTP requests to supported shopping websites.
4. Cheerio parses the HTML content.
5. Product details such as:

   * Product Name
   * Price
   * Image
   * Product URL
6. Results from all websites are combined.
7. The frontend displays products in a clean comparison layout.

---

## 📌 Future Improvements

* ❤️ Wishlist functionality
* 📊 Price history graphs
* 🔔 Price drop notifications
* 🤖 AI-based product recommendations
* ⭐ Product ratings and reviews
* 🛍️ Additional shopping websites
* 🔍 Product filters and sorting
* 🌙 Dark Mode

---

## ⚠️ Disclaimer

This project is intended **for educational and learning purposes only**.

The application uses publicly available web pages for demonstration of web scraping techniques. Some websites may prohibit automated scraping through their Terms of Service.

Before using this project commercially, ensure compliance with:

* Website Terms of Service
* robots.txt policies
* Copyright and legal regulations

The author is not responsible for any misuse of this project.

---

## 👨‍💻 Author

**Sanket Bacchanna**

### Connect with me

* 🌐 Portfolio: https://portfolio-6kn3.onrender.com/
* 💼 LinkedIn: https://linkedin-link
* 🐙 GitHub: https://github.com/your-username

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.

It motivates me to build more open-source projects!

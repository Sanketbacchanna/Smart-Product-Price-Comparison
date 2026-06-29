const axios = require('axios');
const cheerio = require('cheerio');
const URL = require('url').URL;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

function fixImageUrl(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return baseUrl + url;
    return url;
}

function cleanTitle(title) {
    if (!title) return '';
    return title
        .replace(/Buy /i, '')
        .replace(/ at Lowest Price.*/i, '')
        .replace(/ Online at Best Prices.*/i, '')
        .replace(/ Online at Best Price.*/i, '')
        .replace(/ - Shop Online.*/i, '')
        .replace(/ - Amazon\.in/i, '')
        .replace(/ - Flipkart.*/i, '')
        .replace(/\|.*/, '')
        .split('-')[0]
        .trim();
}

function isRelatedProduct(title, query) {
    if (!query) return true;
    const titleLower = title.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return true;
    // Require the first significant word (usually brand or main type) to be present
    return titleLower.includes(queryWords[0]);
}

async function extractQueryFromUrl(inputUrl) {
    const parsedUrl = new URL(inputUrl);
    
    // Try HTTP first
    try {
        const { data } = await axios.get(inputUrl, { headers: HEADERS, timeout: 5000 });
        const $ = cheerio.load(data);
        
        let title = '';
        if (parsedUrl.hostname.includes('amazon')) {
            title = $('#productTitle').text().trim() || $('title').text().trim();
        } else if (parsedUrl.hostname.includes('flipkart')) {
            title = $('.B_NuCI').text().trim() || $('title').text().trim();
        } else {
            title = $('title').text().trim();
        }
        
        const cleaned = cleanTitle(title);
        if (cleaned) {
            // Simplify query to first 3 words to ensure broad match across all platforms
            return cleaned.split(/\s+/).slice(0, 3).join(' ').replace(/[^a-zA-Z0-9 ]/g, '');
        }
    } catch (error) {
        console.log("URL extraction HTTP error, falling back to URL parsing:", error.message);
    }
    
    // Fallback to URL path parsing (robust & fast)
    try {
        let pathParts = parsedUrl.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
            let slug = pathParts[0];
            if (slug !== 'dp' && slug !== 'p' && slug !== 'search') {
                return cleanTitle(slug.replace(/-/g, ' ').trim());
            } else if (pathParts.length > 1) {
                return cleanTitle(pathParts[1].replace(/-/g, ' ').trim());
            }
        }
        if (parsedUrl.searchParams.has('q')) {
            return cleanTitle(parsedUrl.searchParams.get('q'));
        }
        if (parsedUrl.searchParams.has('keyword')) {
            return cleanTitle(parsedUrl.searchParams.get('keyword'));
        }
    } catch (e) {}
    
    return null;
}

async function scrapeAmazon(query) {
    try {
        const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('div[data-component-type="s-search-result"]').each((i, el) => {
            const title = $(el).find('h2 a span').text().trim();
            const priceStr = $(el).find('.a-price-whole').first().text().trim();
            const price = priceStr.replace(/,/g, '');
            const link = 'https://www.amazon.in' + $(el).find('h2 a').attr('href');
            const image = fixImageUrl($(el).find('img.s-image').attr('src'), 'https://www.amazon.in');

            if (title && price && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Amazon',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Amazon scrape error:", error.message);
        return [];
    }
}

async function scrapeFlipkart(query) {
    try {
        const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        const items = $('div[data-id]');
        if (items.length > 0) {
            items.each((i, el) => {
                const title = $(el).find('div, a').filter((_, e) => $(e).text().length > 20 && !$(e).children().length).first().text().trim();
                let priceStr = $(el).text().match(/₹[0-9,]+/);
                priceStr = priceStr ? priceStr[0].replace(/₹|,/g, '') : null;
                const linkObj = $(el).find('a[href*="/p/"]');
                const link = linkObj.length ? 'https://www.flipkart.com' + linkObj.attr('href') : null;
                const image = fixImageUrl($(el).find('img[src^="http"]').attr('src'), 'https://www.flipkart.com');
                
                if (title && priceStr && !isNaN(parseFloat(priceStr)) && isRelatedProduct(title, query)) {
                    results.push({
                        platform: 'Flipkart',
                        title,
                        price: parseFloat(priceStr),
                        link,
                        image,
                        logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Flipkart_logo.svg'
                    });
                }
            });
        }
        return results.slice(0, 5);
    } catch (error) {
        console.error("Flipkart scrape error:", error.message);
        return [];
    }
}

async function scrapeSnapdeal(query) {
    try {
        const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('.product-tuple-listing').each((i, el) => {
            const title = $(el).find('.product-title').text().trim();
            const priceStr = $(el).find('.product-price').text().trim();
            const price = priceStr.replace(/Rs\.|,/g, '').trim();
            const link = $(el).find('.dp-widget-link').attr('href');
            let image = $(el).find('.product-image').attr('src') || $(el).find('.product-image').attr('data-src');
            image = fixImageUrl(image, 'https://www.snapdeal.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Snapdeal',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Snapdeal_Logo.png'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Snapdeal scrape error:", error.message);
        return [];
    }
}

async function scrapeMyntra(query) {
    try {
        const url = `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        const scriptContent = $('script').filter((i, el) => {
            return $(el).html().includes('searchData');
        }).html();

        if (scriptContent) {
            try {
                const match = scriptContent.match(/window\.__myx\s*=\s*({.+?});/);
                if (match) {
                    const myx = JSON.parse(match[1]);
                    const products = myx?.searchData?.results?.products || [];
                    products.forEach(p => {
                        if (isRelatedProduct(p.productName, query)) {
                            results.push({
                                platform: 'Myntra',
                                title: p.productName,
                                price: p.price,
                                link: `https://www.myntra.com/${p.landingPageUrl}`,
                                image: fixImageUrl(p.searchImage, 'https://www.myntra.com'),
                                logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png'
                            });
                        }
                    });
                }
            } catch(e) {}
        }
        return results.slice(0, 5);
    } catch (error) {
        console.error("Myntra scrape error:", error.message);
        return [];
    }
}

async function scrapeCroma(query) {
    try {
        const url = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('.product-item').each((i, el) => {
            const title = $(el).find('.product-title').text().trim();
            const priceStr = $(el).find('.amount').first().text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://www.croma.com' + $(el).find('a').attr('href');
            let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            image = fixImageUrl(image, 'https://www.croma.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Croma',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Croma_Logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Croma scrape error:", error.message);
        return [];
    }
}

async function scrapeRelianceDigital(query) {
    try {
        const url = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}:relevance`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('.sp__product').each((i, el) => {
            const title = $(el).find('.sp__name').text().trim();
            const priceStr = $(el).find('.TextWeb__Text-sc-1cyx778-0').text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://www.reliancedigital.in' + $(el).closest('a').attr('href');
            let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            image = fixImageUrl(image, 'https://www.reliancedigital.in');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Reliance Digital',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Reliance_Digital_Logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Reliance Digital scrape error:", error.message);
        return [];
    }
}

async function scrapeBigBasket(query) {
    try {
        const url = `https://www.bigbasket.com/custompage/sysgen/?type=search&slug=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('.item').each((i, el) => {
            const title = $(el).find('h6').text().trim() || $(el).find('.prod-name').text().trim();
            const priceStr = $(el).find('.discnt-price').text().trim() || $(el).find('.Pricing___StyledLabel-sc-pldi2d-1').text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://www.bigbasket.com' + $(el).find('a').attr('href');
            let image = $(el).find('img').attr('src');
            image = fixImageUrl(image, 'https://www.bigbasket.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'BigBasket',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/en/3/36/BigBasket_Logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("BigBasket scrape error:", error.message);
        return [];
    }
}

async function scrapeBlinkit(query) {
    try {
        const url = `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('.Product__ProductContainer-sc-11drqkm-0').each((i, el) => {
            const title = $(el).find('.Product__ProductName-sc-11drqkm-4').text().trim();
            const priceStr = $(el).find('.ProductPrice__Price-sc-11drqkm-9').text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://blinkit.com' + $(el).find('a').attr('href');
            let image = $(el).find('img').attr('src');
            image = fixImageUrl(image, 'https://blinkit.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Blinkit',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Blinkit-yellow-app-icon.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Blinkit scrape error:", error.message);
        return [];
    }
}

async function scrapeInstamart(query) {
    try {
        const url = `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('[data-testid="item-container"]').each((i, el) => {
            const title = $(el).find('[data-testid="item-name"]').text().trim();
            const priceStr = $(el).find('[data-testid="item-price"]').text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://www.swiggy.com/instamart' + $(el).closest('a').attr('href');
            let image = $(el).find('img').attr('src');
            image = fixImageUrl(image, 'https://www.swiggy.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Instamart',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Instamart scrape error:", error.message);
        return [];
    }
}

async function scrapeZepto(query) {
    try {
        const url = `https://www.zeptonow.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('[data-testid="product-card"]').each((i, el) => {
            const title = $(el).find('[data-testid="product-name"]').text().trim();
            const priceStr = $(el).find('[data-testid="product-price"]').text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const link = 'https://www.zeptonow.com' + $(el).closest('a').attr('href');
            let image = $(el).find('img').attr('src');
            image = fixImageUrl(image, 'https://www.zeptonow.com');

            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Zepto',
                    title,
                    price: parseFloat(price),
                    link,
                    image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Zepto_Logo.png'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Zepto scrape error:", error.message);
        return [];
    }
}

async function scrapeJioMart(query) {
    try {
        const url = `https://www.jiomart.com/search/${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        $('.plp-card-container, .jm-product-list-container li, .product-card').each((i, el) => {
            const title = $(el).find('.plp-card-details-name, .product-title, .jm-heading-s').first().text().trim();
            const priceStr = $(el).find('.plp-card-details-price, .product-price, .jm-heading-xxs').first().text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const linkObj = $(el).find('a').first();
            const link = linkObj.length ? 'https://www.jiomart.com' + linkObj.attr('href') : null;
            let image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
            image = fixImageUrl(image, 'https://www.jiomart.com');
            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'JioMart',
                    title, price: parseFloat(price), link, image,
                    logo: 'https://upload.wikimedia.org/wikipedia/en/2/23/JioMart_logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("JioMart error:", error.message);
        return [];
    }
}

async function scrapeTataCliq(query) {
    try {
        const url = `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        $('.ProductModule__dummyDiv, .ProductDescription__content').each((i, el) => {
            const title = $(el).find('h2, .ProductDescription__description').first().text().trim();
            const priceStr = $(el).find('h3, .ProductDescription__price').first().text().trim();
            const price = priceStr.replace(/₹|,/g, '').trim();
            const linkObj = $(el).closest('a');
            const link = linkObj.length ? 'https://www.tatacliq.com' + linkObj.attr('href') : null;
            let image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
            image = fixImageUrl(image, 'https://www.tatacliq.com');
            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Tata CLiQ',
                    title, price: parseFloat(price), link, image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Tata_Cliq_Logo.png'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Tata CLiQ error:", error.message);
        return [];
    }
}

async function scrapeMeesho(query) {
    try {
        const url = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        $('.ProductList__GridCard, .sc-bdnxRM').each((i, el) => {
            const title = $(el).find('p').first().text().trim();
            let priceStr = $(el).find('h5, span:contains("₹")').first().text().trim();
            let price = priceStr.replace(/₹|,/g, '').trim();
            const linkObj = $(el).closest('a');
            const link = linkObj.length ? 'https://www.meesho.com' + linkObj.attr('href') : null;
            let image = $(el).find('img').first().attr('src');
            image = fixImageUrl(image, 'https://www.meesho.com');
            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Meesho',
                    title, price: parseFloat(price), link, image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Meesho_Logo_Full.png'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Meesho error:", error.message);
        return [];
    }
}

async function scrapeAjio(query) {
    try {
        const url = `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        $('.item').each((i, el) => {
            const title = $(el).find('.nameCls').text().trim();
            let priceStr = $(el).find('.price').text().trim();
            let price = priceStr.replace(/₹|,/g, '').trim();
            const linkObj = $(el).find('a');
            const link = linkObj.length ? 'https://www.ajio.com' + linkObj.attr('href') : null;
            let image = $(el).find('img').first().attr('src');
            image = fixImageUrl(image, 'https://www.ajio.com');
            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Ajio',
                    title, price: parseFloat(price), link, image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/AJIO_Logo.png'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Ajio error:", error.message);
        return [];
    }
}

async function scrapeNykaa(query) {
    try {
        const url = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        $('.product-wrapper').each((i, el) => {
            const title = $(el).find('.css-xrzmfa').text().trim();
            let priceStr = $(el).find('.css-111z9ua').text().trim();
            let price = priceStr.replace(/₹|,/g, '').trim();
            const linkObj = $(el).find('a');
            const link = linkObj.length ? 'https://www.nykaa.com' + linkObj.attr('href') : null;
            let image = $(el).find('img').first().attr('src');
            image = fixImageUrl(image, 'https://www.nykaa.com');
            if (title && price && !isNaN(parseFloat(price)) && isRelatedProduct(title, query)) {
                results.push({
                    platform: 'Nykaa',
                    title, price: parseFloat(price), link, image,
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Nykaa_Logo.svg'
                });
            }
        });
        return results.slice(0, 5);
    } catch (error) {
        console.error("Nykaa error:", error.message);
        return [];
    }
}

async function searchAll(query) {
    let amazonRes = [], flipkartRes = [], snapdealRes = [], myntraRes = [], cromaRes = [], relianceRes = [], bigbasketRes = [], blinkitRes = [], instamartRes = [], zeptoRes = [];
    let jioMartRes = [], tataCliqRes = [], meeshoRes = [], ajioRes = [], nykaaRes = [];
    try {
        [amazonRes, flipkartRes, snapdealRes, myntraRes, cromaRes, relianceRes, bigbasketRes, blinkitRes, instamartRes, zeptoRes, jioMartRes, tataCliqRes, meeshoRes, ajioRes, nykaaRes] = await Promise.all([
            scrapeAmazon(query),
            scrapeFlipkart(query),
            scrapeSnapdeal(query),
            scrapeMyntra(query),
            scrapeCroma(query),
            scrapeRelianceDigital(query),
            scrapeBigBasket(query),
            scrapeBlinkit(query),
            scrapeInstamart(query),
            scrapeZepto(query),
            scrapeJioMart(query),
            scrapeTataCliq(query),
            scrapeMeesho(query),
            scrapeAjio(query),
            scrapeNykaa(query)
        ]);
    } catch (err) {
        console.error("searchAll error:", err.message);
    }
    
    let allResults = [...amazonRes, ...flipkartRes, ...snapdealRes, ...myntraRes, ...cromaRes, ...relianceRes, ...bigbasketRes, ...blinkitRes, ...instamartRes, ...zeptoRes, ...jioMartRes, ...tataCliqRes, ...meeshoRes, ...ajioRes, ...nykaaRes];

    // Augment with attractive mock data
    allResults = allResults.map(item => {
        return {
            ...item,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // Rating between 3.5 and 5.0
            reviewsCount: Math.floor(Math.random() * 5000) + 50,
            priceDrop: Math.floor(Math.random() * 30) + 5 // 5% to 35% drop
        };
    });

    allResults = allResults.sort((a, b) => a.price - b.price);
    return allResults;
}

module.exports = { searchAll, extractQueryFromUrl };

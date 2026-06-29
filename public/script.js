document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const loadingEl = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const comparisonGrid = document.getElementById('comparison-grid');
    const resultCountSpan = document.getElementById('result-count');
    const controlsContainer = document.getElementById('controls-container');
    const sortSelect = document.getElementById('sort-select');
    const platformFilter = document.getElementById('platform-filter');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    let allResultsData = [];

    // Theme logic
    const toggleTheme = () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        document.querySelector('.sun-icon').classList.toggle('hidden', isLight);
        document.querySelector('.moon-icon').classList.toggle('hidden', !isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    };

    themeToggleBtn.addEventListener('click', toggleTheme);
    if (localStorage.getItem('theme') === 'light') {
        toggleTheme();
    }

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Hide results, show loading
        resultsContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');
        loadingEl.classList.remove('hidden');
        comparisonGrid.innerHTML = '';
        resultCountSpan.textContent = '';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch results from the server.');
            }
            
            const data = await response.json();
            
            loadingEl.classList.add('hidden');
            
            if (data.results && data.results.length > 0) {
                allResultsData = data.results;
                
                // Populate platform filter
                const platforms = [...new Set(allResultsData.map(r => r.platform))];
                platformFilter.innerHTML = '<option value="all">All Platforms</option>' + 
                    platforms.map(p => `<option value="${p}">${p}</option>`).join('');
                
                controlsContainer.classList.remove('hidden');
                resultsContainer.classList.remove('hidden');
                
                applyFiltersAndRender();
            } else {
                comparisonGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary); grid-column: 1 / -1;">No results found. Try a different query.</p>';
                resultsContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            loadingEl.classList.add('hidden');
            comparisonGrid.innerHTML = `<p style="text-align:center; width: 100%; color: #ef4444; grid-column: 1 / -1;">${error.message}</p>`;
            resultsContainer.classList.remove('hidden');
        }
    });

    sortSelect.addEventListener('change', applyFiltersAndRender);
    platformFilter.addEventListener('change', applyFiltersAndRender);

    function applyFiltersAndRender() {
        let filtered = [...allResultsData];
        const platform = platformFilter.value;
        const sortBy = sortSelect.value;

        if (platform !== 'all') {
            filtered = filtered.filter(r => r.platform === platform);
        }

        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        renderResults(filtered);
    }

    function renderResults(results) {
        resultCountSpan.textContent = `${results.length} items found`;
        comparisonGrid.innerHTML = '';
        
        if (results.length === 0) {
            comparisonGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary); grid-column: 1 / -1;">No matches for the selected filter.</p>';
            return;
        }
        
        const minPrice = Math.min(...results.map(r => r.price));
        let bestDealMarked = false;

        results.forEach((item, index) => {
            const isBestDeal = !bestDealMarked && item.price === minPrice;
            if (isBestDeal) bestDealMarked = true;
            
            const card = document.createElement('div');
            card.className = `card`;
            card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.05}s both`;
            
            // Mock rating stars
            const fullStars = Math.floor(item.rating || 4);
            const starsHTML = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
            const priceDropHTML = item.priceDrop ? `<div class="price-drop">▼ ${item.priceDrop}% OFF</div>` : '';

            card.innerHTML = `
                ${isBestDeal ? '<div class="best-deal-badge">Best Deal</div>' : ''}
                ${priceDropHTML}
                <div class="card-image-container">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">` : '<div style="color: var(--text-secondary)">No Image</div>'}
                </div>
                <div class="platform-info">
                    ${item.logo ? `<img src="${item.logo}" alt="${item.platform}" class="platform-logo" onerror="this.outerHTML='<span style=\\'font-size: 0.9rem; color: var(--accent); margin-bottom: 0.5rem; display:block; font-weight: 700;\\'>${item.platform}</span>'">` : `<span style="font-size: 0.9rem; color: var(--accent); margin-bottom: 0.5rem; display:block; font-weight: 700;">${item.platform}</span>`}
                </div>
                <h3 class="card-title" title="${item.title}">${item.title}</h3>
                
                <div class="rating-container">
                    <span class="stars">${starsHTML}</span>
                    <span class="rating-val">${item.rating || '4.0'}</span>
                    <span class="reviews-count">(${item.reviewsCount || 120})</span>
                </div>

                <div class="card-footer">
                    <div class="price">₹${item.price.toLocaleString('en-IN')}</div>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="buy-btn">View Deal</a>
                </div>
            `;
            
            comparisonGrid.appendChild(card);
        });
    }
});

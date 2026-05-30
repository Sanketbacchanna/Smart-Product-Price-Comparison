document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const loadingEl = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const comparisonGrid = document.getElementById('comparison-grid');
    const resultCountSpan = document.getElementById('result-count');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Hide results, show loading
        resultsContainer.classList.add('hidden');
        loadingEl.classList.remove('hidden');
        comparisonGrid.innerHTML = '';
        resultCountSpan.textContent = ''; // Fixed: Clear previous results count

        try {
            const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch results from the server.');
            }
            
            const data = await response.json();
            
            loadingEl.classList.add('hidden');
            
            if (data.results && data.results.length > 0) {
                renderResults(data.results);
                resultsContainer.classList.remove('hidden');
            } else {
                comparisonGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary); grid-column: 1 / -1;">No results found. Try a different query.</p>';
                resultsContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            loadingEl.classList.add('hidden');
            // Fixed: Provide a friendlier error message rather than "make sure backend is running"
            comparisonGrid.innerHTML = `<p style="text-align:center; width: 100%; color: #ef4444; grid-column: 1 / -1;">${error.message}</p>`;
            resultsContainer.classList.remove('hidden');
        }
    });

    function renderResults(results) {
        resultCountSpan.textContent = `${results.length} items found`;
        
        // Find minimum price for "Best Deal" badge
        const minPrice = Math.min(...results.map(r => r.price));
        let bestDealMarked = false;

        results.forEach((item, index) => {
            const isBestDeal = !bestDealMarked && item.price === minPrice;
            if (isBestDeal) bestDealMarked = true;
            
            const card = document.createElement('div');
            card.className = `card`;
            card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
            
            card.innerHTML = `
                ${isBestDeal ? '<div class="best-deal-badge">Best Deal</div>' : ''}
                <div class="card-image-container">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">` : '<div style="color: var(--text-secondary)">No Image</div>'}
                </div>
                ${item.logo ? `<img src="${item.logo}" alt="${item.platform}" class="platform-logo" onerror="this.outerHTML='<span style=\\'font-size: 0.9rem; color: #a5b4fc; margin-bottom: 0.5rem; display:block; font-weight: 700;\\'>${item.platform}</span>'">` : `<span style="font-size: 0.9rem; color: #a5b4fc; margin-bottom: 0.5rem; display:block; font-weight: 700;">${item.platform}</span>`}
                <h3 class="card-title" title="${item.title}">${item.title}</h3>
                <div class="card-footer">
                    <div class="price">₹${item.price.toLocaleString('en-IN')}</div>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="buy-btn">View Deal</a>
                </div>
            `;
            
            comparisonGrid.appendChild(card);
        });
    }
});

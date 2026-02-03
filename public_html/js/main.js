// BizBox Main Application Script

const API_BASE = '/api/v1';

/**
 * Load products from backend
 */
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products?lang=${currentLang}`);
    const { data } = await response.json();

    const grid = document.getElementById('products-grid');
    if (!data || data.length === 0) {
      grid.innerHTML = '<p class="loading">No products available</p>';
      return;
    }

    grid.innerHTML = data.map(product => `
      <div class="product-card">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-roi">
          <strong>ROI:</strong> ${product.roi_percentage}%
        </div>
        <div class="product-time">
          <strong>Setup:</strong> ${product.setup_time_days} days
        </div>
        <div class="product-price">$${product.price_usd.toLocaleString()}</div>
        <p style="font-size: 12px; color: #888;">
          💰 Avg. Monthly Income: $${product.average_monthly_income.toLocaleString()}
        </p>
        <button class="btn btn-primary" onclick="selectProduct(${product.id}, '${product.name}')">
          ${t('btn_start')}
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('❌ Error loading products:', err);
    document.getElementById('products-grid').innerHTML =
      '<p class="loading" style="color: red;">Error loading products</p>';
  }
}

/**
 * Load case studies from backend
 */
async function loadCases() {
  try {
    const response = await fetch(`${API_BASE}/cases?lang=${currentLang}`);
    const { data } = await response.json();

    const grid = document.getElementById('cases-grid');
    if (!data || data.length === 0) {
      grid.innerHTML = '<p class="loading">No cases available</p>';
      return;
    }

    grid.innerHTML = data.map(caseItem => `
      <div class="case-card">
        <div class="rating">
          ${'⭐'.repeat(caseItem.rating || 5)}
        </div>
        <h3>${caseItem.title}</h3>
        <p><strong>${caseItem.client_name}</strong></p>
        <p>📊 Niche: <strong>${caseItem.niche}</strong></p>
        <p>💵 Initial Investment: <strong>$${caseItem.initial_investment.toLocaleString()}</strong></p>
        <p>📈 Revenue (6 months): <strong>$${caseItem.revenue_month_6.toLocaleString()}</strong></p>
        <p>📊 Monthly Profit: <strong>$${caseItem.profit_monthly.toLocaleString()}</strong></p>
        <p>🎯 ROI: <strong>${caseItem.roi_percentage}%</strong></p>
        <div class="testimonial">
          <em>"${caseItem.testimonial}"</em>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('❌ Error loading cases:', err);
    document.getElementById('cases-grid').innerHTML =
      '<p class="loading" style="color: red;">Error loading cases</p>';
  }
}

/**
 * Select a product and open chat
 */
function selectProduct(productId, productName) {
  sessionStorage.setItem('selectedProduct', JSON.stringify({
    id: productId,
    name: productName
  }));
  openChat();
}

/**
 * Scroll to products section
 */
function scrollToProducts() {
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Scroll to cases section
 */
function scrollToCases() {
  document.getElementById('cases').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Format currency
 */
function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(value);
}

/**
 * Log events for analytics
 */
function logEvent(eventName, data = {}) {
  const event = {
    name: eventName,
    timestamp: new Date().toISOString(),
    language: currentLang,
    ...data
  };
  console.log('📊 Event:', event);
  // Could send to analytics service here
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  logEvent('page_loaded');

  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

// Track when user leaves the page
window.addEventListener('beforeunload', () => {
  logEvent('page_unload');
});

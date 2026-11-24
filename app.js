/* ==========================================================================
   Morrow Skin — Editable Storefront Configuration & Interactive Logic
   ========================================================================== */

/**
 * 1. BRAND & STORE SETTINGS
 * Edit these values to customize brand name, shipping threshold, or checkout link.
 */
const BRAND_CONFIG = {
  name: 'Morrow Skin',
  currencySymbol: '$',
  freeShippingThreshold: 60,
  promoCode: 'MORROW10',
  // Leave empty ('') for portfolio demo notice, or set to a live Shopify / Stripe URL
  checkoutUrl: ''
};

/**
 * 2. PRODUCT CATALOG
 * Replace names, prices, sizes, copy, image paths, or productUrl links here.
 */
const PRODUCTS = [
  {
    id: 'gentle-cream-cleanser',
    step: 'Step 01 · Cleanse',
    timing: 'AM / PM',
    name: 'Gentle Cream Cleanser',
    tagline: 'Oat & squalane cushion milk that dissolves buildup without tightness.',
    description:
      'A pH-balanced, non-foaming cream cleanser formulated with colloidal oat and plant-derived squalane to lift sunscreen and daily impurities while keeping your lipid barrier intact.',
    ingredients: 'Colloidal Oat 2%, Olive Squalane, Glycerin, Panthenol (B5)',
    howToUse: 'Massage two pumps onto damp skin for 30 seconds, then rinse with lukewarm water.',
    image: './assets/cleanser.webp',
    alt: 'Morrow Skin Gentle Cream Cleanser matte ivory pump bottle with espresso cap',
    productUrl: '#best-sellers',
    variants: [
      { id: '50ml', label: '50ml', price: 24 },
      { id: '100ml', label: '100ml', price: 38 }
    ]
  },
  {
    id: 'barrier-glow-serum',
    step: 'Step 02 · Treat',
    timing: 'AM / PM',
    name: 'Barrier Glow Serum',
    tagline: '5% niacinamide & ectoin concentrate for calm, luminous tone.',
    description:
      'A silky, water-light treatment combining 5% niacinamide with stress-shielding ectoin and centella extract to visibly quiet redness and restore bounce.',
    ingredients: 'Niacinamide 5%, Ectoin 1%, Centella Asiatica, Sodium Hyaluronate',
    howToUse: 'Press 3–4 drops gently into slightly damp skin after cleansing.',
    image: './assets/serum.webp',
    alt: 'Morrow Skin Barrier Glow Serum frosted glass dropper bottle with warm amber serum',
    productUrl: '#best-sellers',
    variants: [
      { id: '30ml', label: '30ml', price: 42 },
      { id: '50ml', label: '50ml', price: 62 }
    ]
  },
  {
    id: 'velvet-moisture-cream',
    step: 'Step 03 · Seal',
    timing: 'AM / PM',
    name: 'Velvet Moisture Cream',
    tagline: 'Ceramide cloud cream for 24-hour comfort and a satin finish.',
    description:
      'A cushioned, breathable moisturizer enriched with skin-identical ceramides NP/AP/EOP and shea esters to lock in hydration without heaviness.',
    ingredients: 'Ceramide Complex 3%, Shea Esters, Meadowfoam Seed Oil, Bisabolol',
    howToUse: 'Warm a pearl-sized amount between fingertips and press across face and neck.',
    image: './assets/cream.webp',
    alt: 'Morrow Skin Velvet Moisture Cream frosted glass jar with espresso brown lid',
    productUrl: '#best-sellers',
    variants: [
      { id: '50ml', label: '50ml', price: 36 },
      { id: '100ml', label: '100ml', price: 58 }
    ]
  }
];

const CART_STORAGE_KEY = 'morrow_skin_cart_v1';

/* ==========================================================================
   Application State
   ========================================================================== */
const state = {
  selectedVariants: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.variants[0].id])),
  cart: loadCart(),
  activeOverlay: null,
  lastFocusedElement: null,
  quickViewProductId: null
};

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}

function formatPrice(amount) {
  return `${BRAND_CONFIG.currencySymbol}${Number(amount).toFixed(2)}`;
}

function formatShortPrice(amount) {
  return Number.isInteger(amount)
    ? `${BRAND_CONFIG.currencySymbol}${amount}`
    : formatPrice(amount);
}

function getProduct(productId) {
  return PRODUCTS.find((item) => item.id === productId);
}

function getVariant(product, variantId) {
  return product.variants.find((v) => v.id === variantId) || product.variants[0];
}

function announce(message) {
  const region = document.getElementById('sr-announcer');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/* ==========================================================================
   Product Grid Rendering & Variant Selection
   ========================================================================== */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((product) => {
    const activeVariant = getVariant(product, state.selectedVariants[product.id]);

    const variantButtons = product.variants
      .map((variant) => {
        const isSelected = variant.id === activeVariant.id;
        return `
          <button
            type="button"
            class="variant-btn"
            data-action="select-variant"
            data-product-id="${product.id}"
            data-variant-id="${variant.id}"
            aria-pressed="${isSelected}"
          >${variant.label}</button>
        `;
      })
      .join('');

    return `
      <article class="product-card" data-product-id="${product.id}">
        <button
          type="button"
          class="product-media-btn"
          data-action="quick-view"
          data-product-id="${product.id}"
          aria-label="Quick view ${product.name}"
        >
          <span class="product-step-badge">${product.step}</span>
          <img
            src="${product.image}"
            alt="${product.alt}"
            width="720"
            height="900"
            loading="lazy"
          >
        </button>

        <div class="product-body">
          <div class="product-top-row">
            <h3 class="product-title">${product.name}</h3>
            <span class="product-price" data-price-for="${product.id}">${formatShortPrice(activeVariant.price)}</span>
          </div>
          <p class="product-tagline">${product.tagline}</p>

          <div class="variant-group" role="group" aria-label="Select size for ${product.name}">
            ${variantButtons}
          </div>

          <div class="product-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-action="quick-view"
              data-product-id="${product.id}"
            >Quick View</button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              data-action="add-to-cart"
              data-product-id="${product.id}"
            >Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function selectProductVariant(productId, variantId) {
  const product = getProduct(productId);
  if (!product) return;
  const variant = getVariant(product, variantId);
  state.selectedVariants[productId] = variant.id;

  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  if (card) {
    const priceEl = card.querySelector(`[data-price-for="${productId}"]`);
    if (priceEl) priceEl.textContent = formatShortPrice(variant.price);

    card.querySelectorAll('.variant-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.variantId === variant.id));
    });
  }

  if (state.quickViewProductId === productId) {
    const qvModal = document.getElementById('quick-view-modal');
    if (qvModal && !qvModal.hidden) {
      renderQuickView(productId);
    }
  }
}

/* ==========================================================================
   Cart State & Drawer Rendering
   ========================================================================== */
function addToCart(productId, variantId, { openDrawer = true, triggerEl = null } = {}) {
  const product = getProduct(productId);
  if (!product) return;
  const variant = getVariant(product, variantId || state.selectedVariants[productId]);
  const key = `${product.id}__${variant.id}`;

  const existing = state.cart.find((item) => item.key === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      key,
      productId: product.id,
      variantId: variant.id,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  announce(`${product.name} (${variant.label}) added to cart.`);

  if (openDrawer) {
    openOverlay(document.getElementById('cart-drawer'), triggerEl || document.getElementById('cart-open-btn'));
  }
}

function addFullRitual(triggerEl) {
  PRODUCTS.forEach((product) => {
    const baseVariant = product.variants[0];
    const key = `${product.id}__${baseVariant.id}`;
    const existing = state.cart.find((item) => item.key === key);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        key,
        productId: product.id,
        variantId: baseVariant.id,
        quantity: 1
      });
    }
  });

  saveCart();
  renderCart();
  announce('Full 3-step ritual added to cart.');
  openOverlay(document.getElementById('cart-drawer'), triggerEl || document.getElementById('cart-open-btn'));
}

function updateCartQuantity(key, delta) {
  const idx = state.cart.findIndex((item) => item.key === key);
  if (idx === -1) return;

  const nextQty = state.cart[idx].quantity + delta;
  if (nextQty <= 0) {
    state.cart.splice(idx, 1);
  } else {
    state.cart[idx].quantity = nextQty;
  }

  saveCart();
  renderCart();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((item) => item.key !== key);
  saveCart();
  renderCart();
  announce('Item removed from cart.');
}

function getCartTotals() {
  let count = 0;
  let subtotal = 0;

  const detailedItems = state.cart
    .map((entry) => {
      const product = getProduct(entry.productId);
      if (!product) return null;
      const variant = getVariant(product, entry.variantId);
      const lineTotal = variant.price * entry.quantity;
      count += entry.quantity;
      subtotal += lineTotal;
      return {
        ...entry,
        product,
        variant,
        lineTotal
      };
    })
    .filter(Boolean);

  return { count, subtotal, detailedItems };
}

function renderCart() {
  const { count, subtotal, detailedItems } = getCartTotals();

  const headerCount = document.getElementById('cart-count');
  const drawerCount = document.getElementById('drawer-cart-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const bodyEl = document.getElementById('cart-body');
  const footerEl = document.getElementById('cart-footer');
  const statusEl = document.getElementById('shipping-status-text');
  const barFillEl = document.getElementById('shipping-bar-fill');
  const shippingNoteEl = document.getElementById('cart-shipping-note');
  const demoNotice = document.getElementById('checkout-demo-notice');

  if (headerCount) headerCount.textContent = String(count);
  if (drawerCount) drawerCount.textContent = String(count);
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

  const threshold = BRAND_CONFIG.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);

  if (barFillEl) barFillEl.style.width = `${progress}%`;

  if (statusEl) {
    if (subtotal >= threshold) {
      statusEl.textContent = 'You have unlocked complimentary shipping.';
    } else if (subtotal === 0) {
      statusEl.textContent = `Complimentary shipping on orders ${formatShortPrice(threshold)}+.`;
    } else {
      statusEl.textContent = `Add ${formatPrice(remaining)} more for complimentary shipping.`;
    }
  }

  if (shippingNoteEl) {
    shippingNoteEl.textContent =
      subtotal >= threshold
        ? 'Complimentary standard shipping applied.'
        : 'Standard shipping calculated at checkout.';
  }

  if (!bodyEl || !footerEl) return;

  if (detailedItems.length === 0) {
    footerEl.hidden = true;
    if (demoNotice) demoNotice.hidden = true;
    bodyEl.innerHTML = `
      <div class="cart-empty">
        <p>Your ritual bag is currently empty.</p>
        <a href="#best-sellers" class="btn btn-secondary btn-sm" id="empty-cart-shop-link">Explore Best Sellers</a>
      </div>
    `;
    return;
  }

  footerEl.hidden = false;
  bodyEl.innerHTML = `
    <ul class="cart-list">
      ${detailedItems
        .map(
          (item) => `
          <li class="cart-item" data-cart-key="${item.key}">
            <img
              class="cart-item-img"
              src="${item.product.image}"
              alt="${item.product.name}"
              width="76"
              height="95"
            >
            <div class="cart-item-info">
              <div class="cart-item-header">
                <div>
                  <h3 class="cart-item-title">${item.product.name}</h3>
                  <p class="cart-item-variant">${item.variant.label} &middot; ${formatShortPrice(item.variant.price)}</p>
                </div>
                <strong class="tabular-nums">${formatPrice(item.lineTotal)}</strong>
              </div>

              <div class="cart-item-controls">
                <div class="qty-stepper" aria-label="Quantity for ${item.product.name}">
                  <button
                    type="button"
                    class="qty-btn"
                    data-action="qty-dec"
                    data-cart-key="${item.key}"
                    aria-label="Decrease quantity of ${item.product.name}"
                  >&minus;</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    data-action="qty-inc"
                    data-cart-key="${item.key}"
                    aria-label="Increase quantity of ${item.product.name}"
                  >+</button>
                </div>

                <button
                  type="button"
                  class="cart-remove-btn"
                  data-action="cart-remove"
                  data-cart-key="${item.key}"
                >Remove</button>
              </div>
            </div>
          </li>
        `
        )
        .join('')}
    </ul>
  `;
}

/* ==========================================================================
   Ritual Modal & Quick View Modal Rendering
   ========================================================================== */
function renderRitualModal() {
  const listEl = document.getElementById('ritual-steps-list');
  const fullBtn = document.getElementById('add-full-ritual-btn');
  if (!listEl) return;

  const ritualTotal = PRODUCTS.reduce((sum, p) => sum + p.variants[0].price, 0);
  if (fullBtn) {
    fullBtn.textContent = `Add Full 3-Step Ritual (${formatShortPrice(ritualTotal)})`;
  }

  listEl.innerHTML = PRODUCTS.map((product) => {
    const baseVariant = product.variants[0];
    return `
      <article class="ritual-step-card">
        <img
          class="ritual-step-img"
          src="${product.image}"
          alt="${product.name}"
          width="80"
          height="100"
        >
        <div>
          <div class="ritual-step-meta">${product.step} &middot; ${product.timing}</div>
          <h3 class="ritual-step-name">${product.name}</h3>
          <p class="ritual-step-desc">${product.howToUse}</p>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm ritual-step-cta"
          data-action="ritual-add-one"
          data-product-id="${product.id}"
          data-variant-id="${baseVariant.id}"
        >Add ${baseVariant.label} (${formatShortPrice(baseVariant.price)})</button>
      </article>
    `;
  }).join('');
}

function renderQuickView(productId) {
  const product = getProduct(productId);
  const container = document.getElementById('quick-view-content');
  if (!product || !container) return;

  state.quickViewProductId = productId;
  const activeVariant = getVariant(product, state.selectedVariants[productId]);

  const variantButtons = product.variants
    .map((variant) => {
      const isSelected = variant.id === activeVariant.id;
      return `
        <button
          type="button"
          class="variant-btn"
          data-action="select-variant"
          data-product-id="${product.id}"
          data-variant-id="${variant.id}"
          aria-pressed="${isSelected}"
        >${variant.label}</button>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="qv-media">
      <img src="${product.image}" alt="${product.alt}" width="720" height="900">
    </div>
    <div class="qv-details">
      <p class="eyebrow">${product.step} &middot; ${product.timing}</p>
      <div class="qv-header-row">
        <h2 id="qv-title" class="qv-title">${product.name}</h2>
        <span class="qv-price">${formatShortPrice(activeVariant.price)}</span>
      </div>
      <p class="qv-desc">${product.description}</p>

      <div class="qv-specs">
        <div>
          <span class="qv-spec-label">Key Actives</span>
          <span>${product.ingredients}</span>
        </div>
        <div>
          <span class="qv-spec-label">How to Use</span>
          <span>${product.howToUse}</span>
        </div>
      </div>

      <div class="variant-group" role="group" aria-label="Select size for ${product.name}">
        ${variantButtons}
      </div>

      <div class="qv-actions">
        <button
          type="button"
          class="btn btn-primary btn-full"
          data-action="qv-add-to-cart"
          data-product-id="${product.id}"
        >Add to Cart &mdash; ${formatShortPrice(activeVariant.price)}</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Accessible Overlay Manager (Tab Trap, Esc, Focus Restore)
   ========================================================================== */
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null);
}

function openOverlay(overlayEl, triggerEl) {
  if (!overlayEl) return;

  if (state.activeOverlay && state.activeOverlay !== overlayEl) {
    closeOverlay(state.activeOverlay, { restoreFocus: false });
  }

  closeMobileMenu();

  if (triggerEl && !state.lastFocusedElement) {
    state.lastFocusedElement = triggerEl;
  } else if (triggerEl && !state.activeOverlay) {
    state.lastFocusedElement = triggerEl;
  }

  state.activeOverlay = overlayEl;
  overlayEl.hidden = false;
  document.body.classList.add('overlay-open');

  if (overlayEl.id === 'cart-drawer') {
    const cartOpenBtn = document.getElementById('cart-open-btn');
    if (cartOpenBtn) cartOpenBtn.setAttribute('aria-expanded', 'true');
  }

  requestAnimationFrame(() => {
    overlayEl.classList.add('is-open');
    const focusables = getFocusableElements(overlayEl);
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  });
}

function closeOverlay(overlayEl, { restoreFocus = true } = {}) {
  if (!overlayEl || overlayEl.hidden) return;

  overlayEl.classList.remove('is-open');
  overlayEl.hidden = true;

  if (overlayEl.id === 'cart-drawer') {
    const cartOpenBtn = document.getElementById('cart-open-btn');
    if (cartOpenBtn) cartOpenBtn.setAttribute('aria-expanded', 'false');
    const demoNotice = document.getElementById('checkout-demo-notice');
    if (demoNotice) demoNotice.hidden = true;
  }

  if (state.activeOverlay === overlayEl) {
    state.activeOverlay = null;
    document.body.classList.remove('overlay-open');
  }

  if (restoreFocus && state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
    state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  } else if (restoreFocus) {
    state.lastFocusedElement = null;
  }
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    if (state.activeOverlay) {
      event.preventDefault();
      closeOverlay(state.activeOverlay);
      return;
    }
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav && !mobileNav.hidden) {
      closeMobileMenu({ restoreFocus: true });
    }
    return;
  }

  if (event.key === 'Tab' && state.activeOverlay) {
    const focusables = getFocusableElements(state.activeOverlay);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

/* ==========================================================================
   Mobile Navigation & Newsletter Form Validation
   ========================================================================== */
function toggleMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;

  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!isExpanded));
  nav.hidden = isExpanded;
}

function closeMobileMenu({ restoreFocus = false } = {}) {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav || nav.hidden) return;

  btn.setAttribute('aria-expanded', 'false');
  nav.hidden = true;
  if (restoreFocus) btn.focus();
}

function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const feedback = document.getElementById('newsletter-feedback');
  if (!form || !input || !feedback) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!value || !emailRegex.test(value)) {
      input.setAttribute('aria-invalid', 'true');
      feedback.className = 'form-feedback is-error';
      feedback.textContent = 'Please enter a valid email address (e.g., name@domain.com).';
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    feedback.className = 'form-feedback is-success';
    feedback.textContent = `Welcome to ${BRAND_CONFIG.name} — use code ${BRAND_CONFIG.promoCode} for 10% off your first ritual.`;
    form.reset();
    announce(feedback.textContent);
  });

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') {
      input.removeAttribute('aria-invalid');
      feedback.textContent = '';
      feedback.className = 'form-feedback';
    }
  });
}

/* ==========================================================================
   Event Wiring & Initialization
   ========================================================================== */
function initBrandText() {
  const headerLogo = document.getElementById('brand-name-header');
  const footerLogo = document.getElementById('brand-name-footer');
  if (headerLogo) headerLogo.textContent = BRAND_CONFIG.name;
  if (footerLogo) footerLogo.textContent = BRAND_CONFIG.name;
}

function initEvents() {
  document.addEventListener('keydown', handleGlobalKeydown);

  document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);

  document.getElementById('cart-open-btn')?.addEventListener('click', (event) => {
    openOverlay(document.getElementById('cart-drawer'), event.currentTarget);
  });

  document.getElementById('add-full-ritual-btn')?.addEventListener('click', (event) => {
    addFullRitual(event.currentTarget);
  });

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (BRAND_CONFIG.checkoutUrl) {
      window.location.href = BRAND_CONFIG.checkoutUrl;
      return;
    }
    const notice = document.getElementById('checkout-demo-notice');
    if (notice) {
      notice.hidden = false;
      notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      announce('Portfolio demo mode: checkout simulation notice displayed.');
    }
  });

  document.addEventListener('click', (event) => {
    const ritualTrigger = event.target.closest('[data-open-ritual]');
    if (ritualTrigger) {
      openOverlay(document.getElementById('ritual-modal'), ritualTrigger);
      return;
    }

    const closeTrigger = event.target.closest('[data-close-overlay]');
    if (closeTrigger) {
      const overlay = closeTrigger.closest('.overlay');
      closeOverlay(overlay);
      return;
    }

    if (event.target.closest('#empty-cart-shop-link')) {
      closeOverlay(document.getElementById('cart-drawer'), { restoreFocus: false });
      return;
    }

    if (event.target.closest('.mobile-nav-link[href]')) {
      closeMobileMenu();
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const { action, productId, variantId, cartKey } = actionEl.dataset;

    switch (action) {
      case 'select-variant':
        selectProductVariant(productId, variantId);
        break;
      case 'quick-view':
        renderQuickView(productId);
        openOverlay(document.getElementById('quick-view-modal'), actionEl);
        break;
      case 'add-to-cart':
        addToCart(productId, state.selectedVariants[productId], { triggerEl: actionEl });
        break;
      case 'qv-add-to-cart':
        addToCart(productId, state.selectedVariants[productId], {
          triggerEl: document.getElementById('cart-open-btn')
        });
        break;
      case 'ritual-add-one':
        addToCart(productId, variantId, {
          triggerEl: document.getElementById('cart-open-btn')
        });
        break;
      case 'qty-inc':
        updateCartQuantity(cartKey, 1);
        break;
      case 'qty-dec':
        updateCartQuantity(cartKey, -1);
        break;
      case 'cart-remove':
        removeCartItem(cartKey);
        break;
      default:
        break;
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMobileMenu();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBrandText();
  renderProducts();
  renderRitualModal();
  renderCart();
  initNewsletterForm();
  initEvents();
});

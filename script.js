/* FUTURISTIC E-STORE SCRIPT
   - Integrated Particle Animation System
   - HTML5 <template> Rendering
   - Persistent Cart & Smart Filters
   - Holographic Toasts & Auth Logic
   - Category Filtering & Mobile Menu
*/

(() => {
  'use strict';

  // --- CONFIGURATION ---
  const CONFIG = {
    particleColor: 'rgba(14, 165, 233, 0.5)', // Neon Blue
    particleSpeed: 0.5,
    particleCount: 60
  };

  // --- DOM ELEMENTS ---
  const el = {
    grid: document.getElementById('products'),
    template: document.getElementById('product-template'),
    canvas: document.getElementById('bg-canvas'),
    cartBtn: document.getElementById('cart-button'),
    cartPanel: document.getElementById('cart-panel'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    cartCount: document.getElementById('cart-count'),
    checkoutBtn: document.getElementById('checkout-btn'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    modalRoot: document.getElementById('modal-root'),
    filterContainer: document.getElementById('category-filters'), // Category Chips
  };

  // --- 1. FUTURISTIC BACKGROUND ANIMATION ---
  function initCanvas() {
    if (!el.canvas) return;
    const ctx = el.canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
      width = el.canvas.width = window.innerWidth;
      height = el.canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * CONFIG.particleSpeed;
        this.vy = (Math.random() - 0.5) * CONFIG.particleSpeed;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
      }
      draw() {
        ctx.fillStyle = CONFIG.particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
        // Draw connections if close
        particles.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    for (let i = 0; i < CONFIG.particleCount; i++) particles.push(new Particle());
    animate();
  }

  // --- 2. GENERATE SKELETONS (Loading State) ---
  function renderSkeletons() {
    if (!el.grid) return;
    el.grid.innerHTML = ''; // Clear grid
    // Create 4 fake cards
    for(let i=0; i<4; i++) {
      const div = document.createElement('div');
      div.className = 'product-card glass-panel skeleton-card';
      div.style.padding = '1rem';
      div.innerHTML = `
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text" style="width: 70%"></div>
        <div class="skeleton skeleton-text" style="width: 40%"></div>
        <div class="skeleton skeleton-text" style="width: 30%; margin-top:1rem"></div>
        <div class="skeleton skeleton-btn"></div>
      `;
      el.grid.appendChild(div);
    }
  }

  // --- 3. TEMPLATE RENDERING SYSTEM (With Quick View & Animation) ---
  function renderProducts(list) {
    if (!el.grid) return;
    el.grid.innerHTML = ''; // Clear current (Skeletons)
    
    if (list.length === 0) {
      el.grid.innerHTML = '<div class="glass-panel" style="grid-column:1/-1; padding:2rem; text-align:center;">No gear found in this sector.</div>';
      return;
    }

    list.forEach((product, index) => { 
      // Clone the HTML template
      const clone = el.template.content.cloneNode(true);
      
      // Populate Data
      const card = clone.querySelector('.product-card');
      const img = clone.querySelector('.product-image');
      
      // Animation Classes & Delays
      card.classList.add('entering');
      card.style.animationDelay = `${index * 0.1}s`;

      img.src = product.image;
      img.alt = product.name;
      
      clone.querySelector('.product-title').textContent = product.name;
      clone.querySelector('.product-desc').textContent = product.desc;
      clone.querySelector('.price').textContent = `$${product.price.toFixed(2)}`;
      
      // Generate Stars
      const ratingEl = clone.querySelector('.rating');
      ratingEl.innerHTML = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

      // Event Listener for "Add to Cart"
      const btn = clone.querySelector('.add-btn');
      btn.addEventListener('click', () => addToCart(product));

      // --- STEP C: QUICK VIEW SCANNER LOGIC ---
      // We create the button dynamically since it might not be in your HTML template
      let qvBtn = document.createElement('button');
      qvBtn.className = 'icon-btn quick-view'; // Re-using your icon-btn class
      qvBtn.innerHTML = '<i class="fas fa-eye"></i>';
      
      // Style it to float top-right over the image
      qvBtn.style.position = 'absolute';
      qvBtn.style.top = '10px';
      qvBtn.style.right = '10px';
      qvBtn.style.background = 'rgba(15, 23, 42, 0.8)';
      qvBtn.style.color = '#fff';
      qvBtn.style.border = '1px solid rgba(255,255,255,0.2)';
      qvBtn.title = "Quick Scan";

      // Append it to the image wrapper so it sits on top of the product image
      const imgWrapper = clone.querySelector('.image-wrapper');
      // Ensure wrapper handles absolute positioning
      imgWrapper.style.position = 'relative'; 
      imgWrapper.appendChild(qvBtn);

      // Add Click Listener
      qvBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop click from bubbling up
        if (typeof openQuickView === 'function') {
           openQuickView(product);
        } else {
           console.error("openQuickView function not found");
        }
      });
      // ----------------------------------------

      el.grid.appendChild(clone);
    });
  }

  // --- 4. CART LOGIC (State Management) ---
  let cart = JSON.parse(localStorage.getItem('future_cart')) || [];

  function addToCart(product) {
    cart.push(product);
    saveCart();
    updateCartUI();
    showToast(`Deployed ${product.name} to cart.`);
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('future_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    if(el.cartCount) el.cartCount.textContent = cart.length;
    if(el.cartItems) {
      el.cartItems.innerHTML = '';
      let total = 0;
      cart.forEach((item, index) => {
        total += item.price;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
          <img src="${item.image}" width="50" style="border-radius:8px">
          <div style="flex:1">
            <h4>${item.name}</h4>
            <div style="color:var(--neon-blue)">$${item.price.toFixed(2)}</div>
          </div>
          <button class="icon-btn remove-btn"><i class="fas fa-trash"></i></button>
        `;
        itemEl.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(index));
        el.cartItems.appendChild(itemEl);
      });
      if(el.cartTotal) el.cartTotal.textContent = `$${total.toFixed(2)}`;
    }
  }

  function toggleCart(isOpen) {
    if(!el.cartPanel) return;
    if (isOpen) {
      el.cartPanel.classList.add('open');
      el.cartPanel.setAttribute('aria-hidden', 'false');
    } else {
      el.cartPanel.classList.remove('open');
      el.cartPanel.setAttribute('aria-hidden', 'true');
    }
  }

  // --- 5. ADVANCED HOLOGRAPHIC TOAST SYSTEM ---
  function showToast(message, type = 'success') {
    // Create container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    
    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;

    // Add to screen
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutToast 0.4s forwards';
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3000);

    // Allow clicking to dismiss
    toast.addEventListener('click', () => toast.remove());
  }

  // --- 6. CATEGORY FILTER & SEARCH LOGIC ---
  let activeCategory = 'all';

  function handleCategory(e) {
    const btn = e.target;
    // Check if clicked element is a chip
    if (!btn.classList.contains('chip')) return;

    // 1. Update Visuals (Active State)
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    // 2. Update Logic State
    activeCategory = btn.getAttribute('data-category');

    // 3. Trigger Search to apply filter
    handleSearch();
  }

  function handleSearch() {
    const term = el.searchInput.value.toLowerCase();
    const sort = el.sortSelect.value;
    
    // NOTE: 'products' variable comes globally from data.js
    if (typeof products === 'undefined') return;

    let filtered = products.filter(p => {
        // Text Match
        const matchesText = p.name.toLowerCase().includes(term) || 
                            p.desc.toLowerCase().includes(term);
        // Category Match
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;

        return matchesText && matchesCategory;
    });

    // Sorting Logic
    if (sort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
    if (sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);

    renderProducts(filtered);
  }

  // --- 7. AUTHENTICATION LOGIC ---
  function setupAuth() {
    const authModal = document.getElementById('auth-modal');
    const loginTrigger = document.getElementById('login-trigger');
    const closeAuthBtn = document.getElementById('close-auth');
    const loginForm = document.getElementById('login-form');

    if (loginTrigger && authModal) {
      // Check existing session
      const user = localStorage.getItem('active_user');
      if (user) {
        loginTrigger.textContent = `Hi, ${user}`;
        loginTrigger.classList.add('text-neon');
      }

      // Open Modal or Logout
      loginTrigger.addEventListener('click', () => {
        if (localStorage.getItem('active_user')) {
          if(confirm('Disconnect session?')) {
            localStorage.removeItem('active_user');
            window.location.reload();
          }
        } else {
          authModal.hidden = false;
          setTimeout(() => authModal.setAttribute('aria-hidden', 'false'), 10);
        }
      });

      // Close Modal
      const closeAuth = () => {
        authModal.setAttribute('aria-hidden', 'true');
        setTimeout(() => authModal.hidden = true, 300);
      };
      if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuth);

      // Handle Submit
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('user-email').value;
          const username = email.split('@')[0];
          
          const btn = loginForm.querySelector('button');
          const originalText = btn.textContent;
          btn.textContent = 'Authenticating...';
          
          setTimeout(() => {
            localStorage.setItem('active_user', username);
            showToast(`Welcome back, Commander ${username}`);
            closeAuth();
            loginTrigger.textContent = `Hi, ${username}`;
            loginTrigger.classList.add('text-neon');
            btn.textContent = originalText;
          }, 1500);
        });
      }
    }
  }

  // --- 8. INITIALIZATION (The Brain) ---
  function init() {
    // 1. Start Visuals & Logic
    initCanvas();
    updateCartUI();
    setupAuth();

    // 2. Show Skeletons (Loading State)
    if(el.grid) renderSkeletons();

    // 3. Simulate Network Delay with Smooth Transition
    setTimeout(() => {
      // A) Fade out grid
      if(el.grid) {
        el.grid.style.transition = 'opacity 0.2s ease';
        el.grid.style.opacity = '0';
      
        // B) Swap Data after fade out
        setTimeout(() => {
          if (typeof products !== 'undefined') {
            renderProducts(products); // Render real data
          }
          el.grid.style.opacity = '1'; // Fade back in (triggers entering animation)
        }, 200);
      }
    }, 1500);

    // 4. Attach Event Listeners
    if (el.cartBtn) el.cartBtn.addEventListener('click', () => toggleCart(true));
    if (el.closeCart) el.closeCart.addEventListener('click', () => toggleCart(false));
    if (el.searchInput) el.searchInput.addEventListener('input', handleSearch);
    if (el.sortSelect) el.sortSelect.addEventListener('change', handleSearch);
    
    // Category Chip Listener
    if (el.filterContainer) {
        el.filterContainer.addEventListener('click', handleCategory);
    }

    // Checkout Navigation
    if (el.checkoutBtn) {
      el.checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
          showToast('Cart is empty. Acquire gear first.', 'error');
        } else {
          window.location.href = 'checkout.html';
        }
      });
    }

    // Mobile Menu Logic (Safe Check)
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (menuToggle && navList) {
      menuToggle.addEventListener('click', () => {
        const isActive = navList.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (isActive) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });

      // Close menu when a link is clicked
      navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navList.classList.remove('active');
          const icon = menuToggle.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        });
      });
    }
  }

  // --- 9. QUICK VIEW LOGIC ---
  function openQuickView(product) {
    if (!el.modalRoot) {
        // Fallback if modal-root is missing, create it
        const div = document.createElement('div');
        div.id = 'modal-root';
        document.body.appendChild(div);
        el.modalRoot = div;
    }

    // Lock scrolling on body
    document.body.style.overflow = 'hidden';
    
    // Inject HTML
    el.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="quick-modal">
          <button class="modal-close"><i class="fas fa-times"></i></button>
          
          <div class="modal-image-wrapper">
            <img src="earbuds.png" alt="Earbuds">
          </div>
          
          <div class="modal-content">
            <span class="modal-tag">In Stock</span>
            <h2 class="modal-title">Earbuds</h2>
            <div class="modal-price">$59.99</div>
            <p class="modal-desc">hello</p>
            
            <div class="modal-actions">
              <button class="btn btn-primary glow-effect add-trigger">Add to Cart</button>
              <button class="btn btn-outline close-trigger">Close Scanner</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Show it
    el.modalRoot.hidden = false;
    el.modalRoot.style.display = 'block';

    // Add Event Listeners for Buttons inside Modal
    const overlay = el.modalRoot.querySelector('.modal-overlay');
    const closeBtn = el.modalRoot.querySelector('.modal-close');
    const closeTrigger = el.modalRoot.querySelector('.close-trigger');
    const addBtn = el.modalRoot.querySelector('.add-trigger');

    function closeModal() {
      el.modalRoot.innerHTML = '';
      el.modalRoot.hidden = true;
      document.body.style.overflow = ''; // Unlock scroll
    }

    closeBtn.addEventListener('click', closeModal);
    closeTrigger.addEventListener('click', closeModal);
    
    // Close if clicking outside the box
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) closeModal();
    });

    addBtn.addEventListener('click', () => {
      addToCart(product);
      closeModal();
    });
  }
  // Boot up
  document.addEventListener('DOMContentLoaded', init);

})();
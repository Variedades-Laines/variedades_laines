import { categorias } from './categorias.js';
import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let productsData = []; // Store products for cart logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Content
    renderCategories();
    initFirebaseProducts(); // Load products from Firebase

    // 2. Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Initialize Interactive Features
    initFilters();
    initRevealOnScroll();
    initAddToCart();
    initContactForm();
    initCart(); // New: Cart functionality
});

// --- Rendering Functions ---

function renderCategories() {
    const filterContainer = document.getElementById('category-filters');
    if (!filterContainer) return;

    filterContainer.innerHTML = categorias.map(cat => `
        <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-filter="${cat.id}">
            ${cat.name}
        </button>
    `).join('');
}

function initFirebaseProducts() {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) return;

    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        productsData = [];
        productContainer.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const prod = { id: doc.id, ...doc.data() };
            productsData.push(prod);
            renderProductCard(prod, productContainer);
        });

        if (snapshot.empty) {
            productContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 50px;">No hay productos disponibles actualmente.</p>';
        }

        // Re-initialize add to cart listeners since elements are new
        initAddToCart();
    });
}

function renderProductCard(prod, container) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', prod.category);
    card.innerHTML = `
        <div class="product-img">
            ${prod.image ? `<img src="${prod.image}" alt="${prod.title}">` : `<i class="${prod.icon || 'fas fa-box'}"></i>`}
        </div>
        <div class="product-info">
            <span class="product-category">${prod.category.charAt(0).toUpperCase() + prod.category.slice(1)}</span>
            <h3 class="product-title">${prod.title}</h3>
            <p class="product-price">${prod.price}</p>
            <div class="add-to-cart" data-id="${prod.id}">
                <i class="fas fa-plus"></i>
            </div>
        </div>
    `;
    container.appendChild(card);
}

// --- Interactive Features ---

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const submitBtn = contactForm.querySelector('button');
        const originalText = submitBtn.innerText;
        
        submitBtn.innerText = 'Enviando...';
        submitBtn.disabled = true;

        setTimeout(() => {
            alert(`¡Gracias ${name}! Hemos recibido tu mensaje y te contactaremos pronto.`);
            contactForm.reset();
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

function initRevealOnScroll() {
    const revealElements = document.querySelectorAll('.feature-card, .product-card, .contact-info, .contact-form');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.15
    });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        revealObserver.observe(el);
    });
}

function initAddToCart() {
    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            const product = productsData.find(p => p.id === productId);
            
            if (product) {
                addToCart(product);
                // Simple feedback
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.style.background = '#25d366';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-plus"></i>';
                    btn.style.background = '';
                }, 1000);
            }
        });
    });
}

// --- Cart Logic ---

let cart = JSON.parse(localStorage.getItem('variedades_cart')) || [];

function initCart() {
    const cartBtn = document.getElementById('cart-btn');
    const closeCart = document.getElementById('close-cart');
    const cartModal = document.getElementById('cart-modal');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cartBtn) cartBtn.addEventListener('click', () => cartModal.classList.add('active'));
    if (closeCart) closeCart.addEventListener('click', () => cartModal.classList.remove('active'));
    
    // Close modal when clicking outside content
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) cartModal.classList.remove('active');
        });
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', sendToWhatsApp);

    updateCartUI();
}

function addToCart(product) {
    cart.push({ ...product, cartId: Date.now() }); // Unique ID for removal
    saveCart();
    updateCartUI();
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('variedades_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (cartCount) cartCount.innerText = cart.length;

    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Tu carrito está vacío.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img">${item.image ? `<img src="${item.image}" alt="${item.title}">` : `<i class="${item.icon}"></i>`}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">${item.price}</div>
                    </div>
                    <div class="remove-item" onclick="removeFromCart(${item.cartId})">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `).join('');
        }
    }

    // Calculate Total
    const total = cart.reduce((acc, item) => {
        const priceValue = parseInt(item.price.replace(/[^\d]/g, ''));
        return acc + priceValue;
    }, 0);

    if (cartTotalPrice) {
        cartTotalPrice.innerText = `C$ ${total.toLocaleString()}`;
    }

    // Expose removeFromCart to window for the onclick attribute
    window.removeFromCart = removeFromCart;
}

function sendToWhatsApp() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Añade algunos productos primero.');
        return;
    }

    const phoneNumber = '50588396182';
    let message = '¡Hola Variedades Laines! Me gustaría realizar un pedido:\n\n';
    
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.title}* - ${item.price}\n`;
    });

    const total = document.getElementById('cart-total-price').innerText;
    message += `\n*Total Estimado:* ${total}\n\n¿Me podrían confirmar disponibilidad?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}

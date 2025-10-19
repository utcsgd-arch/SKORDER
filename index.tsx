/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';


// --- API CLIENT ---
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// --- DATA ---
const CATEGORIES_DATA = [
    { name: "BEKOLITE", icon: "toggle_on", gradient: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%), linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { name: "BREAKER", icon: "bolt", gradient: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%), linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
    { name: "WIRE", icon: "cable", gradient: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%), linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)" },
    { name: "CHINA FITTING", icon: "settings_input_component", gradient: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%), linear-gradient(135deg, #ab68f4 0%, #6e48aa 100%)" },
    { name: "SK FAN", icon: "air", gradient: "radial-gradient(circle at 10% 90%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 30%), linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" }
];
const CATEGORIES = CATEGORIES_DATA.map(c => c.name);

let PRODUCTS = [];
let cart = [];
let productToUpdateImageId = null;
let currentUserRole = 'admin'; // Default role
let currentProductViewMode = 'grid';
let lastOrderDetails = null;
let lastViewBeforeCart = null;
const PRODUCTS_STORAGE_KEY = 'sk-accessories-products';


// --- DOM ELEMENTS ---
const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.nav-button');
const categoryMenu = document.getElementById('category-menu');
const toolsGrid = document.getElementById('tools-grid');
const productGrid = document.getElementById('product-grid');
const productsTitle = document.getElementById('products-title');
// FIX: Cast productSearchInput to HTMLInputElement to access 'value' property.
const productSearchInput = document.getElementById('product-search-input') as HTMLInputElement;
const cartItemsContainer = document.getElementById('cart-items');
const cartSummaryContainer = document.getElementById('cart-summary');
const cartBackBtn = document.getElementById('cart-back-btn');
// FIX: Cast pdfUploadInput to HTMLInputElement.
const pdfUploadInput = document.getElementById('pdf-upload') as HTMLInputElement;
// FIX: Cast imageUploadInput to HTMLInputElement.
const imageUploadInput = document.getElementById('image-upload') as HTMLInputElement;
const updateModal = document.getElementById('update-modal');
// FIX: Cast modalActionBtn to HTMLButtonElement to access 'textContent' property.
const modalActionBtn = document.getElementById('modal-action-btn') as HTMLButtonElement;
const addedList = document.getElementById('added-list');
const updatedList = document.getElementById('updated-list');
const notFoundList = document.getElementById('not-found-list');
const addedSection = document.getElementById('added-section');
const updatedSection = document.getElementById('updated-section');
const uncategorizedSection = document.getElementById('uncategorized-section');
const uncategorizedList = document.getElementById('uncategorized-list');
const notFoundSection = document.getElementById('not-found-section');
const updateLoading = document.getElementById('update-loading');
const updateResults = document.getElementById('update-results');
const imagePreviewModal = document.getElementById('image-preview-modal');
// FIX: Cast previewImage to HTMLImageElement to access 'src' property.
const previewImage = document.getElementById('preview-image') as HTMLImageElement;
const closePreviewBtn = document.querySelector('.close-preview-btn');
// FIX: Cast roleToggle to HTMLInputElement to access 'checked' property.
const roleToggle = document.getElementById('role-toggle') as HTMLInputElement;
const toolsNavBtn = document.getElementById('tools-nav-btn');
const toastNotification = document.getElementById('toast-notification');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');
const floatingCartBtn = document.getElementById('floating-cart-btn');
const floatingCartBadge = document.getElementById('floating-cart-badge');
const floatingCartTotal = document.getElementById('floating-cart-total');

// Customer Details Modal Elements
const customerDetailsModal = document.getElementById('customer-details-modal');
// FIX: Cast customerDetailsForm to HTMLFormElement to access 'reset' method.
const customerDetailsForm = document.getElementById('customer-details-form') as HTMLFormElement;
// FIX: Cast shopNameInput to HTMLInputElement to access 'value' property.
const shopNameInput = document.getElementById('shop-name') as HTMLInputElement;
// FIX: Cast addressInput to HTMLInputElement to access 'value' property.
const addressInput = document.getElementById('address') as HTMLInputElement;
// FIX: Cast phoneInput to HTMLInputElement to access 'value' property.
const phoneInput = document.getElementById('phone-number') as HTMLInputElement;
// FIX: Cast cityInput to HTMLInputElement to access 'value' property.
const cityInput = document.getElementById('city') as HTMLInputElement;
const customerDetailsConfirmBtn = document.getElementById('customer-details-confirm-btn');
const customerDetailsCancelBtn = document.getElementById('customer-details-cancel-btn');

// Order Confirmation Modal Elements
const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const confirmationCustomerDetails = document.getElementById('confirmation-customer-details');
const confirmationDetails = document.getElementById('confirmation-details');
const confirmationTotal = document.getElementById('confirmation-total');
// FIX: Cast confirmationFinishBtn to HTMLButtonElement to access 'disabled' and 'textContent' properties.
const confirmationFinishBtn = document.getElementById('confirmation-finish-btn') as HTMLButtonElement;

// Edit Product Modal Elements
const editProductModal = document.getElementById('edit-product-modal');
const editProductForm = document.getElementById('edit-product-form') as HTMLFormElement;
const editProductIdInput = document.getElementById('edit-product-id') as HTMLInputElement;
const editProductNameInput = document.getElementById('edit-product-name') as HTMLInputElement;
const editProductCodeInput = document.getElementById('edit-product-code') as HTMLInputElement;
const editProductPriceInput = document.getElementById('edit-product-price') as HTMLInputElement;
const editProductUomInput = document.getElementById('edit-product-uom') as HTMLInputElement;
const editProductSaveBtn = document.getElementById('edit-product-save-btn');
const editProductCancelBtn = document.getElementById('edit-product-cancel-btn');


// --- DATA PERSISTENCE ---
function saveProductsToLocalStorage() {
    try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PRODUCTS));
    } catch (e) {
        console.error("Failed to save products to localStorage:", e);
    }
}

function loadProductsFromLocalStorage() {
    try {
        const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (storedProducts) {
            PRODUCTS = JSON.parse(storedProducts);
        }
    } catch (e) {
        console.error("Failed to load products from localStorage:", e);
        PRODUCTS = []; // Start fresh if there's an error
    }
}


// --- ROLE MANAGEMENT ---
function handleRoleChange() {
    currentUserRole = roleToggle.checked ? 'admin' : 'customer';

    // Toggle admin-only UI elements
    toolsNavBtn.parentElement.style.display = currentUserRole === 'admin' ? 'flex' : 'none';
    
    // If user is switched to customer while on tools view, kick them to dashboard
    if (currentUserRole === 'customer' && document.getElementById('tools-view')?.classList.contains('active')) {
        showView('dashboard-view');
    }

    // Re-render products to show/hide admin controls
    if (document.getElementById('products-view')?.classList.contains('active')) {
        const currentCategory = productsTitle.textContent === 'All Products' ? undefined : productsTitle.textContent;
        renderProducts(currentCategory);
    }
}


// --- VIEW NAVIGATION ---
function showView(viewId, preventProductReset = false) {
  const currentActiveView = document.querySelector('.view.active');
  if (currentActiveView && viewId === 'cart-view') {
      // Store the last view before navigating to the cart
      lastViewBeforeCart = currentActiveView.id;
  }
    
  views.forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });
  // FIX: Cast button to HTMLElement to access dataset.
  navButtons.forEach((button: HTMLElement) => {
    button.classList.toggle('active', button.dataset.view === viewId);
  });

  // Hide floating cart button when on cart view to prevent overlap
  if (viewId === 'cart-view') {
      floatingCartBtn.classList.remove('visible');
  } else {
      // When switching to other views, re-evaluate if the cart button should be shown
      updateFloatingCart();
  }

  // Special handling for products view to reset to all products when using nav
  if (viewId === 'products-view' && !preventProductReset) {
    productSearchInput.value = ''; // Clear search on nav click
    // FIX: Calling renderProducts without arguments is now valid as the parameter is optional.
    renderProducts();
  }
}

// --- RENDERING LOGIC ---

function renderDashboard() {
  categoryMenu.innerHTML = '';
  CATEGORIES_DATA.forEach(category => {
    const menuItem = document.createElement('button');
    menuItem.className = 'category-menu-item';
    // Use a custom property for the gradient to be used in CSS hover effects
    menuItem.style.setProperty('--category-gradient', category.gradient);
    menuItem.innerHTML = `
        <span class="material-symbols-outlined">${category.icon}</span>
        <span>${category.name}</span>
    `;
    menuItem.onclick = () => {
      productSearchInput.value = ''; // Clear search when selecting a new category
      renderProducts(category.name);
      showView('products-view', true); // Pass true to prevent reset
    };
    categoryMenu.appendChild(menuItem);
  });
}

function renderTools() {
    toolsGrid.innerHTML = '';
    
    // Card 1: Bulk Rate Update
    const bulkUpdateCard = document.createElement('div');
    bulkUpdateCard.className = 'category-card';
    bulkUpdateCard.style.background = 'linear-gradient(135deg, #6c757d 0%, #343a40 100%)';
    bulkUpdateCard.innerHTML = `
        <span class="material-symbols-outlined">upload_file</span>
        <div class="card-content">
            <h4>Bulk Rate Update</h4>
            <p style="font-size: 0.8rem; font-weight: 400; margin: 4px 0 0 0;">Add or update prices via PDF</p>
        </div>
    `;
    bulkUpdateCard.onclick = promptBulkUpdate;
    toolsGrid.appendChild(bulkUpdateCard);
}

// FIX: Made the category parameter optional to allow calling renderProducts().
function renderProducts(category?: string) {
  productGrid.innerHTML = '';
  productsTitle.textContent = category ? category : 'All Products';
  let productsToDisplay = category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS;

  // Filter based on search input
  const searchTerm = productSearchInput.value.trim().toLowerCase();
  if (searchTerm) {
      productsToDisplay = productsToDisplay.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.code.toLowerCase().includes(searchTerm)
      );
  }

  if (productsToDisplay.length === 0) {
      if (searchTerm) {
          productGrid.innerHTML = `<p>No products found for "${productSearchInput.value}".</p>`;
      } else if (PRODUCTS.length === 0) {
          productGrid.innerHTML = `<p>No products found. Use the 'Tools' section to upload a product list.</p>`;
      } else {
           productGrid.innerHTML = `<p>No products found in this category.</p>`;
      }
      return;
  }
  
  productsToDisplay.forEach(product => {
    const card = document.createElement('div');
    const adminControlsHtml = currentUserRole === 'admin' ? `
        <button class="btn btn-icon edit-details-btn" title="Edit Product Details">
            <span class="material-symbols-outlined">edit_note</span>
        </button>
        <button class="btn btn-icon edit-image-btn" title="Edit Image">
            <span class="material-symbols-outlined">image</span>
        </button>
    ` : '';
    const actionsHtml = `
        <div class="product-card-actions">
            <input type="number" class="product-quantity-input" value="1" min="1" aria-label="Quantity">
            <button class="btn add-btn">ADD</button>
            ${adminControlsHtml}
        </div>
    `;
    
    if (currentProductViewMode === 'grid') {
        card.className = 'product-card';
        card.innerHTML = `
          <img src="${product.imageUrl}" alt="${product.name}">
          <div class="card-content">
            <div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-code">Code: ${product.code}</p>
                <p class="product-price">Rs. ${product.price.toFixed(2)} <span class="uom">/ ${product.uom}</span></p>
            </div>
            ${actionsHtml}
          </div>
        `;
    } else { // List view
        card.className = 'product-card list-view';
        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="card-content">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-code">Code: ${product.code}</p>
                    <p class="product-price">Rs. ${product.price.toFixed(2)} <span class="uom">/ ${product.uom}</span></p>
                </div>
                ${actionsHtml}
            </div>
        `;
    }
    
    const addButton = card.querySelector('.add-btn');
    // FIX: Cast quantityInputEl to HTMLInputElement to access value property.
    const quantityInputEl = card.querySelector('.product-quantity-input') as HTMLInputElement;

    addButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const quantity = parseInt(quantityInputEl.value, 10);
      if (!isNaN(quantity) && quantity > 0) {
        const imgEl = card.querySelector('img');
        if (imgEl) {
            animateItemToCart(imgEl);
        }
        addToCart(product.id, quantity);
        quantityInputEl.value = '1'; // Reset quantity after adding
      }
    });
    
    // Prevent clicks inside the input from triggering other card actions
    quantityInputEl.addEventListener('click', (e) => e.stopPropagation());

    if (currentUserRole === 'admin') {
        card.querySelector('.edit-image-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            initiateProductImageUpdate(product.id);
        });
        card.querySelector('.edit-details-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            initiateProductDetailsUpdate(product.id);
        });
    }

    card.querySelector('img').addEventListener('click', (e) => {
        e.stopPropagation();
        showImagePreview(product.imageUrl);
    });
    productGrid.appendChild(card);
  });
}

function renderCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Your order is empty.</p>';
    cartSummaryContainer.style.display = 'none';
    return;
  }
  
  cartSummaryContainer.style.display = 'block';
  let total = 0;

  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    total += product.price * item.quantity;

    const cartItemEl = document.createElement('div');
    cartItemEl.className = 'cart-item';
    cartItemEl.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}">
      <div class="cart-item-info">
        <h4>${product.name}</h4>
        <p>Rs. ${product.price.toFixed(2)} <span class="uom">/ ${product.uom}</span></p>
      </div>
      <div class="cart-item-actions">
        <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-product-id="${product.id}">
        <button class="btn btn-danger remove-btn" data-product-id="${product.id}">&times;</button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItemEl);
  });

  cartSummaryContainer.innerHTML = `
    <h3>Total: Rs. ${total.toFixed(2)}</h3>
    <button class="btn btn-success" id="place-order-btn">Place Your Order</button>
  `;

  // Add event listeners after rendering
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      // FIX: Cast e.target to HTMLInputElement to access dataset and value.
      const target = e.target as HTMLInputElement;
      updateQuantity(target.dataset.productId, parseInt(target.value, 10));
    });
  });

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      // FIX: Cast e.target to HTMLButtonElement to access dataset.
      const target = e.target as HTMLButtonElement;
      removeFromCart(target.dataset.productId);
    });
  });

  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
}


// --- CART LOGIC ---

// Animate item flying to cart
function animateItemToCart(sourceImg) {
    const imgRect = sourceImg.getBoundingClientRect();
    const cartRect = floatingCartBtn.getBoundingClientRect();

    const flyingImg = document.createElement('img');
    flyingImg.src = sourceImg.src;
    flyingImg.classList.add('fly-to-cart');
    flyingImg.style.left = `${imgRect.left}px`;
    flyingImg.style.top = `${imgRect.top}px`;
    flyingImg.style.width = `${imgRect.width}px`;
    flyingImg.style.height = `${imgRect.height}px`;

    document.body.appendChild(flyingImg);

    // Trigger the animation by changing properties after the element is in the DOM
    requestAnimationFrame(() => {
        flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
        flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
        flyingImg.style.width = '0px';
        flyingImg.style.height = '0px';
        flyingImg.style.transform = 'translate(-50%, -50%) rotate(360deg)';
    });

    // Remove the element after the animation completes
    setTimeout(() => {
        flyingImg.remove();
    }, 800); // Must match animation duration in CSS
}

function addToCart(productId, quantity) {
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  updateFloatingCart();
  
  // Add visual feedback to floating cart
  floatingCartBtn.classList.add('added');
  setTimeout(() => {
      floatingCartBtn.classList.remove('added');
  }, 1000); // Duration of green color

  if (document.getElementById('cart-view')?.classList.contains('active')) {
      renderCart();
  }
}

function removeFromCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const confirmationMessage = product 
        ? `Are you sure you want to remove '${product.name}' from your order?` 
        : 'Are you sure you want to remove this item?';

    if (window.confirm(confirmationMessage)) {
        cart = cart.filter(item => item.productId !== productId);
        updateFloatingCart();
        renderCart();
    }
}

function updateQuantity(productId, quantity) {
  const item = cart.find(item => item.productId === productId);
  if (item) {
    if (quantity > 0) {
      item.quantity = quantity;
    } else {
      removeFromCart(productId);
      return;
    }
  }
  updateFloatingCart();
  renderCart();
}

function updateFloatingCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        const totalAmount = cart.reduce((sum, item) => {
            const product = PRODUCTS.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        floatingCartBadge.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
        floatingCartTotal.textContent = `Rs. ${totalAmount.toFixed(2)}`;
        floatingCartBtn.classList.add('visible');
    } else {
        floatingCartBtn.classList.remove('visible');
    }
}

function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    // Open the customer details modal instead of showing confirmation directly
    customerDetailsForm.reset();
    customerDetailsModal.style.display = 'flex';
    shopNameInput.focus();
}

function handleConfirmOrder() {
    const shopName = shopNameInput.value.trim();
    const address = addressInput.value.trim();
    const phone = phoneInput.value.trim();
    const city = cityInput.value.trim();

    if (!shopName || !address || !phone || !city) {
        alert("All fields are necessary. Please fill out the form completely.");
        return;
    }

    // If validation is successful
    lastOrderDetails = {
        customer: { shopName, address, phone, city },
        cart: [...cart] // Create a snapshot of the cart at the time of order
    };
    closeCustomerDetailsModal();
    showOrderConfirmation();
}

function showOrderConfirmation() {
    if (!lastOrderDetails) return;

    const { customer, cart: orderCart } = lastOrderDetails;
    
    // Populate Customer Details
    confirmationCustomerDetails.innerHTML = `
        <h4>Shipping Details</h4>
        <p><strong>Shop:</strong> ${customer.shopName}</p>
        <p><strong>Address:</strong> ${customer.address}, ${customer.city}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
    `;

    // Populate Order Items in a table
    let grandTotal = 0;
    let tableBodyHtml = '';
    orderCart.forEach(item => {
        const product = PRODUCTS.find(p => p.id === item.productId);
        const subtotal = product.price * item.quantity;
        grandTotal += subtotal;
        tableBodyHtml += `
            <tr>
                <td>
                    <span class="confirmation-item-name">${product.name}</span>
                    <span class="confirmation-item-code">Code: ${product.code}</span>
                </td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">Rs. ${product.price.toFixed(2)}</td>
                <td class="text-right">Rs. ${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    const tableHtml = `
        <table class="confirmation-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${tableBodyHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">Grand Total</td>
                    <td class="text-right">Rs. ${grandTotal.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;

    confirmationDetails.innerHTML = tableHtml;
    confirmationTotal.textContent = ''; // Clear the old total as it's now in the table
    orderConfirmationModal.style.display = 'flex';
}

/**
 * Converts a base64 data URL to a Blob object.
 */
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


async function handleFinishAndShare() {
    if (!lastOrderDetails) return;

    const modalContent = orderConfirmationModal.querySelector('.modal-content');
    if (!modalContent) return;

    // Show a temporary loading state on the button
    confirmationFinishBtn.textContent = 'Processing...';
    confirmationFinishBtn.disabled = true;

    try {
        // FIX: Cast modalContent to HTMLElement as required by html2canvas.
        const canvas = await html2canvas(modalContent as HTMLElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        // 1. Save as JPG (always do this as requested)
        const fileName = `order-${lastOrderDetails.customer.shopName.replace(/\s/g, '_')}-${Date.now()}.jpg`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        
        showToast("Order saved to your photo gallery!");

        // 2. Share JPG using Web Share API
        const blob = dataURLtoBlob(dataUrl);
        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
        
        // Check if Web Share API is available for files
        if (navigator.share && navigator.canShare({ files: [imageFile] })) {
            const { customer } = lastOrderDetails;
            const shareText = `Here is the new order for ${customer.shopName}.`;

            await navigator.share({
                files: [imageFile],
                title: `SK Accessories Order - ${customer.shopName}`,
                text: shareText,
            });
            setTimeout(closeConfirmationModal, 500);
        } else {
            // Fallback for browsers that don't support sharing files
            console.warn("Web Share API for files not supported, falling back to text share.");
            const { customer, cart: orderCart } = lastOrderDetails;
            let grandTotal = 0;
            let itemsText = orderCart.map(item => {
                const product = PRODUCTS.find(p => p.id === item.productId);
                grandTotal += product.price * item.quantity;
                return `- ${item.quantity} x ${product.name} (@ Rs. ${product.price.toFixed(2)})`;
            }).join('\n');

            const message = `*New Order for SK Accessories*\n\n` +
                            `*Shop Name:* ${customer.shopName}\n` +
                            `*Address:* ${customer.address}, ${customer.city}\n` +
                            `*Phone:* ${customer.phone}\n\n` +
                            `*Order Items:*\n${itemsText}\n\n` +
                            `*Grand Total: Rs. ${grandTotal.toFixed(2)}*\n\n` +
                            `*Please see the order image which was just saved to your device.*\n\n` +
                            `Thank you!`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            setTimeout(closeConfirmationModal, 500);
        }

    } catch (error) {
        // Handle potential errors, including user cancelling the share action
        if (error instanceof DOMException && error.name === 'AbortError') {
             console.log("Share action was cancelled by the user.");
             setTimeout(closeConfirmationModal, 200);
        } else {
            console.error("Failed to finish and share order:", error);
            alert("Could not process the order for sharing. Please use the downloaded image manually.");
            closeConfirmationModal();
        }
    }
}


function closeConfirmationModal() {
    orderConfirmationModal.style.display = 'none';
    // Restore button state
    confirmationFinishBtn.textContent = 'Finish & Share';
    confirmationFinishBtn.disabled = false;
    
    // Clear cart and navigate after closing the modal
    cart = [];
    lastOrderDetails = null;
    updateFloatingCart();
    renderCart(); // to show the empty message
    showView('dashboard-view');
}


// --- MODAL LOGIC ---
function closeCustomerDetailsModal() {
    customerDetailsModal.style.display = 'none';
}


// --- PRODUCT EDIT LOGIC ---
function initiateProductDetailsUpdate(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
        console.error("Product not found for details update:", productId);
        return;
    }
    
    // Populate the modal
    editProductIdInput.value = product.id;
    editProductNameInput.value = product.name;
    editProductCodeInput.value = product.code;
    editProductPriceInput.value = product.price.toString();
    editProductUomInput.value = product.uom;
    
    // Show the modal
    editProductModal.style.display = 'flex';
}

function handleProductDetailsUpdate() {
    const productId = editProductIdInput.value;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
        showToast("Error: Could not find product to update.");
        return;
    }
    
    const newName = editProductNameInput.value.trim();
    const newCode = editProductCodeInput.value.trim();
    const newPrice = parseFloat(editProductPriceInput.value);
    const newUom = editProductUomInput.value.trim();

    if (!newName || !newCode || isNaN(newPrice) || !newUom) {
        alert("All fields are required and price must be a number.");
        return;
    }

    // Update product object
    product.name = newName;
    product.code = newCode;
    product.price = newPrice;
    product.uom = newUom;

    saveProductsToLocalStorage();
    closeEditProductModal();
    showToast(`'${product.name}' updated successfully!`);

    // Re-render current view to reflect changes
    if (document.getElementById('products-view')?.classList.contains('active')) {
        const currentCategory = productsTitle.textContent === 'All Products' ? undefined : productsTitle.textContent;
        renderProducts(currentCategory);
    }
    if (cart.some(item => item.productId === productId)) {
        renderCart(); // Update cart view if open
    }
    updateFloatingCart(); // Always update floating cart
}

function closeEditProductModal() {
    editProductModal.style.display = 'none';
    editProductForm.reset();
}


// --- IMAGE UPDATE LOGIC ---
function initiateProductImageUpdate(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
        console.error("Product not found for image update:", productId);
        return;
    }
    productToUpdateImageId = product.id;
    imageUploadInput.click();
}

function handleImageFileSelect(event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !productToUpdateImageId) {
        // Reset state in case something went wrong
        target.value = '';
        productToUpdateImageId = null;
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const product = PRODUCTS.find(p => p.id === productToUpdateImageId);

        if (product) {
            product.imageUrl = imageUrl;
            saveProductsToLocalStorage(); // Save after updating image

            // Refresh the product grid, preserving the last-used filter.
            const currentFilter = productsTitle.textContent;
            if (currentFilter && CATEGORIES.includes(currentFilter)) {
                renderProducts(currentFilter);
            } else {
                renderProducts(); // Default to 'All Products'
            }

            // Also refresh the cart content in the background, in case the updated item is in the cart.
            renderCart();
        }

        // Reset for next time
        target.value = '';
        productToUpdateImageId = null;
    };

    reader.readAsDataURL(file);
}

// --- BULK UPDATE LOGIC ---
function promptBulkUpdate() {
    pdfUploadInput.click();
}

async function handleFileSelect(event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    showUpdateModal([], [], [], true); // Show loading modal

    const parsedData = await parsePdfWithGemini(file);

    if (!parsedData || parsedData.length === 0) {
        hideUpdateModal();
        target.value = ''; // Reset input
        return;
    }

    const updatedItems = [];
    const addedItems = [];
    const uncategorizedItems = [];

    const categoryMap = {
        'SKB': 'BEKOLITE',
        'SKBR': 'BREAKER',
        'SKW': 'WIRE',
        'SKCF': 'CHINA FITTING',
        'SKFAN': 'SK FAN',
    };

    const getCategoryFromCode = (code) => {
        for (const prefix in categoryMap) {
            if (code.startsWith(prefix)) {
                return categoryMap[prefix];
            }
        }
        return 'Uncategorized'; // Fallback
    };

    parsedData.forEach(item => {
        const product = PRODUCTS.find(p => p.code === item.code);
        if (product) {
            // Update existing product
            if (product.price !== item.rate || product.uom !== item.uom) {
                updatedItems.push({ product, oldPrice: product.price, oldUom: product.uom });
                product.price = item.rate;
                product.uom = item.uom;
            }
        } else {
            // Add new product
            const category = getCategoryFromCode(item.code);
            const newProduct = {
                id: `p${Date.now()}-${item.code}`,
                code: item.code,
                name: item.name,
                price: item.rate,
                imageUrl: `https://picsum.photos/seed/${item.code}/300/200`,
                category: category,
                uom: item.uom,
            };
            PRODUCTS.push(newProduct);
            if (category === 'Uncategorized') {
                uncategorizedItems.push(newProduct);
            } else {
                addedItems.push(newProduct);
            }
        }
    });
    
    saveProductsToLocalStorage(); // Save after processing the whole file
    showUpdateModal(updatedItems, addedItems, uncategorizedItems);
    
    // Reset the input value to allow uploading the same file again
    target.value = '';
}

// Converts a File object to a GoogleGenerativeAI.Part object.
// FIX: Type the file parameter and specify the Promise resolve type as string to fix type error.
async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      // FIX: Cast reader.result to string to use split method.
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}


// Parses a PDF file using Gemini and returns structured data
// FIX: Add File type annotation for the file parameter.
async function parsePdfWithGemini(file: File) {
    const pdfPart = await fileToGenerativePart(file);
    const prompt = `You are an expert data extraction system. Your task is to extract product information from the provided PDF document, which is a price list.
For each product, identify and extract the following four fields from the columns which may be labelled CODE, ITEM, RATE, and UOM:
1. 'code': The product's CODE or unique identifier.
2. 'name': The product's ITEM name or description.
3. 'rate': The product's RATE or price, returned as a number.
4. 'uom': The product's Unit of Measurement (UOM), such as 'piece', 'box', or 'dozen'.

Please return the extracted information as a clean JSON array of objects. Do not include any text or explanations outside of the JSON array itself.`;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: prompt }, pdfPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING, description: 'The product code.' },
                    name: { type: Type.STRING, description: 'The name of the product.' },
                    rate: { type: Type.NUMBER, description: 'The price of the product.' },
                    uom: { type: Type.STRING, description: 'The unit of measurement.' },
                  },
                  required: ['code', 'name', 'rate', 'uom'],
                },
              },
          },
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error parsing PDF with Gemini:", error);
        alert("Failed to parse the PDF. Please ensure it's a valid product list and try again.");
        return null;
    }
}

function showUpdateModal(
    updatedItems,
    addedItems,
    uncategorizedItems,
    loading = false
) {
    updatedList.innerHTML = '';
    addedList.innerHTML = '';
    uncategorizedList.innerHTML = '';
    notFoundSection.style.display = 'none';

    if (loading) {
        updateLoading.style.display = 'block';
        updateResults.style.display = 'none';
        updateModal.style.display = 'flex';
        return;
    }

    updateLoading.style.display = 'none';
    updateResults.style.display = 'block';

    if (addedItems.length > 0) {
        addedSection.style.display = 'block';
        addedItems.forEach(product => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="product-details">${product.name} (${product.code})</span>
                <span class="price-change"><strong>Rs. ${product.price.toFixed(2)} <span class="uom">/ ${product.uom}</span></strong></span>
            `;
            addedList.appendChild(li);
        });
    } else {
        addedSection.style.display = 'none';
    }

    if (updatedItems.length > 0) {
        updatedSection.style.display = 'block';
        updatedItems.forEach(({ product, oldPrice, oldUom }) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="product-details">${product.name} (${product.code})</span>
                <span class="price-change">
                    <del>Rs. ${oldPrice.toFixed(2)} <span class="uom">/ ${oldUom || 'N/A'}</span></del> &rarr; <strong>Rs. ${product.price.toFixed(2)} <span class="uom">/ ${product.uom}</span></strong>
                </span>
            `;
            updatedList.appendChild(li);
        });
    } else {
        updatedSection.style.display = 'none';
    }

    if (uncategorizedItems.length > 0) {
        uncategorizedSection.style.display = 'block';
        const categoryOptions = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
        uncategorizedItems.forEach(product => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="product-details">${product.name} (${product.code})</span>
                <select data-product-id="${product.id}">${categoryOptions}</select>
            `;
            uncategorizedList.appendChild(li);
        });
        modalActionBtn.textContent = 'Save & Close';
    } else {
        uncategorizedSection.style.display = 'none';
        modalActionBtn.textContent = 'Close';
    }
    
    if (addedItems.length === 0 && updatedItems.length === 0 && uncategorizedItems.length === 0) {
        updatedSection.style.display = 'block'; // Reuse updated section for the message
        updatedList.innerHTML = `<li class="empty-state">No products were added or updated from the file.</li>`;
    }

    updateModal.style.display = 'flex';
}

function handleModalAction() {
    const categorySelects = document.querySelectorAll('#uncategorized-list select');
    if (categorySelects.length > 0) {
        categorySelects.forEach(select => {
            // FIX: Cast select to HTMLSelectElement to access dataset and value.
            const selectEl = select as HTMLSelectElement;
            const productId = selectEl.dataset.productId;
            const newCategory = selectEl.value;
            const product = PRODUCTS.find(p => p.id === productId);
            if (product) {
                product.category = newCategory;
            }
        });
        saveProductsToLocalStorage(); // Save after assigning categories
    }
    hideUpdateModal();
}

function hideUpdateModal() {
    updateModal.style.display = 'none';
    // Re-render products in case prices changed or categories were added
    renderDashboard();
    if (document.getElementById('products-view')?.classList.contains('active')) {
        renderProducts(productsTitle.textContent === 'All Products' ? undefined : productsTitle.textContent);
    }
}

// --- IMAGE PREVIEW LOGIC ---
function showImagePreview(imageUrl) {
    previewImage.src = imageUrl;
    imagePreviewModal.style.display = 'flex';
}

function hideImagePreview() {
    imagePreviewModal.style.display = 'none';
    previewImage.src = ''; // Clear src to prevent flash of old image
}

// --- TOAST NOTIFICATION ---
function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

// --- VIEW SWITCHER LOGIC ---
function setProductViewMode(mode) {
    currentProductViewMode = mode;
    if (mode === 'grid') {
        productGrid.classList.remove('list-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        productGrid.classList.add('list-view');
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    }
    // Re-render with the current category
    const currentCategory = productsTitle.textContent === 'All Products' ? undefined : productsTitle.textContent;
    renderProducts(currentCategory);
}


// --- INITIALIZATION ---
function initialize() {
  loadProductsFromLocalStorage(); // Load data first!

  // FIX: Cast button to HTMLElement to access dataset.
  navButtons.forEach((button: HTMLElement) => {
    button.addEventListener('click', () => {
      const viewId = button.dataset.view;
      if (viewId) {
        if (viewId === 'cart-view') {
            renderCart();
        } else if (viewId === 'tools-view') {
            renderTools();
        }
        showView(viewId);
      }
    });
  });

  roleToggle.addEventListener('change', handleRoleChange);
  pdfUploadInput.addEventListener('change', handleFileSelect);
  imageUploadInput.addEventListener('change', handleImageFileSelect);
  modalActionBtn.addEventListener('click', handleModalAction);
  updateModal.addEventListener('click', (e) => {
    if (e.target === updateModal) {
        handleModalAction();
    }
  });

  closePreviewBtn.addEventListener('click', hideImagePreview);
  imagePreviewModal.addEventListener('click', (e) => {
      if (e.target === imagePreviewModal) {
          hideImagePreview();
      }
  });
  
  productSearchInput.addEventListener('input', () => {
      const currentCategory = productsTitle.textContent === 'All Products' ? undefined : productsTitle.textContent;
      renderProducts(currentCategory);
  });

  // Cart back button listener
  cartBackBtn.addEventListener('click', () => {
    // Default to dashboard if no previous view is stored
    const viewToGoBackTo = lastViewBeforeCart || 'dashboard-view';
    // Use true for preventProductReset to return to the exact same product list
    showView(viewToGoBackTo, true);
  });

  // View Switcher Listeners
  gridViewBtn.addEventListener('click', () => setProductViewMode('grid'));
  listViewBtn.addEventListener('click', () => setProductViewMode('list'));
  
  // Floating Cart Listener
  floatingCartBtn.addEventListener('click', () => {
    renderCart();
    showView('cart-view');
  });

  // Customer Details Modal Listeners
  customerDetailsConfirmBtn.addEventListener('click', handleConfirmOrder);
  customerDetailsCancelBtn.addEventListener('click', closeCustomerDetailsModal);
  customerDetailsModal.addEventListener('click', (e) => {
      if (e.target === customerDetailsModal) {
          closeCustomerDetailsModal();
      }
  });

  // Order Confirmation Modal Listeners
  confirmationFinishBtn.addEventListener('click', handleFinishAndShare);
  orderConfirmationModal.addEventListener('click', (e) => {
      if (e.target === orderConfirmationModal) {
          // Do not close on background click, only via button
      }
  });

  // Edit Product Modal Listeners
  editProductSaveBtn.addEventListener('click', handleProductDetailsUpdate);
  editProductCancelBtn.addEventListener('click', closeEditProductModal);
  editProductModal.addEventListener('click', (e) => {
      if (e.target === editProductModal) {
          closeEditProductModal();
      }
  });


  renderDashboard();
  showView('dashboard-view');
  handleRoleChange(); // Set initial role state
  updateFloatingCart(); // Update cart on initial load
}

initialize();
// Estado da aplicação
let currentView = 'loading'; // loading, main, login, admin
let selectedProducts = [];
let allProducts = [];
let categories = [];
let isAuthenticated = false;
let editingProduct = null;

// Elementos DOM
const elements = {
    loading: document.getElementById('loading'),
    mainApp: document.getElementById('main-app'),
    loginScreen: document.getElementById('login-screen'),
    adminPanel: document.getElementById('admin-panel'),
    weekInfo: document.getElementById('week-info'),
    productsListClient: document.getElementById('products-list-client'),
    orderSummary: document.getElementById('order-summary'),
    itemsCount: document.getElementById('items-count'),
    totalPrice: document.getElementById('total-price'),
    selectedItems: document.getElementById('selected-items'),
    summaryDetails: document.getElementById('summary-details'),
    productModal: document.getElementById('product-modal'),
    productForm: document.getElementById('product-form'),
    productsManagement: document.getElementById('products-management'),
    productsList: document.getElementById('products-list'),
    totalProducts: document.getElementById('total-products'),
    activeList: document.getElementById('active-list')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthentication();
});

// Event Listeners
function setupEventListeners() {
    // Links de navegação
    document.getElementById('admin-link').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    document.getElementById('back-to-list').addEventListener('click', (e) => {
        e.preventDefault();
        showMainApp();
    });
    
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Admin actions
    document.getElementById('manage-products-btn').addEventListener('click', showProductsManagement);
    document.getElementById('add-product-btn').addEventListener('click', () => showProductModal());
    
    // Modal
    document.getElementById('close-modal').addEventListener('click', hideProductModal);
    document.getElementById('cancel-product').addEventListener('click', hideProductModal);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Order summary
    document.getElementById('toggle-summary').addEventListener('click', toggleSummary);
    document.getElementById('send-whatsapp').addEventListener('click', sendWhatsAppMessage);
    
    // Click fora do modal para fechar
    elements.productModal.addEventListener('click', (e) => {
        if (e.target === elements.productModal) {
            hideProductModal();
        }
    });
}

// Autenticação
async function checkAuthentication() {
    try {
        const response = await fetch('/api/admin/check-auth');
        const data = await response.json();
        isAuthenticated = data.authenticated;
        
        if (isAuthenticated) {
            showAdminPanel();
        } else {
            loadMainApp();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        loadMainApp();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = true;
            showAdminPanel();
        } else {
            alert('Credenciais inválidas');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        isAuthenticated = false;
        showMainApp();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Navegação entre telas
function showView(viewName) {
    // Esconder todas as telas
    elements.loading.classList.add('hidden');
    elements.mainApp.classList.add('hidden');
    elements.loginScreen.classList.add('hidden');
    elements.adminPanel.classList.add('hidden');
    
    // Mostrar tela específica
    switch(viewName) {
        case 'loading':
            elements.loading.classList.remove('hidden');
            break;
        case 'main':
            elements.mainApp.classList.remove('hidden');
            break;
        case 'login':
            elements.loginScreen.classList.remove('hidden');
            break;
        case 'admin':
            elements.adminPanel.classList.remove('hidden');
            break;
    }
    
    currentView = viewName;
}

function showLogin() {
    showView('login');
}

function showMainApp() {
    showView('main');
    if (allProducts.length === 0) {
        loadMainApp();
    }
}

function showAdminPanel() {
    showView('admin');
    loadAdminData();
}

// Carregamento da aplicação principal
async function loadMainApp() {
    showView('loading');
    
    try {
        // Carregar lista ativa
        const response = await fetch('/api/public/list/active');
        
        if (response.ok) {
            const data = await response.json();
            displayProductsList(data);
            elements.weekInfo.textContent = data.list_info.title;
        } else {
            elements.weekInfo.textContent = 'Nenhuma lista ativa encontrada';
            elements.productsListClient.innerHTML = '<p style=\"text-align: center; padding: 40px; color: #757575;\">Nenhuma lista de produtos disponível no momento.</p>';
        }
        
        showView('main');
    } catch (error) {
        console.error('Erro ao carregar lista:', error);
        elements.weekInfo.textContent = 'Erro ao carregar lista';
        showView('main');
    }
}

// Exibição da lista de produtos
function displayProductsList(data) {
    const container = elements.productsListClient;
    container.innerHTML = '';
    
    if (!data.categories || data.categories.length === 0) {
        container.innerHTML = '<p style=\"text-align: center; padding: 40px; color: #757575;\">Nenhum produto disponível.</p>';
        return;
    }
    
    data.categories.forEach(categoryData => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `<h2>${categoryData.category.emoji} ${categoryData.category.name}</h2>`;
        
        categorySection.appendChild(categoryHeader);
        
        categoryData.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.dataset.productId = product.id;
            
            const organicSymbol = product.is_organic ? ' 🌱' : '';
            
            productItem.innerHTML = `
                <div class="product-checkbox" data-product-id="${product.id}"></div>
                <div class="product-info">
                    <div class="product-name">${product.name}${organicSymbol}</div>
                    <div class="product-price">${product.unit} = R$ ${product.price.toFixed(2)}</div>
                </div>
            `;
            
            productItem.addEventListener('click', () => toggleProduct(product));
            categorySection.appendChild(productItem);
        });
        
        container.appendChild(categorySection);
    });
}

// Seleção de produtos
function toggleProduct(product) {
    const index = selectedProducts.findIndex(p => p.id === product.id);
    
    if (index > -1) {
        // Remover produto
        selectedProducts.splice(index, 1);
        updateProductUI(product.id, false);
    } else {
        // Adicionar produto
        selectedProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            is_organic: product.is_organic,
            quantity: 1
        });
        updateProductUI(product.id, true);
    }
    
    updateOrderSummary();
}

function updateProductUI(productId, selected) {
    const productItem = document.querySelector(`[data-product-id=\"${productId}\"]`);
    const checkbox = productItem.querySelector('.product-checkbox');
    
    if (selected) {
        productItem.classList.add('selected');
        checkbox.classList.add('checked');
    } else {
        productItem.classList.remove('selected');
        checkbox.classList.remove('checked');
    }
}

// Resumo do pedido
function updateOrderSummary() {
    const itemsCount = selectedProducts.length;
    const totalPrice = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    elements.itemsCount.textContent = itemsCount;
    elements.totalPrice.textContent = totalPrice.toFixed(2);
    
    if (itemsCount > 0) {
        elements.orderSummary.classList.remove('hidden');
        updateSelectedItemsList();
    } else {
        elements.orderSummary.classList.add('hidden');
    }
}

function updateSelectedItemsList() {
    elements.selectedItems.innerHTML = '';
    
    selectedProducts.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        
        const organicSymbol = product.is_organic ? ' 🌱' : '';
        const itemTotal = product.price * product.quantity;
        
        itemDiv.innerHTML = `
            <span class="item-name">${product.name}${organicSymbol}</span>
            <span class="item-price">R$ ${itemTotal.toFixed(2)}</span>
        `;
        
        elements.selectedItems.appendChild(itemDiv);
    });
}

function toggleSummary() {
    const details = elements.summaryDetails;
    const toggleBtn = document.getElementById('toggle-summary');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        toggleBtn.textContent = '▼';
    } else {
        details.style.display = 'none';
        toggleBtn.textContent = '▲';
    }
}

// Envio para WhatsApp
async function sendWhatsAppMessage() {
    if (selectedProducts.length === 0) {
        alert('Selecione pelo menos um produto');
        return;
    }
    
    const customerName = prompt('Digite seu nome:') || 'Cliente';
    
    try {
        const response = await fetch('/api/public/generate-whatsapp-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                products: selectedProducts,
                customer_name: customerName
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Abrir WhatsApp
            window.open(data.whatsapp_url, '_blank');
            
            // Limpar seleção após envio
            selectedProducts = [];
            updateOrderSummary();
            
            // Atualizar UI
            document.querySelectorAll('.product-item').forEach(item => {
                item.classList.remove('selected');
                item.querySelector('.product-checkbox').classList.remove('checked');
            });
        } else {
            alert('Erro ao gerar mensagem: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
    }
}

// Painel Administrativo
async function loadAdminData() {
    try {
        // Carregar estatísticas
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch('/api/admin/products'),
            fetch('/api/admin/categories')
        ]);
        
        if (productsResponse.ok) {
            allProducts = await productsResponse.json();
            elements.totalProducts.textContent = allProducts.length;
        }
        
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
            updateCategorySelect();
        }
        
        // Carregar lista ativa
        try {
            const activeListResponse = await fetch('/api/admin/weekly-lists/active');
            if (activeListResponse.ok) {
                const activeList = await activeListResponse.json();
                elements.activeList.textContent = activeList.title;
            }
        } catch (error) {
            elements.activeList.textContent = 'Nenhuma';
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados admin:', error);
    }
}

function showProductsManagement() {
    elements.productsManagement.classList.remove('hidden');
    displayProductsGrid();
}

function displayProductsGrid() {
    const container = elements.productsList;
    container.innerHTML = '';
    
    allProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const organicSymbol = product.is_organic ? ' 🌱' : '';
        const availableText = product.is_available ? 'Disponível' : 'Indisponível';
        const availableClass = product.is_available ? 'available' : 'unavailable';
        
        productCard.innerHTML = `
            <h4>${product.name}${organicSymbol}</h4>
            <div class="price">R$ ${product.price.toFixed(2)} / ${product.unit}</div>
            <div class="category">${product.category ? product.category.emoji + ' ' + product.category.name : 'Sem categoria'}</div>
            <div class="status ${availableClass}">${availableText}</div>
            <div class="actions">
                <button class="btn btn-primary" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn btn-secondary" onclick="deleteProduct(${product.id})">Remover</button>
            </div>
        `;
        
        container.appendChild(productCard);
    });
}

// Modal de produto
function showProductModal(product = null) {
    editingProduct = product;
    
    if (product) {
        // Edição
        document.getElementById('modal-title').textContent = 'Editar Produto';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-unit').value = product.unit;
        document.getElementById('product-category').value = product.category_id;
        document.getElementById('product-organic').checked = product.is_organic;
        document.getElementById('product-available').checked = product.is_available;
    } else {
        // Novo produto
        document.getElementById('modal-title').textContent = 'Novo Produto';
        elements.productForm.reset();
        document.getElementById('product-available').checked = true;
    }
    
    elements.productModal.classList.remove('hidden');
}

function hideProductModal() {
    elements.productModal.classList.add('hidden');
    editingProduct = null;
}

function updateCategorySelect() {
    const select = document.getElementById('product-category');
    select.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.emoji} ${category.name}`;
        select.appendChild(option);
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        unit: document.getElementById('product-unit').value,
        category_id: parseInt(document.getElementById('product-category').value),
        is_organic: document.getElementById('product-organic').checked,
        is_available: document.getElementById('product-available').checked
    };
    
    try {
        let response;
        
        if (editingProduct) {
            // Atualizar produto existente
            response = await fetch(`/api/admin/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Criar novo produto
            response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            hideProductModal();
            loadAdminData();
            displayProductsGrid();
            alert(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        } else {
            const error = await response.json();
            alert('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto');
    }
}

// Funções globais para os botões
window.editProduct = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        showProductModal(product);
    }
};

window.deleteProduct = async function(productId) {
    if (!confirm('Tem certeza que deseja remover este produto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadAdminData();
            displayProductsGrid();
            alert('Produto removido com sucesso!');
        } else {
            alert('Erro ao remover produto');
        }
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        alert('Erro ao remover produto');
    }
};


// Variáveis globais
let currentView = 'loading'; // loading, main, login, admin
let selectedProducts = [];
let allProducts = [];
let categories = [];
let allLists = [];
let activeList = null;
let isAuthenticated = false;
let editingProduct = null;
let editingListProducts = [];

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
    listsManagement: document.getElementById('lists-management'),
    listsGrid: document.getElementById('lists-grid'),
    editListSection: document.getElementById('edit-list-section'),
    availableProducts: document.getElementById('available-products'),
    listProducts: document.getElementById('list-products'),
    totalProducts: document.getElementById('total-products'),
    activeListSpan: document.getElementById('active-list'),
    editListBtn: document.getElementById('edit-list-btn')
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
    document.getElementById('create-list-btn').addEventListener('click', createWeeklyList);
    document.getElementById('edit-list-btn').addEventListener('click', showEditList);
    document.getElementById('manage-lists-btn').addEventListener('click', showListsManagement);
    document.getElementById('add-product-btn').addEventListener('click', () => showProductModal());
    
    // Edit list actions
    document.getElementById('save-list-changes').addEventListener('click', saveListChanges);
    document.getElementById('cancel-list-edit').addEventListener('click', cancelListEdit);
    
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
function showLogin() {
    hideAllScreens();
    elements.loginScreen.classList.remove('hidden');
    currentView = 'login';
}

function showMainApp() {
    hideAllScreens();
    elements.mainApp.classList.remove('hidden');
    currentView = 'main';
    loadMainApp();
}

function showAdminPanel() {
    hideAllScreens();
    elements.adminPanel.classList.remove('hidden');
    currentView = 'admin';
    loadAdminData();
}

function hideAllScreens() {
    elements.loading.classList.add('hidden');
    elements.mainApp.classList.add('hidden');
    elements.loginScreen.classList.add('hidden');
    elements.adminPanel.classList.add('hidden');
    
    // Esconder seções do admin
    elements.productsManagement.classList.add('hidden');
    elements.listsManagement.classList.add('hidden');
    elements.editListSection.classList.add('hidden');
}

// Carregamento de dados
async function loadMainApp() {
    try {
        elements.loading.classList.remove('hidden');
        
        const response = await fetch('/api/public/weekly-list');
        const data = await response.json();
        
        if (data.categories && data.categories.length > 0) {
            elements.weekInfo.textContent = data.title || 'Lista da Semana';
            displayProducts(data);
        } else {
            elements.weekInfo.textContent = 'Nenhuma lista ativa encontrada';
            elements.productsListClient.innerHTML = '<p style="text-align: center; padding: 40px; color: #757575;">Nenhuma lista de produtos disponível no momento.</p>';
        }
        
        elements.loading.classList.add('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        elements.loading.classList.add('hidden');
        elements.productsListClient.innerHTML = '<p style="text-align: center; padding: 40px; color: #f44336;">Erro ao carregar produtos. Tente novamente.</p>';
    }
}

async function loadAdminData() {
    try {
        // Carregar produtos
        const productsResponse = await fetch('/api/admin/products');
        if (productsResponse.ok) {
            allProducts = await productsResponse.json();
            elements.totalProducts.textContent = allProducts.length;
        }
        
        // Carregar categorias
        const categoriesResponse = await fetch('/api/admin/categories');
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
            updateCategorySelect();
        }
        
        // Carregar listas
        const listsResponse = await fetch('/api/admin/weekly-lists');
        if (listsResponse.ok) {
            allLists = await listsResponse.json();
        }
        
        // Carregar lista ativa
        try {
            const activeListResponse = await fetch('/api/admin/weekly-lists/active');
            if (activeListResponse.ok) {
                activeList = await activeListResponse.json();
                elements.activeListSpan.textContent = activeList.title;
                elements.editListBtn.classList.remove('hidden');
            } else {
                activeList = null;
                elements.activeListSpan.textContent = 'Nenhuma';
                elements.editListBtn.classList.add('hidden');
            }
        } catch (error) {
            activeList = null;
            elements.activeListSpan.textContent = 'Nenhuma';
            elements.editListBtn.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do admin:', error);
    }
}

// Exibição de produtos para clientes
function displayProducts(data) {
    const container = elements.productsListClient;
    container.innerHTML = '';
    
    if (!data.categories || data.categories.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #757575;">Nenhum produto disponível.</p>';
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
    const productItem = document.querySelector(`[data-product-id="${productId}"]`);
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
            <span class="item-details">${product.quantity} ${product.unit} × R$ ${product.price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}</span>
        `;
        
        elements.selectedItems.appendChild(itemDiv);
    });
}

function toggleSummary() {
    const isVisible = !elements.summaryDetails.classList.contains('hidden');
    const toggleBtn = document.getElementById('toggle-summary');
    
    if (isVisible) {
        elements.summaryDetails.classList.add('hidden');
        toggleBtn.textContent = '▲';
    } else {
        elements.summaryDetails.classList.remove('hidden');
        toggleBtn.textContent = '▼';
    }
}

// WhatsApp
function sendWhatsAppMessage() {
    if (selectedProducts.length === 0) {
        alert('Selecione pelo menos um produto antes de enviar o pedido.');
        return;
    }
    
    const customerName = prompt('Digite seu nome para identificação:');
    if (!customerName) {
        return;
    }
    
    let message = `🛒 *PEDIDO - ${customerName}*\n\n`;
    message += `📋 *Produtos selecionados:*\n\n`;
    
    // Agrupar produtos por categoria
    const productsByCategory = {};
    selectedProducts.forEach(product => {
        const categoryName = getCategoryNameByProduct(product);
        if (!productsByCategory[categoryName]) {
            productsByCategory[categoryName] = [];
        }
        productsByCategory[categoryName].push(product);
    });
    
    // Adicionar produtos agrupados por categoria
    Object.keys(productsByCategory).forEach(categoryName => {
        message += `${categoryName}\n`;
        productsByCategory[categoryName].forEach(product => {
            const organicSymbol = product.is_organic ? ' 🌱' : '';
            const itemTotal = product.price * product.quantity;
            message += `• ${product.name}${organicSymbol}\n`;
            message += `  ${product.quantity} ${product.unit} × R$ ${product.price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}\n`;
        });
        message += '\n';
    });
    
    const totalPrice = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    message += `💰 *TOTAL DO PEDIDO:*\n`;
    message += `R$ ${totalPrice.toFixed(2)}\n\n`;
    message += `📱 Pedido gerado automaticamente via Lista Fácil\n`;
    message += `🚚 Aguardo confirmação para combinar entrega!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=5582996603943&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
}

function getCategoryNameByProduct(product) {
    // Esta função deveria buscar a categoria do produto, mas como não temos essa info no selectedProducts,
    // vamos usar uma categoria padrão ou buscar dos dados carregados
    const fullProduct = allProducts.find(p => p.id === product.id);
    if (fullProduct && fullProduct.category) {
        return `${fullProduct.category.emoji} ${fullProduct.category.name}`;
    }
    return '📦 PRODUTOS';
}

// Gestão de produtos (Admin)
function showProductsManagement() {
    hideAllScreens();
    elements.adminPanel.classList.remove('hidden');
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

// Gestão de listas (Admin)
function showListsManagement() {
    hideAllScreens();
    elements.adminPanel.classList.remove('hidden');
    elements.listsManagement.classList.remove('hidden');
    displayListsGrid();
}

function displayListsGrid() {
    const container = elements.listsGrid;
    container.innerHTML = '';
    
    allLists.forEach(list => {
        const listCard = document.createElement('div');
        listCard.className = `list-card ${list.is_active ? 'active' : ''}`;
        
        const statusClass = list.is_active ? 'active' : 'inactive';
        const statusText = list.is_active ? 'Ativa' : 'Inativa';
        
        listCard.innerHTML = `
            <h4>${list.title}</h4>
            <div class="list-status ${statusClass}">${statusText}</div>
            <div class="list-info">
                <div>Criada em: ${new Date(list.created_at).toLocaleDateString('pt-BR')}</div>
                <div>Produtos: ${list.products ? list.products.length : 0}</div>
            </div>
            <div class="list-actions">
                ${!list.is_active ? `<button class="btn btn-success" onclick="activateList(${list.id})">Ativar</button>` : ''}
                <button class="btn btn-info" onclick="duplicateList(${list.id})">Duplicar</button>
                <button class="btn btn-warning" onclick="editListProducts(${list.id})">Editar</button>
                <button class="btn btn-secondary" onclick="deleteList(${list.id})">Remover</button>
            </div>
        `;
        
        container.appendChild(listCard);
    });
}

// Edição de lista ativa
function showEditList() {
    if (!activeList) {
        alert('Não há lista ativa para editar.');
        return;
    }
    
    hideAllScreens();
    elements.adminPanel.classList.remove('hidden');
    elements.editListSection.classList.remove('hidden');
    loadEditListData();
}

async function loadEditListData() {
    try {
        // Carregar produtos da lista ativa
        const response = await fetch(`/api/admin/weekly-lists/${activeList.id}/products`);
        if (response.ok) {
            editingListProducts = await response.json();
        } else {
            editingListProducts = [];
        }
        
        displayEditListProducts();
    } catch (error) {
        console.error('Erro ao carregar produtos da lista:', error);
        editingListProducts = [];
        displayEditListProducts();
    }
}

function displayEditListProducts() {
    // Produtos disponíveis (não na lista)
    const availableContainer = elements.availableProducts;
    availableContainer.innerHTML = '';
    
    const availableProducts = allProducts.filter(product => 
        product.is_available && !editingListProducts.some(lp => lp.id === product.id)
    );
    
    availableProducts.forEach(product => {
        const productItem = createProductSelectionItem(product, 'add');
        availableContainer.appendChild(productItem);
    });
    
    // Produtos na lista
    const listContainer = elements.listProducts;
    listContainer.innerHTML = '';
    
    editingListProducts.forEach(product => {
        const productItem = createProductSelectionItem(product, 'remove');
        listContainer.appendChild(productItem);
    });
}

function createProductSelectionItem(product, action) {
    const productItem = document.createElement('div');
    productItem.className = 'product-selection-item';
    
    const organicSymbol = product.is_organic ? ' 🌱' : '';
    const actionText = action === 'add' ? 'Adicionar' : 'Remover';
    const actionClass = action === 'add' ? 'add' : 'remove';
    
    productItem.innerHTML = `
        <div class="product-selection-info">
            <div class="product-selection-name">${product.name}${organicSymbol}</div>
            <div class="product-selection-price">R$ ${product.price.toFixed(2)} / ${product.unit}</div>
        </div>
        <button class="product-selection-action ${actionClass}" onclick="${action}ProductToList(${product.id})">${actionText}</button>
    `;
    
    return productItem;
}

// Funções para adicionar/remover produtos da lista
window.addProductToList = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product && !editingListProducts.some(lp => lp.id === productId)) {
        editingListProducts.push(product);
        displayEditListProducts();
    }
};

window.removeProductFromList = function(productId) {
    editingListProducts = editingListProducts.filter(p => p.id !== productId);
    displayEditListProducts();
};

async function saveListChanges() {
    if (!activeList) {
        alert('Erro: Nenhuma lista ativa encontrada.');
        return;
    }
    
    try {
        const productIds = editingListProducts.map(p => p.id);
        
        const response = await fetch(`/api/admin/weekly-lists/${activeList.id}/products`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_ids: productIds })
        });
        
        if (response.ok) {
            alert('Lista atualizada com sucesso!');
            loadAdminData();
            showAdminPanel();
        } else {
            const error = await response.json();
            alert('Erro ao salvar alterações: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert('Erro ao salvar alterações');
    }
}

function cancelListEdit() {
    showAdminPanel();
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

// Função para criar lista semanal
async function createWeeklyList() {
    try {
        // Verificar se há produtos disponíveis
        const availableProducts = allProducts.filter(p => p.is_available);
        if (availableProducts.length === 0) {
            alert('Não há produtos disponíveis para criar uma lista semanal. Cadastre produtos primeiro.');
            return;
        }
        
        // Confirmar criação
        if (!confirm(`Criar nova lista semanal com ${availableProducts.length} produtos disponíveis?`)) {
            return;
        }
        
        // Criar lista com data atual
        const today = new Date();
        const weekIdentifier = `semana-${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        const title = `Lista da Semana - ${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        const listData = {
            week_identifier: weekIdentifier,
            title: title,
            product_ids: availableProducts.map(p => p.id)
        };
        
        const response = await fetch('/api/admin/weekly-lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listData)
        });
        
        if (response.ok) {
            alert('Lista semanal criada com sucesso!');
            loadAdminData(); // Recarregar dados do admin
        } else {
            const error = await response.json();
            alert('Erro ao criar lista semanal: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao criar lista semanal:', error);
        alert('Erro ao criar lista semanal');
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

window.activateList = async function(listId) {
    try {
        const response = await fetch(`/api/admin/weekly-lists/${listId}/activate`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Lista ativada com sucesso!');
            loadAdminData();
            displayListsGrid();
        } else {
            alert('Erro ao ativar lista');
        }
    } catch (error) {
        console.error('Erro ao ativar lista:', error);
        alert('Erro ao ativar lista');
    }
};

window.duplicateList = async function(listId) {
    if (!confirm('Deseja duplicar esta lista e torná-la ativa?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/weekly-lists/${listId}/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ make_active: true })
        });
        
        if (response.ok) {
            alert('Lista duplicada e ativada com sucesso!');
            loadAdminData();
            displayListsGrid();
        } else {
            alert('Erro ao duplicar lista');
        }
    } catch (error) {
        console.error('Erro ao duplicar lista:', error);
        alert('Erro ao duplicar lista');
    }
};

window.editListProducts = function(listId) {
    // Implementar edição de lista específica se necessário
    alert('Funcionalidade em desenvolvimento');
};

window.deleteList = async function(listId) {
    if (!confirm('Tem certeza que deseja remover esta lista?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/weekly-lists/${listId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Lista removida com sucesso!');
            loadAdminData();
            displayListsGrid();
        } else {
            alert('Erro ao remover lista');
        }
    } catch (error) {
        console.error('Erro ao remover lista:', error);
        alert('Erro ao remover lista');
    }
};

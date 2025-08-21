from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.product import Category, Product, WeeklyList, weekly_list_products
from datetime import datetime
import hashlib

admin_bp = Blueprint('admin', __name__)

# Usuário admin padrão (em produção, usar hash de senha)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"  # Em produção, usar hash

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['admin_logged_in'] = True
        return jsonify({'success': True, 'message': 'Login realizado com sucesso'})
    else:
        return jsonify({'success': False, 'message': 'Credenciais inválidas'}), 401

@admin_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso'})

@admin_bp.route('/check-auth', methods=['GET'])
def check_auth():
    is_logged_in = session.get('admin_logged_in', False)
    return jsonify({'authenticated': is_logged_in})

def require_auth():
    if not session.get('admin_logged_in', False):
        return jsonify({'error': 'Acesso negado. Faça login primeiro.'}), 401
    return None

# Rotas de Categorias
@admin_bp.route('/categories', methods=['GET'])
def get_categories():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    categories = Category.query.order_by(Category.order).all()
    return jsonify([cat.to_dict() for cat in categories])

@admin_bp.route('/categories', methods=['POST'])
def create_category():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    data = request.get_json()
    category = Category(
        name=data['name'],
        emoji=data.get('emoji', ''),
        order=data.get('order', 0)
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    category.name = data.get('name', category.name)
    category.emoji = data.get('emoji', category.emoji)
    category.order = data.get('order', category.order)
    
    db.session.commit()
    return jsonify(category.to_dict())

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Categoria removida com sucesso'})

# Rotas de Produtos
@admin_bp.route('/products', methods=['GET'])
def get_products():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    products = Product.query.join(Category).order_by(Category.order, Product.name).all()
    return jsonify([product.to_dict() for product in products])

@admin_bp.route('/products', methods=['POST'])
def create_product():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    data = request.get_json()
    product = Product(
        name=data['name'],
        price=float(data['price']),
        unit=data['unit'],
        is_organic=data.get('is_organic', False),
        is_available=data.get('is_available', True),
        category_id=int(data['category_id'])
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    product.name = data.get('name', product.name)
    product.price = float(data.get('price', product.price))
    product.unit = data.get('unit', product.unit)
    product.is_organic = data.get('is_organic', product.is_organic)
    product.is_available = data.get('is_available', product.is_available)
    product.category_id = int(data.get('category_id', product.category_id))
    product.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(product.to_dict())

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Produto removido com sucesso'})

# Rotas de Lista Semanal
@admin_bp.route('/weekly-lists', methods=['GET'])
def get_weekly_lists():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    lists = WeeklyList.query.order_by(WeeklyList.created_at.desc()).all()
    return jsonify([wl.to_dict() for wl in lists])

@admin_bp.route('/weekly-lists', methods=['POST'])
def create_weekly_list():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    data = request.get_json()
    
    # Desativar lista anterior se existir
    WeeklyList.query.filter_by(is_active=True).update({'is_active': False})
    
    weekly_list = WeeklyList(
        week_identifier=data['week_identifier'],
        title=data['title'],
        is_active=True
    )
    db.session.add(weekly_list)
    db.session.flush()  # Para obter o ID
    
    # Adicionar produtos selecionados
    if 'product_ids' in data:
        products = Product.query.filter(Product.id.in_(data['product_ids'])).all()
        weekly_list.products = products
    
    db.session.commit()
    return jsonify(weekly_list.to_dict()), 201

@admin_bp.route('/weekly-lists/<int:list_id>/activate', methods=['POST'])
def activate_weekly_list(list_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    # Desativar todas as listas
    WeeklyList.query.update({'is_active': False})
    
    # Ativar a lista selecionada
    weekly_list = WeeklyList.query.get_or_404(list_id)
    weekly_list.is_active = True
    
    db.session.commit()
    return jsonify(weekly_list.to_dict())

@admin_bp.route('/weekly-lists/active', methods=['GET'])
def get_active_weekly_list():
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    active_list = WeeklyList.query.filter_by(is_active=True).first()
    if active_list:
        return jsonify(active_list.to_dict())
    else:
        return jsonify({'message': 'Nenhuma lista ativa encontrada'}), 404


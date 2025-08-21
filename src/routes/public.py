from flask import Blueprint, request, jsonify
from src.models.product import Category, Product, WeeklyList
from urllib.parse import quote

public_bp = Blueprint('public', __name__)

@public_bp.route('/list/<week_identifier>', methods=['GET'])
def get_weekly_list(week_identifier):
    """Retorna a lista semanal para os clientes"""
    weekly_list = WeeklyList.query.filter_by(
        week_identifier=week_identifier, 
        is_active=True
    ).first()
    
    if not weekly_list:
        return jsonify({'error': 'Lista não encontrada ou inativa'}), 404
    
    # Organizar produtos por categoria
    categories_data = {}
    for product in weekly_list.products:
        if product.is_available:  # Só mostrar produtos disponíveis
            category = product.category
            if category.id not in categories_data:
                categories_data[category.id] = {
                    'category': category.to_dict(),
                    'products': []
                }
            categories_data[category.id]['products'].append(product.to_dict())
    
    # Ordenar categorias e produtos
    sorted_categories = sorted(categories_data.values(), key=lambda x: x['category']['order'])
    for cat_data in sorted_categories:
        cat_data['products'].sort(key=lambda x: x['name'])
    
    return jsonify({
        'list_info': {
            'title': weekly_list.title,
            'week_identifier': weekly_list.week_identifier
        },
        'categories': sorted_categories
    })

@public_bp.route('/list/active', methods=['GET'])
def get_active_list():
    """Retorna a lista ativa atual"""
    active_list = WeeklyList.query.filter_by(is_active=True).first()
    
    if not active_list:
        return jsonify({'error': 'Nenhuma lista ativa encontrada'}), 404
    
    return get_weekly_list(active_list.week_identifier)

@public_bp.route('/generate-whatsapp-message', methods=['POST'])
def generate_whatsapp_message():
    """Gera mensagem formatada para WhatsApp"""
    data = request.get_json()
    selected_products = data.get('products', [])
    customer_name = data.get('customer_name', 'Cliente')
    
    if not selected_products:
        return jsonify({'error': 'Nenhum produto selecionado'}), 400
    
    # Buscar informações dos produtos
    product_ids = [p['id'] for p in selected_products]
    products = Product.query.filter(Product.id.in_(product_ids)).all()
    
    # Criar dicionário para acesso rápido
    products_dict = {p.id: p for p in products}
    
    # Organizar por categoria
    categories_order = {}
    for product in products:
        cat_id = product.category_id
        if cat_id not in categories_order:
            categories_order[cat_id] = {
                'category': product.category,
                'products': []
            }
        
        # Encontrar quantidade selecionada
        selected_qty = 1
        for sp in selected_products:
            if sp['id'] == product.id:
                selected_qty = sp.get('quantity', 1)
                break
        
        categories_order[cat_id]['products'].append({
            'product': product,
            'quantity': selected_qty
        })
    
    # Gerar mensagem
    message_lines = [
        f"🛒 *PEDIDO - {customer_name}*",
        "",
        "📋 *Produtos selecionados:*",
        ""
    ]
    
    total_value = 0
    
    # Ordenar categorias
    sorted_categories = sorted(categories_order.values(), key=lambda x: x['category'].order)
    
    for cat_data in sorted_categories:
        category = cat_data['category']
        message_lines.append(f"{category.emoji} *{category.name}*")
        
        for item in cat_data['products']:
            product = item['product']
            qty = item['quantity']
            line_total = product.price * qty
            total_value += line_total
            
            organic_symbol = " 🌱" if product.is_organic else ""
            message_lines.append(f"• {product.name}{organic_symbol}")
            message_lines.append(f"  {qty} {product.unit} × R$ {product.price:.2f} = R$ {line_total:.2f}")
        
        message_lines.append("")
    
    message_lines.extend([
        "💰 *TOTAL DO PEDIDO:*",
        f"R$ {total_value:.2f}",
        "",
        "📱 Pedido gerado automaticamente via Lista Fácil",
        "🚚 Aguardo confirmação para combinar entrega!"
    ])
    
    message_text = "\n".join(message_lines)
    
    # Gerar link do WhatsApp
    # Número do WhatsApp do agricultor (configurável)
    whatsapp_number = "5582996603943"  # Substituir pelo número real
    whatsapp_url = f"https://wa.me/{whatsapp_number}?text={quote(message_text)}"
    
    return jsonify({
        'message': message_text,
        'whatsapp_url': whatsapp_url,
        'total_value': total_value,
        'total_items': len(selected_products)
    })

@public_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'Lista Fácil API está funcionando!'
    })


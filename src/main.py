import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.product import Category, Product, WeeklyList
from src.routes.user import user_bp
from src.routes.admin import admin_bp
from src.routes.public import public_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Habilitar CORS para todas as rotas
CORS(app)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(public_bp, url_prefix='/api/public')

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def init_database():
    """Inicializa o banco de dados com dados de exemplo"""
    with app.app_context():
        db.create_all()
        
        # Verificar se já existem categorias
        if Category.query.count() == 0:
            # Criar categorias baseadas na lista original
            categories = [
                {'name': 'FOLHAS', 'emoji': '🥗', 'order': 1},
                {'name': 'RAÍZES & LEGUMES', 'emoji': '🥔', 'order': 2},
                {'name': 'FRUTAS', 'emoji': '🍎', 'order': 3},
                {'name': 'ORIGEM ANIMAL', 'emoji': '🐔', 'order': 4},
                {'name': 'COGUMELOS', 'emoji': '🍄', 'order': 5},
                {'name': 'TEMPEROS', 'emoji': '🌶️', 'order': 6},
                {'name': 'CHÁS', 'emoji': '🍂', 'order': 7},
                {'name': 'BENEFICIADOS', 'emoji': '✨', 'order': 8},
                {'name': 'CONGELADOS', 'emoji': '❄️', 'order': 9},
                {'name': 'LATICÍNIOS VEGANOS', 'emoji': '🥛', 'order': 10},
                {'name': 'BIOCOSMÉTICOS', 'emoji': '💁🏽‍♀️', 'order': 11}
            ]
            
            for cat_data in categories:
                category = Category(**cat_data)
                db.session.add(category)
            
            db.session.commit()
            print("Categorias criadas com sucesso!")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    init_database()
    # Configuração para produção
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)

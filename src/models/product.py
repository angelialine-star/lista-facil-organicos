from flask_sqlalchemy import SQLAlchemy
from src.models.user import db
from datetime import datetime

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(10), nullable=True)
    order = db.Column(db.Integer, default=0)
    
    # Relacionamento com produtos
    products = db.relationship('Product', backref='category', lazy=True)
    
    def __repr__(self):
        return f'<Category {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'emoji': self.emoji,
            'order': self.order
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)  # un, kg, maço, etc.
    is_organic = db.Column(db.Boolean, default=False)
    is_available = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Product {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'unit': self.unit,
            'is_organic': self.is_organic,
            'is_available': self.is_available,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class WeeklyList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    week_identifier = db.Column(db.String(50), unique=True, nullable=False)  # ex: "semana-34-2025"
    title = db.Column(db.String(200), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento many-to-many com produtos
    products = db.relationship('Product', secondary='weekly_list_products', backref='weekly_lists')
    
    def __repr__(self):
        return f'<WeeklyList {self.week_identifier}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'week_identifier': self.week_identifier,
            'title': self.title,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'products': [product.to_dict() for product in self.products]
        }

# Tabela de associação para many-to-many entre WeeklyList e Product
weekly_list_products = db.Table('weekly_list_products',
    db.Column('weekly_list_id', db.Integer, db.ForeignKey('weekly_list.id'), primary_key=True),
    db.Column('product_id', db.Integer, db.ForeignKey('product.id'), primary_key=True)
)


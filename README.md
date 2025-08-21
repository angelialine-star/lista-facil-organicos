# Lista Fácil - Produtos Orgânicos

Sistema web para facilitar pedidos de produtos orgânicos via WhatsApp.

## Funcionalidades

- Interface web responsiva para seleção de produtos
- Painel administrativo para gerenciamento
- Integração automática com WhatsApp
- Organização por categorias
- Identificação de produtos orgânicos

## Deploy no Render

Este projeto está configurado para deploy automático no Render.com

### Configuração

1. Conecte seu repositório GitHub ao Render
2. Configure as variáveis de ambiente se necessário
3. O deploy será automático

### Variáveis de Ambiente

- `FLASK_ENV`: production (para produção)
- `PORT`: Porta do servidor (configurada automaticamente pelo Render)

## Uso Local

```bash
pip install -r requirements.txt
python src/main.py
```

Acesse: http://localhost:5000

## Login Administrativo

- Usuário: admin
- Senha: admin123


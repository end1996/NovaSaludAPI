# Documentación Técnica - BoticaAPI

## 📋 Descripción General

BoticaAPI es una API REST desarrollada con Node.js y Express para la gestión de inventario y ventas de una botica/farmacia. El sistema permite administrar productos, controlar stock, registrar ventas y generar alertas de inventario bajo.

## 🏗️ Arquitectura

### Stack Tecnológico

- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Base de Datos**: MongoDB (Mongoose 8.19.1)
- **Lenguaje**: JavaScript (ES Modules)
- **Herramientas de Desarrollo**: Nodemon 3.1.10

### Estructura del Proyecto

```
boticaApi/
├── src/
│   ├── config/
│   │   └── db.js              # Configuración de conexión a MongoDB
│   ├── controllers/
│   │   ├── productController.js   # Lógica de negocio de productos
│   │   └── saleController.js      # Lógica de negocio de ventas
│   ├── models/
│   │   ├── Product.js         # Modelo de datos de productos
│   │   └── Sale.js            # Modelo de datos de ventas
│   ├── routes/
│   │   ├── product.routes.js  # Rutas de productos
│   │   └── sale.routes.js     # Rutas de ventas
│   ├── app.js                 # Configuración de Express
│   └── server.js              # Punto de entrada de la aplicación
├── .env                       # Variables de entorno
├── package.json               # Dependencias y scripts
└── package-lock.json
```

### Patrón de Diseño

La aplicación sigue el patrón **MVC (Model-View-Controller)** adaptado para APIs:

- **Models**: Definición de esquemas de datos con Mongoose
- **Controllers**: Lógica de negocio y procesamiento de datos
- **Routes**: Definición de endpoints y enrutamiento

## 🗄️ Modelos de Datos

### Product (Producto)

```javascript
{
  name: String (requerido),
  stock: Number (requerido, default: 0),
  price: Number (requerido),
  alertLevel: Number (requerido, default: 5)
}
```

**Campos:**
- `name`: Nombre del producto
- `stock`: Cantidad disponible en inventario
- `price`: Precio unitario del producto
- `alertLevel`: Nivel mínimo de stock para generar alerta

### Sale (Venta)

```javascript
{
  items: [
    {
      product: ObjectId (ref: Product, requerido),
      quantity: Number (requerido, min: 1),
      price: Number (requerido, min: 0)
    }
  ],
  total: Number (requerido, min: 0),
  cashier: String (opcional),
  createdAt: Date (default: Date.now)
}
```

**Campos:**
- `items`: Array de productos vendidos
  - `product`: Referencia al producto
  - `quantity`: Cantidad vendida
  - `price`: Precio al momento de la venta
- `total`: Monto total de la venta
- `cashier`: Nombre del cajero que registró la venta
- `createdAt`: Fecha y hora de la venta

## 🔌 API Endpoints

### Productos

#### GET `/api/products`
Obtiene la lista completa de productos.

**Respuesta:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Paracetamol 500mg",
    "stock": 100,
    "price": 5.50,
    "alertLevel": 10
  }
]
```

#### GET `/api/products/low-stock`
Obtiene productos con stock por debajo del nivel de alerta.

**Respuesta:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Ibuprofeno 400mg",
    "stock": 3,
    "alertLevel": 5
  }
]
```

#### POST `/api/products`
Crea un nuevo producto.

**Body:**
```json
{
  "name": "Aspirina 100mg",
  "stock": 50,
  "price": 3.75,
  "alertLevel": 10
}
```

**Respuesta:** `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Aspirina 100mg",
  "stock": 50,
  "price": 3.75,
  "alertLevel": 10
}
```

#### PUT `/api/products/:id`
Actualiza un producto existente.

**Body:**
```json
{
  "stock": 75,
  "price": 4.00
}
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Aspirina 100mg",
  "stock": 75,
  "price": 4.00,
  "alertLevel": 10
}
```

#### DELETE `/api/products/:id`
Elimina un producto.

**Respuesta:**
```json
{
  "message": "Producto eliminado"
}
```

### Ventas

#### POST `/api/sales`
Registra una nueva venta y actualiza el stock de productos de forma atómica.

**Body:**
```json
{
  "items": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "price": 5.50
    },
    {
      "product": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "price": 12.00
    }
  ],
  "cashier": "Juan Pérez"
}
```

**Respuesta:** `201 Created`
```json
{
  "sale": {
    "_id": "507f1f77bcf86cd799439013",
    "items": [...],
    "total": 23.00,
    "cashier": "Juan Pérez",
    "createdAt": "2025-10-15T22:30:00.000Z"
  },
  "lowStock": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Paracetamol 500mg",
      "stock": 4,
      "alertLevel": 5
    }
  ]
}
```

**Características:**
- Validación de stock disponible antes de procesar la venta
- Actualización atómica del inventario
- Reversión automática en caso de error (rollback)
- Retorna alertas de productos con stock bajo después de la venta

#### GET `/api/sales`
Obtiene lista de ventas con paginación.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Cantidad de resultados por página (default: 20)

**Ejemplo:** `/api/sales?page=1&limit=10`

**Respuesta:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Paracetamol 500mg",
            "price": 5.50
          },
          "quantity": 2,
          "price": 5.50
        }
      ],
      "total": 11.00,
      "cashier": "Juan Pérez",
      "createdAt": "2025-10-15T22:30:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

#### GET `/api/sales/:id`
Obtiene una venta específica por ID.

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "items": [
    {
      "product": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Paracetamol 500mg",
        "price": 5.50
      },
      "quantity": 2,
      "price": 5.50
    }
  ],
  "total": 11.00,
  "cashier": "Juan Pérez",
  "createdAt": "2025-10-15T22:30:00.000Z"
}
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/boticaDB
```

**Variables:**
- `PORT`: Puerto en el que se ejecuta el servidor (default: 3000)
- `MONGO_URI`: URI de conexión a MongoDB

### Base de Datos

**MongoDB Local:**
- Host: 127.0.0.1
- Puerto: 27017
- Base de datos: boticaDB

**Colecciones:**
- `products`: Almacena los productos
- `sales`: Almacena las ventas

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js (v14 o superior)
- MongoDB (v4.0 o superior)
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd boticaApi

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Ejecución

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
node src/server.js
```

El servidor estará disponible en `http://localhost:4000`

## 🔒 Características de Seguridad

### Transacciones Atómicas

El sistema implementa operaciones atómicas para el registro de ventas:

1. **Validación de Stock**: Usa `updateOne` con filtro `{ stock: { $gte: quantity } }` para garantizar que solo se decremente si hay stock suficiente
2. **Rollback Automático**: Si falla alguna operación durante la venta, se revierten todos los cambios de stock realizados
3. **Consistencia de Datos**: El total de la venta se calcula en el servidor, no se confía en el cliente

### CORS

La API tiene CORS habilitado para permitir peticiones desde cualquier origen. En producción, se recomienda configurar orígenes específicos:

```javascript
app.use(cors({
  origin: 'https://tu-dominio.com'
}));
```

## 📊 Flujo de Datos

### Proceso de Venta

```
1. Cliente envía POST /api/sales con items
   ↓
2. Servidor valida estructura de datos
   ↓
3. Para cada item:
   - Verifica existencia del producto
   - Valida stock suficiente
   - Decrementa stock de forma atómica
   - Registra producto para posible rollback
   ↓
4. Si todo OK:
   - Crea registro de venta
   - Verifica productos con stock bajo
   - Retorna venta y alertas
   ↓
5. Si hay error:
   - Revierte todos los decrementos de stock
   - Retorna error con detalles
```

## 🧪 Testing

### Ejemplos con cURL

**Crear Producto:**
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paracetamol 500mg",
    "stock": 100,
    "price": 5.50,
    "alertLevel": 10
  }'
```

**Registrar Venta:**
```bash
curl -X POST http://localhost:4000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "<product_id>",
        "quantity": 2,
        "price": 5.50
      }
    ],
    "cashier": "Juan Pérez"
  }'
```

**Obtener Productos con Stock Bajo:**
```bash
curl http://localhost:4000/api/products/low-stock
```

## 🐛 Manejo de Errores

### Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos o stock insuficiente
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

### Formato de Errores

```json
{
  "message": "Descripción del error",
  "detail": {
    "status": 400,
    "failedProduct": "507f1f77bcf86cd799439011"
  }
}
```

## 📈 Mejoras Futuras

- [ ] Autenticación y autorización (JWT)
- [ ] Validación de datos con middleware (express-validator)
- [ ] Logging estructurado (Winston, Morgan)
- [ ] Tests unitarios e integración (Jest, Supertest)
- [ ] Documentación API con Swagger/OpenAPI
- [ ] Rate limiting para prevenir abuso
- [ ] Caché con Redis para consultas frecuentes
- [ ] Reportes de ventas y estadísticas
- [ ] Gestión de usuarios y roles
- [ ] Historial de cambios de inventario

## 👥 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

ISC

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025

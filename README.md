# TechShop — E-Commerce Platform

A full-stack e-commerce web application for purchasing laptops, computer components, and tech accessories. Users can browse products, add items to cart, checkout with shipping address, and track orders in real-time. A single admin account manages inventory, processes orders, and updates shipment statuses.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4, react-toastify |
| Backend | Spring Boot 3 (Java 17), Spring Security, Spring Data JDBC |
| Database | SQLite (file-based, persisted via Docker volume) |
| Real-time | WebSocket (STOMP over SockJS) |
| Auth | JWT (HS256, 24h expiry), Argon2id password hashing |
| Containerization | Docker + Docker Compose (3 containers) |

---

## Features

### Public
- Landing page with featured products, category browser, and shop info
- Browse product catalog with search, filter, and sort options
- View product details with specs, images, and stock status
- Register / Login

### User
- Browse and search products by category
- Add products to shopping cart with quantity adjustment
- View cart with subtotal and update quantities
- Checkout: enter shipping address and review order
- Submit order from cart (clears cart on success)
- Track orders with real-time status updates (Pending → Dispatched → Delivered → Cancelled)
- View order history with details (total price, shipping address)
- Chat with admin for support
- Change password
- Logical account deletion (username freed for re-registration; data kept for records)

### Admin
- Dashboard with all users, orders, and real-time notifications
- Manage product catalog: Add, edit, delete products with specs and images
- Manage inventory: Update stock levels, mark products available/unavailable
- View all orders with customer details and total prices
- Update order statuses (Pending, Dispatched, Delivered, Cancelled) — reflected instantly on user's dashboard
- Real-time notifications (toast) when new orders arrive, products updated, users register
- Chat with users linked to orders
- Two-step user deletion: Deactivate (logical) → Permanently Delete (physical)
- Change password

### Real-time (WebSocket)
- Order status changes pushed instantly to the user's dashboard
- New orders appear instantly in the admin panel
- Inventory changes broadcast to admins
- New product announcements to customers
- Product removal notifications
- Chat messages delivered in real-time
- Toast notifications for all state changes

---

## Project Structure

```
.
├── backend/                  # Spring Boot application
│   ├── src/main/java/com/repairshop/
│   │   ├── config/           # Security, WebSocket, JDBC, DB migration
│   │   ├── controller/       # REST + WebSocket controllers
│   │   ├── dto/              # Request/response DTOs
│   │   ├── exception/        # Custom exceptions + global handler
│   │   ├── model/            # JPA/JDBC entities (Product, Order, CartItem, OrderItem)
│   │   ├── repository/       # Spring Data JDBC repositories
│   │   ├── security/         # JWT filter, WebSocket auth interceptor
│   │   └── service/          # Business logic (ProductService, CartService, OrderService)
│   └── src/main/resources/
│       ├── application.properties
│       └── schema.sql
├── frontend/                 # React + Vite application
│   └── src/
│       ├── components/       # Navbar, Footer, modals, route guards
│       ├── context/          # AuthContext, ThemeContext, ProductContext, CartContext
│       ├── hooks/            # useCart, useProducts, useOrderUpdates, useInventoryUpdates, useNotifications
│       └── pages/            # LandingPage, CataloguePage, ProductDetailsPage, CartPage, CheckoutPage, Dashboard, AdminPanel, etc.
├── database/                 # SQLite container
│   ├── Dockerfile
│   ├── init.sh
│   ├── seed.sql             # 42 sample products
│   └── healthcheck.sh
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Run

```bash
docker compose up --build
```

This builds and starts all three containers:

| Container | URL |
|-----------|-----|
| Frontend (Nginx + React) | http://localhost |
| Backend (Spring Boot) | http://localhost:8080 |
| Database (SQLite) | internal only |

The database is initialized automatically on first startup. The default admin account is seeded on boot.

### Stop

```bash
docker compose down
```

### Reset database (wipe all data)

```bash
docker compose down -v
```

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123` |

> Change the admin password after first login.

---

## API Endpoints

### Auth (public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/change-password` | Change password (auth required) |

### Products (public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | Get all products (paginated, searchable) |
| GET | `/api/products/{id}` | Get product details |
| GET | `/api/products/category/{category}` | Get products by category |

### User
| Method | Path | Description |
|--------|------|-------------|
| DELETE | `/api/users/me` | Soft-delete own account |
| GET | `/api/cart` | Get cart items for logged-in user |
| POST | `/api/cart` | Add product to cart |
| PATCH | `/api/cart/{productId}` | Update cart item quantity |
| DELETE | `/api/cart/{productId}` | Remove product from cart |
| DELETE | `/api/cart` | Clear cart |
| POST | `/api/orders` | Checkout: create order from cart |
| GET | `/api/orders` | Get own orders |
| GET | `/api/orders/{id}` | Get order details with items |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/sessions` | Create chat request (linked to own order) |
| GET | `/api/chat/sessions` | Get own chat sessions |
| GET | `/api/chat/sessions/{id}/messages` | Get messages |
| POST | `/api/chat/sessions/{id}/messages` | Send message (REST fallback) |
| POST | `/api/chat/sessions/{id}/read` | Mark session as read |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | Paginated active users |
| GET | `/api/admin/users/deleted` | Paginated soft-deleted users |
| PATCH | `/api/admin/users/{id}/deactivate` | Soft-delete user |
| DELETE | `/api/admin/users/{id}` | Hard-delete user |
| GET | `/api/admin/products` | All products with inventory |
| POST | `/api/admin/products` | Create new product |
| PATCH | `/api/admin/products/{id}` | Update product details |
| PATCH | `/api/admin/products/{id}/stock` | Update product stock/availability |
| DELETE | `/api/admin/products/{id}` | Delete product |
| GET | `/api/admin/orders` | Paginated all orders |
| PATCH | `/api/admin/orders/{id}/status` | Update order status (Pending, Dispatched, Delivered, Cancelled) |
| GET | `/api/chat/admin/sessions` | All chat sessions |
| POST | `/api/chat/admin/sessions` | Initiate chat by Order ID |
| POST | `/api/chat/admin/sessions/{id}/accept` | Accept pending chat |
| POST | `/api/chat/admin/sessions/{id}/close` | Close chat |

### WebSocket
Connect to `/ws` (SockJS). Send JWT in `Authorization` header on CONNECT.

| Destination | Direction | Description |
|-------------|-----------|-------------|
| `/app/chat/{id}/send` | Client → Server | Send chat message |
| `/user/queue/order-update` | Server → User | Order status changed |
| `/topic/admin/orders` | Server → Admin | New/updated order |
| `/topic/admin/products` | Server → Admin | Product inventory changed |
| `/topic/admin/users/new` | Server → Admin | New user registered |
| `/topic/admin/users/deleted` | Server → Admin | User soft-deleted |
| `/topic/admin/users/removed` | Server → Admin | User hard-deleted |
| `/topic/products/new` | Server → Customers | New product added |
| `/topic/products/{id}/unavailable` | Server → Customers | Product marked unavailable |
| `/topic/chat/{id}` | Server → Both | New chat message |

---

## Security

- Passwords hashed with **Argon2id**
- Stateless auth via **JWT** (24h expiry, HS256)
- Spring Security filter chain with role-based access (`ROLE_USER`, `ROLE_ADMIN`)
- WebSocket connections authenticated via JWT on CONNECT
- CORS restricted to known frontend origin
- Soft-deleted users cannot log in; their username is freed for re-registration

---

## Environment Variables

Set in `docker-compose.yml` or via a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production-use-a-long-random-secret` | JWT signing key — **change in production** |
| `SPRING_DATASOURCE_URL` | `jdbc:sqlite:/data/repairshop.db` | SQLite file path |

# Requirements

## Tech Requirements

- **Frontend:** ReactJS (Vite, Tailwind CSS v4, react-router-dom, react-toastify)
- **Backend:** Spring Boot 3 (Java 17, Spring Security, Spring Data JDBC)
- **Database:** SQLite (file-based, persisted via Docker volume)
- **Real-time:** WebSocket (STOMP over SockJS)
- **Authentication:** JWT (HS256, 24h expiry), Argon2id password hashing
- **Containerization:** Docker + Docker Compose (3 separate containers: frontend, backend, database)

## Features and Flow

### 1. About
- E-commerce platform for purchasing laptops, computer components, and tech accessories
- Comprehensive product catalog with 40+ items across 17 categories (laptops, desktops, RAM, SSDs, HDDs, networking, monitors, input devices, peripherals, etc.)
- Product filtering and search functionality
- Real-time inventory management and availability status

### 2. Product Browsing & Shopping
- **Public Access:** Browse all products without login
- **Product Details:** View specifications (CPU, RAM, storage, etc. in JSON format), pricing, stock availability
- **Search & Filter:** Find products by category, brand, price range
- **Shopping Cart:** Add/remove items, adjust quantities, view subtotal
- **Checkout Flow:** 
  - Enter shipping address
  - Review order summary
  - Place order (creates Order + OrderItems with historical pricing)
  - Cart automatically cleared after successful order

### 3. Order Lifecycle
**Order Statuses:** Pending → Dispatched → Delivered → Cancelled
- **User View:** Track orders in real-time via WebSocket (no page reload needed)
- **Order Details:** Total price, shipping address, items purchased with quantities
- **Admin View:** Manage all orders, update status, trigger instant customer notifications

### 4. User Management
- **Registration/Login:** Email-based accounts with secure password hashing (Argon2id)
- **Account Management:** 
  - Change password
  - Logical account deletion (soft-delete: username freed, data preserved for records)
- **User Isolation:** Cart and orders are per-user and isolated from other users
- **Session Persistence:** Cart persists across sessions per user

### 5. Admin
- **Inventory Management:** 
  - Add new products with specifications
  - Edit product details (price, brand, model, specs)
  - Update stock levels
  - Mark products available/unavailable
  - Delete products
- **Order Processing:** 
  - View all customer orders
  - Update order status (Pending → Dispatched → Delivered → Cancelled)
  - Changes reflected instantly on customer dashboards via WebSocket
- **User Management:**
  - View active and soft-deleted users
  - Deactivate users (soft-delete)
  - Permanently delete users (hard-delete, irreversible)
- **Real-time Notifications:** Toast notifications for:
  - New orders placed
  - New user registrations
  - Product inventory changes
  - Product additions/removals
  - User deletions
- **Customer Support:** Chat with users linked to specific orders
- **Default Admin:** Username `admin`, Password `Admin@123` (must be changed on first login)

### 6. Security
- **Password Security:** Argon2id hashing for all user passwords
- **Authentication:** Stateless JWT-based auth (24-hour expiry, HS256 signing)
- **Authorization:** Role-based access control (`ROLE_USER`, `ROLE_ADMIN`)
- **WebSocket Security:** JWT validation on STOMP connection
- **Data Protection:** Soft-deleted users cannot log in; usernames freed for re-registration
- **CORS:** Restricted to known frontend origin
- **Database:** All infrastructure containerized and isolated

### 7. Real-time Features (WebSocket)
- **Order Updates:** Order status changes pushed instantly to customer dashboards
- **Inventory Updates:** Stock level changes broadcast to admin dashboard
- **Product Announcements:** New products broadcast to all customers
- **Chat:** Real-time messaging between customer and admin
- **Notifications:** Toast alerts for all significant events on both user and admin sides

### 8. Scalability
- **Microservices Ready:** 3 independent Docker containers:
  - Frontend (Nginx + React)
  - Backend (Spring Boot)
  - Database (SQLite with persistent volume)
- **Easy Deployment:** Single `docker compose up --build` command
- **Data Persistence:** Database volume survives container restarts
- **Stateless Backend:** Enables horizontal scaling with load balancer
- **Sample Data:** seed.sql with 42 pre-loaded products for development/testing

## Database Schema

### Core Tables
- **users:** User accounts with roles (ROLE_USER, ROLE_ADMIN)
- **catalogue_items (products):** Product catalog with specs (JSON), pricing, stock
- **cart_items:** User shopping cart (user_id, product_id, quantity)
- **orders:** Customer orders with status tracking and shipping address
- **order_items:** Items within each order (preserves historical pricing)
- **chat_sessions:** Support chat sessions linked to orders
- **chat_messages:** Individual chat messages

## Default Credentials

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Admin | `admin` | `Admin@123` | **Must be changed after first login** |

## Deployment

```bash
# Build and run all containers
docker compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8080
# Database: internal (sqlite at /data/repairshop.db)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production-use-a-long-random-secret` | JWT signing key — **change in production** |
| `SPRING_DATASOURCE_URL` | `jdbc:sqlite:/data/repairshop.db` | SQLite file path |
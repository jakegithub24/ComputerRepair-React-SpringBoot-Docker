# API Test Plan — Computer Repair Shop

Base URL: `http://localhost:8080`
Frontend URL: `http://localhost:80`

---

## Auth Endpoints `/api/auth`

| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 1 | POST | `/api/auth/register` | `{"username":"testuser","email":"t@t.com","password":"Pass1!"}` | 201, user object |
| 2 | POST | `/api/auth/register` | duplicate username | 409 Conflict |
| 3 | POST | `/api/auth/register` | missing fields | 400 Bad Request |
| 4 | POST | `/api/auth/login` | `{"username":"testuser","password":"Pass1!"}` | 200, `{token, username, role}` |
| 5 | POST | `/api/auth/login` | wrong password | 401 Unauthorized |
| 6 | POST | `/api/auth/login` | unknown user | 401 Unauthorized |
| 7 | POST | `/api/auth/change-password` | `{"currentPassword":"...","newPassword":"..."}` + Bearer | 204 No Content |
| 8 | POST | `/api/auth/change-password` | wrong current password | 401 |
| 9 | POST | `/api/auth/change-password` | no token | 401 |

---

## User Endpoints `/api/users`

| # | Method | Endpoint | Auth | Expected |
|---|--------|----------|------|----------|
| 10 | DELETE | `/api/users/me` | USER token | 204 No Content |
| 11 | DELETE | `/api/users/me` | no token | 401 |

---

## Product Endpoints `/api/products` (public)

| # | Method | Endpoint | Params | Expected |
|---|--------|----------|--------|----------|
| 12 | GET | `/api/products` | `page=0&size=20` | 200, paginated list |
| 13 | GET | `/api/products` | `page=0&size=5` | 200, max 5 items |
| 14 | GET | `/api/products/{id}` | valid id | 200, product object |
| 15 | GET | `/api/products/{id}` | invalid id | 404 |
| 16 | GET | `/api/products/search` | `q=laptop` | 200, filtered list |
| 17 | GET | `/api/products/search` | `q=zzznomatch` | 200, empty content |
| 18 | GET | `/api/products/category/{category}` | `Laptop` | 200, filtered list |
| 19 | GET | `/api/products/category/{category}` | `Unknown` | 200, empty content |

---

## Catalogue Endpoints `/api/catalogue` (public)

| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 20 | GET | `/api/catalogue` | 200, list of available items |
| 21 | GET | `/api/catalogue/{productId}` | 200, single item |
| 22 | GET | `/api/catalogue/{productId}` | invalid → 404 |

---

## Cart Endpoints `/api/cart` (auth required)

| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 23 | GET | `/api/cart` | — | 200, list (may be empty) |
| 24 | POST | `/api/cart` | `{"productId":"PROD-001","quantity":1}` | 201, cart item |
| 25 | POST | `/api/cart` | invalid productId | 400 |
| 26 | POST | `/api/cart` | quantity > stock | 400 |
| 27 | PUT | `/api/cart/{productId}` | `{"quantity":3}` | 200, updated item |
| 28 | DELETE | `/api/cart/{productId}` | — | 204 |
| 29 | DELETE | `/api/cart` | — | 204 (clear all) |
| 30 | GET | `/api/cart/total` | — | 200, `{"total": N}` |
| 31 | GET | `/api/cart/count` | — | 200, `{"count": N}` |
| 32 | GET | `/api/cart` | no token | 401 |

---

## Order Endpoints `/api/orders` (auth required)

| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 33 | POST | `/api/orders` | `{"shippingAddress":"123 St"}` | 201, order object |
| 34 | POST | `/api/orders` | empty cart | 400 |
| 35 | POST | `/api/orders` | missing shippingAddress | 400 |
| 36 | GET | `/api/orders` | — | 200, list |
| 37 | GET | `/api/orders/{id}` | own order id | 200, order |
| 38 | GET | `/api/orders/{id}` | other user's order id | 403/500 |
| 39 | GET | `/api/orders/{id}/items` | valid id | 200, list of items |
| 40 | GET | `/api/orders` | no token | 401 |

---

## Enquiry Endpoints `/api/enquiries` (auth required)

| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 41 | POST | `/api/enquiries` | `{"subject":"Help","message":"Issue"}` | 201, enquiry |
| 42 | POST | `/api/enquiries` | missing subject | 400 |
| 43 | POST | `/api/enquiries` | missing message | 400 |
| 44 | GET | `/api/enquiries` | — | 200, list |
| 45 | GET | `/api/enquiries` | no token | 401 |

---

## Chat Endpoints `/api/chat` (auth required)

| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 46 | POST | `/api/chat/sessions` | `{"subject":"Need help"}` | 201, session |
| 47 | GET | `/api/chat/sessions` | — | 200, list |
| 48 | GET | `/api/chat/sessions/{id}/messages` | valid session | 200, list |
| 49 | POST | `/api/chat/sessions/{id}/messages` | `{"content":"Hello"}` | 201, message |
| 50 | POST | `/api/chat/sessions/{id}/read` | — | 204 |
| 51 | GET | `/api/chat/admin/sessions` | ADMIN token | 200, all sessions |
| 52 | GET | `/api/chat/admin/sessions/pending` | ADMIN token | 200, pending |
| 53 | POST | `/api/chat/admin/sessions/{id}/accept` | ADMIN token | 200, session |
| 54 | POST | `/api/chat/admin/sessions/{id}/close` | ADMIN token | 200, session |
| 55 | POST | `/api/chat/admin/sessions` | ADMIN + `{"userId":1,"subject":"..."}` | 201 |
| 56 | GET | `/api/chat/admin/sessions` | USER token | 403 |

---

## Admin Endpoints `/api/admin` (ADMIN role required)

### Users
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 57 | GET | `/api/admin/users` | 200, paginated users |
| 58 | GET | `/api/admin/users/deleted` | 200, paginated deleted users |
| 59 | DELETE | `/api/admin/users/{id}` | 204 |
| 60 | PATCH | `/api/admin/users/{id}/deactivate` | 204 |
| 61 | GET | `/api/admin/users` | USER token → 403 |

### Orders
| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 62 | GET | `/api/admin/orders` | — | 200, paginated |
| 63 | PATCH | `/api/admin/orders/{id}/status` | `{"status":"Dispatched"}` | 200, updated order |
| 64 | PATCH | `/api/admin/orders/{id}/status` | `{"status":"Invalid"}` | 400 |

### Enquiries
| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 65 | GET | `/api/admin/enquiries` | — | 200, paginated |
| 66 | PATCH | `/api/admin/enquiries/{id}/status` | `{"status":"Resolved"}` | 200 |
| 67 | PATCH | `/api/admin/enquiries/{id}/status` | `{"status":"Bad"}` | 400 |

### Products
| # | Method | Endpoint | Body | Expected |
|---|--------|----------|------|----------|
| 68 | GET | `/api/admin/products` | — | 200, paginated |
| 69 | POST | `/api/admin/products` | product JSON | 201, product |
| 70 | PUT | `/api/admin/products/{id}` | updated JSON | 200, product |
| 71 | DELETE | `/api/admin/products/{id}` | — | 204 |

---

## Frontend Routes

| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/` | No | Landing page |
| `/catalogue` | No | Product catalogue |
| `/product/:productId` | No | Product detail |
| `/login` | No | Login form |
| `/register` | No | Register form |
| `/cart` | Yes (user) | Shopping cart |
| `/checkout` | Yes (user) | Checkout |
| `/dashboard` | Yes (user) | User dashboard |
| `/admin` | Yes (admin) | Admin panel |
| `/chat` | Yes (user) | Chat with admin |

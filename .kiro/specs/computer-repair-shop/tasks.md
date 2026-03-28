# Implementation Plan: Computer Repair Shop

## Overview

Incremental implementation of the full-stack computer repair shop application. Tasks are ordered to build foundational layers first (project structure, data models, auth) before layering in business logic, then frontend, and finally Docker orchestration. Each task builds on the previous and ends with all components wired together.

## Tasks

- [x] 1. Initialize project structure
  - Create Spring Boot project with Maven (Java 17+), add dependencies: Spring Web, Spring Security, Spring Data JDBC, SQLite JDBC driver, jjwt, spring-boot-starter-validation, jqwik, JUnit 5, Mockito
  - Create React app with Vite, add dependencies: axios, react-router-dom, Jest, React Testing Library
  - Define package structure: `controller`, `service`, `repository`, `model`, `dto`, `security`, `exception`, `config`
  - _Requirements: 14.1, 14.2_

- [x] 2. Define database schema and data models
  - [x] 2.1 Create SQLite schema migration script (`schema.sql`) with `users`, `orders`, `enquiries` tables including FK constraints and CASCADE DELETE
    - _Requirements: 4.2, 6.1, 7.1, 9.1, 11.2_
  - [x] 2.2 Create Java entity/record classes: `User`, `Order`, `Enquiry` matching the schema columns
    - _Requirements: 6.1, 7.1_
  - [x] 2.3 Create Spring Data JDBC repositories: `UserRepository`, `OrderRepository`, `EnquiryRepository`
    - _Requirements: 8.1, 8.2, 11.1, 12.1, 12.2_
  - [x] 2.4 Write property test for cascade deletion (Property 9)
    - **Property 9: Account deletion cascades to all associated records**
    - **Validates: Requirements 4.2, 11.2**

- [x] 3. Implement authentication infrastructure
  - [x] 3.1 Implement `AuthService`: Argon2id password hashing/verification, JWT generation (HS256, 24h expiry) and validation
    - _Requirements: 2.5, 3.1, 3.4, 9.2, 9.4_
  - [x] 3.2 Write property test for JWT expiry (Property 8)
    - **Property 8: JWT expiry is at most 24 hours**
    - **Validates: Requirements 3.4, 9.4**
  - [x] 3.3 Write property test for password storage as Argon2id (Property 5)
    - **Property 5: Passwords are stored as Argon2id hashes**
    - **Validates: Requirements 2.5**
  - [x] 3.4 Implement `JwtAuthenticationFilter` and Spring Security filter chain configuration
    - Public routes: `POST /api/auth/register`, `POST /api/auth/login`
    - User routes: require `ROLE_USER` or `ROLE_ADMIN`
    - Admin routes (`/api/admin/**`): require `ROLE_ADMIN`
    - _Requirements: 13.2, 13.3, 13.4_
  - [x] 3.5 Write property test for expired/tampered JWT returning 401 (Property 24)
    - **Property 24: Expired or tampered JWT returns 401**
    - **Validates: Requirements 13.2, 13.3**
  - [x] 3.6 Write property test for unauthenticated requests returning 401 (Property 10)
    - **Property 10: Unauthenticated requests to protected endpoints return 401**
    - **Validates: Requirements 4.3, 6.2, 7.2, 8.4, 11.4**
  - [x] 3.7 Write property test for non-admin JWT on admin endpoints returning 403 (Property 20)
    - **Property 20: Non-admin JWT on admin endpoints returns 403**
    - **Validates: Requirements 11.3**

- [x] 4. Implement global exception handler and error response format
  - Create `GlobalExceptionHandler` (`@ControllerAdvice`) mapping `ValidationException`, `DuplicateUsernameException`, `AuthenticationException`, `AccessDeniedException`, `ResourceNotFoundException`, `InvalidStatusException` to correct HTTP status codes
  - Implement consistent JSON error response body: `status`, `error`, `message`, `timestamp`
  - Ensure 401 responses never reveal which field was wrong; 500 responses never leak stack traces
  - _Requirements: 2.2, 2.3, 2.4, 3.2, 5.3, 6.3, 7.3, 12.5, 13.3_

- [x] 5. Implement user registration and login
  - [x] 5.1 Implement `UserService.register()`: validate unique username (409), valid email format (400), password complexity (400), hash with Argon2id, persist user
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 5.2 Implement `POST /api/auth/register` controller endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 5.3 Write property test for valid registration creating a user (Property 1)
    - **Property 1: Valid registration creates a user**
    - **Validates: Requirements 2.1**
  - [x] 5.4 Write property test for duplicate username rejection (Property 2)
    - **Property 2: Duplicate username is rejected**
    - **Validates: Requirements 2.2**
  - [x] 5.5 Write property test for invalid email format rejection (Property 3)
    - **Property 3: Invalid email format is rejected**
    - **Validates: Requirements 2.3**
  - [x] 5.6 Write property test for weak password rejection (Property 4)
    - **Property 4: Weak password is rejected**
    - **Validates: Requirements 2.4, 5.4, 10.4**
  - [x] 5.7 Implement `AuthService.login()`: verify Argon2id hash, return signed JWT with `sub`, `userId`, `role` claims
    - _Requirements: 3.1, 3.2, 9.2_
  - [x] 5.8 Implement `POST /api/auth/login` controller endpoint
    - _Requirements: 3.1, 3.2_
  - [x] 5.9 Write property test for register-then-login round-trip (Property 6)
    - **Property 6: Register then login round-trip**
    - **Validates: Requirements 3.1**
  - [x] 5.10 Write property test for invalid credentials returning 401 (Property 7)
    - **Property 7: Invalid credentials return 401**
    - **Validates: Requirements 3.2, 9.3**
  - [x] 5.11 Write property test for admin JWT containing ADMIN role claim (Property 18)
    - **Property 18: Admin JWT contains the ADMIN role claim**
    - **Validates: Requirements 9.2**

- [x] 6. Implement admin seeding and password change
  - [x] 6.1 Implement `AdminSeeder`: on application startup, check if admin account exists; if not, create user with username `admin`, password hashed from `Admin@123` using Argon2id, role `ADMIN`
    - _Requirements: 9.1_
  - [x] 6.2 Write unit test for `AdminSeeder`: verify seeding runs only when no admin exists
    - _Requirements: 9.1_
  - [x] 6.3 Implement `AuthService.changePassword()`: verify current password, validate new password complexity, hash and persist new password
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 10.3, 10.4_
  - [x] 6.4 Implement `POST /api/auth/change-password` controller endpoint (requires auth)
    - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.2, 10.3_
  - [x] 6.5 Write property test for password change round-trip (Property 11)
    - **Property 11: Password change round-trip**
    - **Validates: Requirements 5.2**
  - [x] 6.6 Write property test for wrong current password blocking password change (Property 12)
    - **Property 12: Wrong current password blocks password change**
    - **Validates: Requirements 5.3, 10.3**

- [~] 7. Checkpoint — Ensure all auth and user tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement user account deletion
  - [x] 8.1 Implement `UserService.deleteOwnAccount()`: verify authenticated user, delete user record (CASCADE removes orders and enquiries)
    - _Requirements: 4.2_
  - [x] 8.2 Implement `DELETE /api/users/me` controller endpoint (requires auth)
    - _Requirements: 4.2, 4.3_
  - [x] 8.3 Write property test for account deletion cascade (Property 9 — integration with deletion endpoint)
    - **Property 9: Account deletion cascades to all associated records**
    - **Validates: Requirements 4.2, 11.2**

- [x] 9. Implement order management
  - [x] 9.1 Implement `OrderService.createOrder()`: validate service type and device description (400 if missing), persist with status `Pending`, return created order with ID
    - _Requirements: 6.1, 6.3_
  - [x] 9.2 Implement `POST /api/orders` controller endpoint (requires auth)
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 9.3 Write property test for new orders having status Pending (Property 13)
    - **Property 13: New orders are created with status Pending**
    - **Validates: Requirements 6.1**
  - [x] 9.4 Write property test for orders missing required fields returning 400 (Property 14)
    - **Property 14: Orders missing required fields return 400**
    - **Validates: Requirements 6.3**
  - [x] 9.5 Implement `OrderService.getOrdersForUser()`: return only orders belonging to the authenticated user
    - _Requirements: 8.1_
  - [x] 9.6 Implement `GET /api/orders` controller endpoint (requires auth)
    - _Requirements: 8.1, 8.4_
  - [x] 9.7 Write property test for users seeing only their own records (Property 17)
    - **Property 17: Users see only their own records**
    - **Validates: Requirements 8.1, 8.2**

- [x] 10. Implement enquiry management
  - [x] 10.1 Implement `EnquiryService.createEnquiry()`: validate subject and message (400 if missing), persist with status `Open`, return created enquiry with ID
    - _Requirements: 7.1, 7.3_
  - [x] 10.2 Implement `POST /api/enquiries` controller endpoint (requires auth)
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 10.3 Write property test for new enquiries having status Open (Property 15)
    - **Property 15: New enquiries are created with status Open**
    - **Validates: Requirements 7.1**
  - [x] 10.4 Write property test for enquiries missing required fields returning 400 (Property 16)
    - **Property 16: Enquiries missing required fields return 400**
    - **Validates: Requirements 7.3**
  - [x] 10.5 Implement `EnquiryService.getEnquiriesForUser()`: return only enquiries belonging to the authenticated user
    - _Requirements: 8.2_
  - [x] 10.6 Implement `GET /api/enquiries` controller endpoint (requires auth)
    - _Requirements: 8.2, 8.4_

- [x] 11. Implement admin endpoints
  - [x] 11.1 Implement `UserService.listAllUsers()` with pagination; implement `GET /api/admin/users` (requires ADMIN)
    - _Requirements: 11.1_
  - [x] 11.2 Write property test for admin user list being complete and paginated (Property 19)
    - **Property 19: Admin user list is complete and paginated**
    - **Validates: Requirements 11.1**
  - [x] 11.3 Implement `UserService.deleteUserById()` with cascade; implement `DELETE /api/admin/users/{id}` (requires ADMIN)
    - _Requirements: 11.2_
  - [x] 11.4 Implement `OrderService.listAllOrders()` with pagination (include submitting username); implement `GET /api/admin/orders` (requires ADMIN)
    - _Requirements: 12.1_
  - [x] 11.5 Implement `EnquiryService.listAllEnquiries()` with pagination (include submitting username); implement `GET /api/admin/enquiries` (requires ADMIN)
    - _Requirements: 12.2_
  - [x] 11.6 Write property test for admin seeing all orders and enquiries (Property 21)
    - **Property 21: Admin sees all orders and enquiries**
    - **Validates: Requirements 12.1, 12.2**
  - [x] 11.7 Implement `OrderService.updateOrderStatus()`: validate status value (400 if invalid), persist and return updated order; implement `PATCH /api/admin/orders/{id}/status` (requires ADMIN)
    - _Requirements: 12.3, 12.5_
  - [x] 11.8 Implement `EnquiryService.updateEnquiryStatus()`: validate status value (400 if invalid), persist and return updated enquiry; implement `PATCH /api/admin/enquiries/{id}/status` (requires ADMIN)
    - _Requirements: 12.4, 12.5_
  - [x] 11.9 Write property test for status update round-trip (Property 22)
    - **Property 22: Status update round-trip for orders and enquiries**
    - **Validates: Requirements 12.3, 12.4**
  - [x] 11.10 Write property test for invalid status value returning 400 (Property 23)
    - **Property 23: Invalid status value returns 400**
    - **Validates: Requirements 12.5**

- [~] 12. Implement input sanitization
  - Add input sanitization in the service layer (or via a request filter) to escape SQL injection patterns and XSS payloads before persistence
  - _Requirements: 13.5_
  - [~] 12.1 Write property test for malicious input being sanitized (Property 25)
    - **Property 25: Malicious input is sanitized before persistence**
    - **Validates: Requirements 13.5**

- [~] 13. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement React frontend — core setup
  - [x] 14.1 Set up React Router with routes: `/` (LandingPage), `/register`, `/login`, `/dashboard`, `/admin`
    - _Requirements: 1.3_
  - [x] 14.2 Implement `AuthContext`: store JWT in memory or HttpOnly cookie, expose `login`, `logout`, `currentUser` (with role)
    - _Requirements: 3.3, 4.1_
  - [x] 14.3 Implement `PrivateRoute` HOC: redirect unauthenticated users to `/login`
    - _Requirements: 8.4_
  - [x] 14.4 Implement `AdminRoute` HOC: show 403 view for non-admin users
    - _Requirements: 11.3_
  - [x] 14.5 Write React Testing Library tests for `AuthContext` state transitions (login → authenticated, logout → unauthenticated)
    - _Requirements: 3.3, 4.1_

- [x] 15. Implement React frontend — public pages and auth forms
  - [x] 15.1 Implement `LandingPage`: shop name, description, contact info, services section (buy, sell, upgrade, repair, general enquiry)
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 15.2 Write React Testing Library tests for `LandingPage` rendering shop info and services list
    - _Requirements: 1.1, 1.2_
  - [x] 15.3 Implement `RegisterForm`: fields for username, email, password; client-side validation; call `POST /api/auth/register`; show inline errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 15.4 Implement `LoginForm`: fields for username and password; call `POST /api/auth/login`; store JWT via `AuthContext`; redirect to dashboard on success; handle 401 with user-friendly message
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 16. Implement React frontend — user dashboard
  - [x] 16.1 Implement `Dashboard`: fetch and display user's orders and enquiries (ID, service type/subject, device description, status, timestamp); handle 401 by clearing JWT and redirecting to login
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 16.2 Implement `OrderForm`: fields for service type (select: buy/sell/upgrade/repair), device description, optional notes; call `POST /api/orders`; show inline errors
    - _Requirements: 6.1, 6.3_
  - [x] 16.3 Implement `EnquiryForm`: fields for subject and message; call `POST /api/enquiries`; show inline errors
    - _Requirements: 7.1, 7.3_
  - [x] 16.4 Implement logout: discard JWT via `AuthContext`, redirect to landing page
    - _Requirements: 4.1_
  - [x] 16.5 Write React Testing Library tests for `Dashboard` displaying orders and enquiries with correct fields
    - _Requirements: 8.3_

- [x] 17. Implement React frontend — admin panel
  - [x] 17.1 Implement `AdminPanel`: tabbed or sectioned view for user list, all orders, all enquiries with pagination
    - _Requirements: 11.1, 12.1, 12.2_
  - [x] 17.2 Add user deletion action in admin user list (calls `DELETE /api/admin/users/{id}`)
    - _Requirements: 11.2_
  - [x] 17.3 Add status update controls for orders (calls `PATCH /api/admin/orders/{id}/status`) and enquiries (calls `PATCH /api/admin/enquiries/{id}/status`)
    - _Requirements: 12.3, 12.4_
  - [x] 17.4 Write React Testing Library tests for `AdminPanel` rendering user list and order/enquiry lists with mock API responses
    - _Requirements: 11.1, 12.1, 12.2_

- [~] 18. Checkpoint — Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 19. Configure CORS and HTTPS
  - Configure Spring Security CORS policy to allow requests only from the known frontend origin
  - Document HTTPS setup for production (TLS termination at Nginx or reverse proxy)
  - _Requirements: 13.1, 13.4_

- [x] 20. Docker containerization
  - [x] 20.1 Write `Dockerfile` for the frontend container: multi-stage build (Node build → Nginx serve), configure Nginx to proxy `/api` to backend
    - _Requirements: 14.1_
  - [x] 20.2 Write `Dockerfile` for the backend container: multi-stage build (Maven build → JRE runtime)
    - _Requirements: 14.2_
  - [x] 20.3 Write `Dockerfile` for the database container: Alpine-based, initialize SQLite file, expose volume mount, add health-check script verifying file existence
    - _Requirements: 14.3, 14.5_
  - [x] 20.4 Write `docker-compose.yml` defining all three services, Docker volume for SQLite persistence, `depends_on` with health-check condition on the database service
    - _Requirements: 14.4, 14.5, 14.6_

- [~] 21. Final checkpoint — Wire everything together and verify
  - Ensure all backend and frontend tests pass
  - Verify Docker Compose stack starts correctly with all three containers
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use jqwik (`@Property`, `@ForAll`) on the backend and Jest + React Testing Library on the frontend
- Checkpoints ensure incremental validation at key milestones
- The admin default credential (`admin` / `Admin@123`) must be changed after first login

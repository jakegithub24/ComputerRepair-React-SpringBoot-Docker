# Requirements Document

## Introduction

A full-stack web application for a laptop and computer repair/trade shop. The platform serves as both a public-facing storefront and a service management system. Visitors can learn about the shop and its services, while registered users can submit requests for buying, selling, upgrading, or repairing devices and track those requests through to completion. A single admin account manages users, orders, and enquiries. The system is containerized using Docker with separate containers for the React frontend, Spring Boot backend, and SQLite database.

## Glossary

- **System**: The full-stack web application as a whole
- **Frontend**: The React.js single-page application served to the browser
- **Backend**: The Spring Boot (Java) REST API server
- **Database**: The SQLite database storing all persistent data
- **Admin**: The single privileged account that manages the platform
- **User**: A registered account holder who can submit and track service requests
- **Visitor**: An unauthenticated person browsing the public pages
- **Order**: A submitted request for a buy, sell, upgrade, or repair service
- **Enquiry**: A general question or contact message submitted by a User or Visitor
- **Service_Request**: A collective term for Orders and Enquiries
- **Auth_Service**: The backend component responsible for authentication and credential management
- **Order_Service**: The backend component responsible for managing Orders
- **Enquiry_Service**: The backend component responsible for managing Enquiries
- **User_Service**: The backend component responsible for managing User accounts
- **JWT**: JSON Web Token used for stateless session authentication
- **Argon2id**: The password hashing algorithm used for credential storage

---

## Requirements

### Requirement 1: Public Landing Page

**User Story:** As a Visitor, I want to view information about the shop and its services, so that I can understand what the shop offers before registering.

#### Acceptance Criteria

1. THE Frontend SHALL display a landing page containing the shop name, a brief description, and contact information.
2. THE Frontend SHALL display a services section listing all available service categories: buy, sell, upgrade, repair, and general enquiry.
3. WHEN a Visitor navigates to the root URL, THE Frontend SHALL render the landing page without requiring authentication.

---

### Requirement 2: User Registration

**User Story:** As a Visitor, I want to register an account, so that I can submit and track service requests.

#### Acceptance Criteria

1. WHEN a Visitor submits a registration form with a unique username, a valid email address, and a password, THE User_Service SHALL create a new User account and return a success response.
2. WHEN a Visitor submits a registration form with a username that already exists, THE User_Service SHALL return a 409 Conflict error with a descriptive message.
3. WHEN a Visitor submits a registration form with an invalid email format, THE Backend SHALL return a 400 Bad Request error with a descriptive message.
4. WHEN a Visitor submits a password that is fewer than 8 characters or does not contain at least one uppercase letter, one lowercase letter, one digit, and one special character, THE Backend SHALL return a 400 Bad Request error with a descriptive message.
5. WHEN a new User account is created, THE Auth_Service SHALL hash the password using Argon2id before storing it in the Database.

---

### Requirement 3: User Login

**User Story:** As a User, I want to log in to my account, so that I can access protected features.

#### Acceptance Criteria

1. WHEN a User submits valid credentials (username and password), THE Auth_Service SHALL verify the password against the stored Argon2id hash and return a signed JWT.
2. WHEN a User submits an incorrect username or password, THE Auth_Service SHALL return a 401 Unauthorized error without revealing which field was incorrect.
3. WHEN a User receives a JWT, THE Frontend SHALL store the JWT in memory or an HttpOnly cookie and include it in all subsequent authenticated requests.
4. THE JWT SHALL have an expiry of no more than 24 hours.

---

### Requirement 4: User Logout and Account Deletion

**User Story:** As a User, I want to log out and optionally delete my account, so that I can control my session and data.

#### Acceptance Criteria

1. WHEN a User requests logout, THE Frontend SHALL discard the stored JWT and redirect the User to the landing page.
2. WHEN an authenticated User requests account deletion, THE User_Service SHALL permanently remove the User's account and all associated Orders and Enquiries from the Database.
3. WHEN an unauthenticated request is made to the account deletion endpoint, THE Backend SHALL return a 401 Unauthorized error.

---

### Requirement 5: User Password Change

**User Story:** As a User, I want to change my login password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN an authenticated User submits their current password and a new password, THE Auth_Service SHALL verify the current password against the stored Argon2id hash.
2. WHEN the current password is verified successfully, THE Auth_Service SHALL hash the new password using Argon2id and update the stored credential in the Database.
3. WHEN the current password does not match the stored hash, THE Auth_Service SHALL return a 401 Unauthorized error.
4. WHEN the new password does not meet the password complexity rules defined in Requirement 2 Criterion 4, THE Backend SHALL return a 400 Bad Request error with a descriptive message.

---

### Requirement 6: Submit a Service Request (Order)

**User Story:** As a User, I want to submit a buy, sell, upgrade, or repair request, so that I can get the shop's services.

#### Acceptance Criteria

1. WHEN an authenticated User submits an Order with a service type (buy, sell, upgrade, or repair), a device description, and optional notes, THE Order_Service SHALL persist the Order in the Database with a status of "Pending" and return the created Order including its unique ID.
2. WHEN an unauthenticated request is made to the Order submission endpoint, THE Backend SHALL return a 401 Unauthorized error.
3. WHEN an Order is submitted with a missing service type or missing device description, THE Backend SHALL return a 400 Bad Request error with a descriptive message.

---

### Requirement 7: Submit an Enquiry

**User Story:** As a User, I want to submit a general enquiry, so that I can ask questions without committing to a service.

#### Acceptance Criteria

1. WHEN an authenticated User submits an Enquiry with a subject and message body, THE Enquiry_Service SHALL persist the Enquiry in the Database with a status of "Open" and return the created Enquiry including its unique ID.
2. WHEN an unauthenticated request is made to the Enquiry submission endpoint, THE Backend SHALL return a 401 Unauthorized error.
3. WHEN an Enquiry is submitted with a missing subject or missing message body, THE Backend SHALL return a 400 Bad Request error with a descriptive message.

---

### Requirement 8: User Service Request Tracking

**User Story:** As a User, I want to view and track my submitted Orders and Enquiries, so that I know the current status of my requests.

#### Acceptance Criteria

1. WHEN an authenticated User requests their Orders, THE Order_Service SHALL return only the Orders belonging to that User.
2. WHEN an authenticated User requests their Enquiries, THE Enquiry_Service SHALL return only the Enquiries belonging to that User.
3. THE Frontend SHALL display each Service_Request with its unique ID, service type, device description or subject, current status, and submission timestamp.
4. WHEN an unauthenticated request is made to the tracking endpoints, THE Backend SHALL return a 401 Unauthorized error.

---

### Requirement 9: Admin Authentication

**User Story:** As the Admin, I want to log in with a secure default credential, so that I can access the admin panel.

#### Acceptance Criteria

1. WHEN the application starts for the first time and no Admin account exists in the Database, THE Backend SHALL seed the Database with an Admin account using the username "admin" and a password hashed from "Admin@123" using Argon2id.
2. WHEN the Admin submits valid credentials, THE Auth_Service SHALL verify the password against the stored Argon2id hash and return a signed JWT with an admin role claim.
3. WHEN the Admin submits invalid credentials, THE Auth_Service SHALL return a 401 Unauthorized error.
4. THE Admin JWT SHALL have an expiry of no more than 24 hours.

---

### Requirement 10: Admin Password Change

**User Story:** As the Admin, I want to change the admin login password, so that I can replace the default credential with a secure one.

#### Acceptance Criteria

1. WHEN the authenticated Admin submits the current password and a new password, THE Auth_Service SHALL verify the current password against the stored Argon2id hash.
2. WHEN the current password is verified, THE Auth_Service SHALL hash the new password using Argon2id and update the Admin credential in the Database.
3. WHEN the current password does not match, THE Auth_Service SHALL return a 401 Unauthorized error.
4. WHEN the new password does not meet the password complexity rules defined in Requirement 2 Criterion 4, THE Backend SHALL return a 400 Bad Request error.

---

### Requirement 11: Admin User Management

**User Story:** As the Admin, I want to view and delete user accounts, so that I can manage the platform's user base.

#### Acceptance Criteria

1. WHEN the authenticated Admin requests the user list, THE User_Service SHALL return a paginated list of all registered Users including username, email, and registration timestamp.
2. WHEN the authenticated Admin requests deletion of a User by ID, THE User_Service SHALL permanently remove the User account and all associated Orders and Enquiries from the Database.
3. WHEN a non-admin JWT is used to access admin endpoints, THE Backend SHALL return a 403 Forbidden error.
4. WHEN an unauthenticated request is made to admin endpoints, THE Backend SHALL return a 401 Unauthorized error.

---

### Requirement 12: Admin Order and Enquiry Management

**User Story:** As the Admin, I want to view all Orders and Enquiries and update their statuses, so that I can manage service delivery.

#### Acceptance Criteria

1. WHEN the authenticated Admin requests all Orders, THE Order_Service SHALL return a paginated list of all Orders across all Users, including the submitting User's username.
2. WHEN the authenticated Admin requests all Enquiries, THE Enquiry_Service SHALL return a paginated list of all Enquiries across all Users, including the submitting User's username.
3. WHEN the authenticated Admin submits a status update for an Order with a valid status value (Pending, In Progress, Completed, Cancelled), THE Order_Service SHALL update the Order status in the Database and return the updated Order.
4. WHEN the authenticated Admin submits a status update for an Enquiry with a valid status value (Open, In Progress, Resolved, Closed), THE Enquiry_Service SHALL update the Enquiry status in the Database and return the updated Enquiry.
5. WHEN a status update is submitted with an invalid status value, THE Backend SHALL return a 400 Bad Request error with a descriptive message.

---

### Requirement 13: API Security

**User Story:** As the Admin, I want all API communication to be secured, so that user data and credentials are protected in transit.

#### Acceptance Criteria

1. THE Backend SHALL enforce HTTPS for all API endpoints in production.
2. THE Backend SHALL validate the JWT signature and expiry on every protected endpoint before processing the request.
3. WHEN a JWT is expired or has an invalid signature, THE Backend SHALL return a 401 Unauthorized error.
4. THE Backend SHALL apply CORS policy restricting API access to the known Frontend origin.
5. THE Backend SHALL sanitize all user-supplied input to prevent SQL injection and XSS payloads from being persisted in the Database.

---

### Requirement 14: Containerized Deployment

**User Story:** As the Admin, I want the application deployed using Docker, so that it is portable and easy to run in any environment.

#### Acceptance Criteria

1. THE System SHALL provide a Dockerfile for the Frontend container that builds and serves the React application.
2. THE System SHALL provide a Dockerfile for the Backend container that builds and runs the Spring Boot application.
3. THE System SHALL provide a Dockerfile for the Database container that initializes and persists the SQLite database file.
4. THE System SHALL provide a docker-compose.yml file that defines and orchestrates all three containers as separate services.
5. WHEN the docker-compose stack is started, THE System SHALL ensure the Backend container does not accept requests until the Database container is healthy.
6. THE System SHALL use Docker volumes to persist the SQLite database file across container restarts.

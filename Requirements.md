# Requirements :
## Tech Req :
- Frontend : ReactJs
- Backend : SpringBoot (java)
- Database : SQLite
- Containerization : Docker

## Features and Flow :
1. About :
  - Website will be about a laptop and computer related trade(but/sell), upgrade and repair.
  - Website will have a brief info about shop(landing page) and services being provided by them.
  - Website will have a flow of accepting user's requirements(buy, sell, upgrade, repair, enquiries) and track till the delivery(completion).
2. Admin :
  - There will be one 'admin' who's gonna maintain the site.
  - Admin can delete users, change status(orders, enquiries, etc).
  - Admin must be able to change account(login) password.
3. User :
  - User is gonna register/login/delete their account.
  - User can browse the website and make actions(use features/services) by registering/signin.
  - User must be able to change account(login) password.
4. Security :
  - Website (frontend, backend, database, data transmission) must be secure.
  - Use 'Argon2id' for generating/verifying hash of admin's/user's credentials.
5. Scalability :
  - Use docker container to build and deploy this app.
  - Frontend, backend and database must run from 3 individual containers.

Note :
  - Default 'admin' credentials must be => username:"admin", password:"Admin@123"
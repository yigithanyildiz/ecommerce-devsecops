# Ecommerce DevSecOps

Develop branch deploys automatically to the TEST environment.

## Local MVP Run

Start the database:

```bash
docker compose up -d
```

Prepare and run the backend:

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

Run the iOS app:

```bash
open ios/ECommerceApp/ECommerceApp.xcodeproj
```

Then select the `ECommerceApp` scheme in Xcode and run it on an iOS simulator.

MVP flow:

```text
Register/login -> browse products -> add to cart -> update cart -> checkout -> view orders
```

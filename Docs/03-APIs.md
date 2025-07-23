# API Endpoints Documentation (Refined)

## **Legend**

* ✅ = Auth required
* ✅ (Admin) = Admin Auth required
* ❌ = No Auth required

---

## **Auth APIs**

| Endpoint                   | Method | Description                     | Auth |
| -------------------------- | ------ | ------------------------------- | ---- |
| `/api/auth/register`       | POST   | Register user (OTP email/phone) | ❌    |
| `/api/auth/verify-otp`     | POST   | Verify OTP during registration  | ❌    |
| `/api/auth/login`          | POST   | User login (JWT)                | ❌    |
| `/api/auth/reset-password` | POST   | Reset password via OTP          | ❌    |
| `/api/auth/me`             | GET    | Get current user profile        | ✅    |
| `/api/auth/logout`         | POST   | Logout user                     | ✅    |

---

## **User Profile APIs**

| Endpoint                   | Method | Description                        | Auth |
| -------------------------- | ------ | ---------------------------------- | ---- |
| `/api/users/me`            | GET    | Get user profile with lending info | ✅    |
| `/api/users/me`            | PATCH  | Update user profile                | ✅    |
| `/api/users/addresses`     | POST   | Add address                        | ✅    |
| `/api/users/addresses/:id` | PATCH  | Update address                     | ✅    |
| `/api/users/addresses/:id` | DELETE | Delete address                     | ✅    |
| `/api/users/wishlist`      | GET    | Get wishlist                       | ✅    |
| `/api/users/wishlist`      | POST   | Add to wishlist                    | ✅    |
| `/api/users/wishlist/:id`  | DELETE | Remove from wishlist               | ✅    |

---

## **Product APIs**

| Endpoint                         | Method | Description                                      | Auth |
| -------------------------------- | ------ | ------------------------------------------------ | ---- |
| `/api/products`                  | GET    | List products (pagination, filters via query)    | ❌    |
| `/api/products/:id`              | GET    | Product details                                  | ❌    |
| `/api/products/:id/reviews`      | POST   | Add review with images/videos                    | ✅    |
| `/api/products/:id/reviews/:rid` | PATCH  | Update review                                    | ✅    |
| `/api/products/:id/reviews/:rid` | DELETE | Delete review                                    | ✅    |
| `/api/products/:id/ratings`      | POST   | Add/update rating                                | ✅    |
| `/api/products/search`           | GET    | Search products with debounce                    | ❌    |
| `/api/products/filter`           | GET    | Filter products by category, price, etc.         | ❌    |
| `/api/products/similar/:id`      | GET    | Get similar/related products for recommendations | ❌    |

---

## **Cart APIs**

| Endpoint          | Method | Description                         | Auth |
| ----------------- | ------ | ----------------------------------- | ---- |
| `/api/cart`       | GET    | Get user cart (supports guest cart) | ❌    |
| `/api/cart`       | POST   | Add product to cart                 | ❌    |
| `/api/cart/:id`   | PATCH  | Update cart item quantity           | ❌    |
| `/api/cart/:id`   | DELETE | Remove cart item                    | ❌    |
| `/api/cart/merge` | POST   | Merge guest cart on login           | ✅    |

---

## **Checkout APIs**

| Endpoint                     | Method | Description                                             | Auth |
| ---------------------------- | ------ | ------------------------------------------------------- | ---- |
| `/api/checkout`              | POST   | Place order (delivery/pickup) / Create checkout session | ✅    |
| `/api/checkout/:id/pay`      | PATCH  | Mark checkout as paid after payment success             | ✅    |
| `/api/checkout/:id/finalize` | PATCH  | Finalize checkout to order post-payment                 | ✅    |

---

## **Order APIs**

| Endpoint             | Method | Description                                             | Auth |
| -------------------- | ------ | ------------------------------------------------------- | ---- |
| `/api/orders`        | GET    | Get user's orders (supports pagination, limit, filters) | ✅    |
| `/api/orders/:id`    | GET    | Get specific order                                      | ✅    |
| `/api/orders/search` | GET    | Search orders with debounce                             | ✅    |

---

## **Chat APIs**

| Endpoint             | Method | Description              | Auth |
| -------------------- | ------ | ------------------------ | ---- |
| `/api/chat/initiate` | POST   | Initiate chat with admin | ✅    |
| `/api/chat/:roomId`  | GET    | Get chat messages        | ✅    |
| `/api/chat/:roomId`  | POST   | Send message             | ✅    |

---

## **Lending Management (Special Customers)**

| Endpoint                       | Method | Description                   | Auth |
| ------------------------------ | ------ | ----------------------------- | ---- |
| `/api/lending`                 | GET    | Get user's lending records    | ✅    |
| `/api/lending/:id`             | GET    | Get specific lending detail   | ✅    |
| `/api/lending/:id/pay`         | POST   | Pay lending due online        | ✅    |
| `/api/lending/payment/last`    | GET    | Get last paid lending payment | ✅    |
| `/api/lending/payment/history` | GET    | Get lending payment history   | ✅    |

---

## **Notification APIs**

| Endpoint                      | Method | Description               | Auth |
| ----------------------------- | ------ | ------------------------- | ---- |
| `/api/notifications`          | GET    | Get user notifications    | ✅    |
| `/api/notifications/:id/read` | POST   | Mark notification as read | ✅    |

---

## **Admin APIs**

### Dashboard & Analytics

| Endpoint               | Method | Description                       | Auth      |
| ---------------------- | ------ | --------------------------------- | --------- |
| `/api/admin/dashboard` | GET    | Get sales, orders, analytics data | ✅ (Admin) |

### Product Management

| Endpoint                     | Method | Description                              | Auth      |
| ---------------------------- | ------ | ---------------------------------------- | --------- |
| `/api/admin/products`        | POST   | Add new product                          | ✅ (Admin) |
| `/api/admin/products/:id`    | PATCH  | Update product                           | ✅ (Admin) |
| `/api/admin/products/:id`    | DELETE | Delete product                           | ✅ (Admin) |
| `/api/admin/products/search` | GET    | Search products with debounce            | ✅ (Admin) |
| `/api/admin/products/filter` | GET    | Filter products by category, price, etc. | ✅ (Admin) |

### Order Management

| Endpoint                   | Method | Description                                    | Auth      |
| -------------------------- | ------ | ---------------------------------------------- | --------- |
| `/api/admin/orders`        | GET    | Get all orders (pagination, filters supported) | ✅ (Admin) |
| `/api/admin/orders/:id`    | PATCH  | Update order status                            | ✅ (Admin) |
| `/api/admin/orders/:id`    | DELETE | Cancel order                                   | ✅ (Admin) |
| `/api/admin/orders/search` | GET    | Search orders with debounce                    | ✅ (Admin) |
| `/api/admin/orders/filter` | GET    | Filter orders by date, price, etc.             | ✅ (Admin) |

### User Management

| Endpoint                  | Method | Description                  | Auth      |
| ------------------------- | ------ | ---------------------------- | --------- |
| `/api/admin/users`        | GET    | Get all users                | ✅ (Admin) |
| `/api/admin/users/:id`    | PATCH  | Update user (role, status)   | ✅ (Admin) |
| `/api/admin/users/:id`    | DELETE | Delete user                  | ✅ (Admin) |
| `/api/admin/users/search` | GET    | Search users with debounce   | ✅ (Admin) |
| `/api/admin/users/filter` | GET    | Filter users by type, status | ✅ (Admin) |

### Review & Rating Moderation

| Endpoint                 | Method | Description                | Auth      |
| ------------------------ | ------ | -------------------------- | --------- |
| `/api/admin/reviews`     | GET    | Get reviews for moderation | ✅ (Admin) |
| `/api/admin/reviews/:id` | PATCH  | Approve/reject review      | ✅ (Admin) |
| `/api/admin/ratings`     | GET    | Get ratings for moderation | ✅ (Admin) |

### Coupon Management

| Endpoint                 | Method | Description   | Auth      |
| ------------------------ | ------ | ------------- | --------- |
| `/api/admin/coupons`     | POST   | Create coupon | ✅ (Admin) |
| `/api/admin/coupons/:id` | PATCH  | Update coupon | ✅ (Admin) |
| `/api/admin/coupons/:id` | DELETE | Delete coupon | ✅ (Admin) |

### Lending Management

| Endpoint                               | Method | Description                   | Auth      |
| -------------------------------------- | ------ | ----------------------------- | --------- |
| `/api/admin/lending`                   | GET    | Get all lending records       | ✅ (Admin) |
| `/api/admin/lending/:userId`           | GET    | Get lending records of a user | ✅ (Admin) |
| `/api/admin/lending/:userId/:id`       | PATCH  | Update lending record         | ✅ (Admin) |
| `/api/admin/lending/:userId/:id/close` | POST   | Close lending due             | ✅ (Admin) |

### Notifications

| Endpoint                   | Method | Description                 | Auth      |
| -------------------------- | ------ | --------------------------- | --------- |
| `/api/admin/notifications` | POST   | Send notifications to users | ✅ (Admin) |

### Chat with Users

| Endpoint                  | Method | Description          | Auth      |
| ------------------------- | ------ | -------------------- | --------- |
| `/api/admin/chat/:userId` | GET    | Get chat with user   | ✅ (Admin) |
| `/api/admin/chat/:userId` | POST   | Send message to user | ✅ (Admin) |

---

## Dynamic Price By Customer

* I will Think it while Making. It have own schema & user , admin different apis.



## **Implementation Note:**

All list endpoints (`GET`) should support:
* `page`, `limit` for pagination
* query params for filtering (`category`, `status`, `minPrice`, `maxPrice`, etc.)
* optional `search` where applicable

Keep endpoints RESTful, consistent, and clean.
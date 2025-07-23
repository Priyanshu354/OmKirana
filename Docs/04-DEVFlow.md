# **Development Flows for All Features**

---

## **1. User Authentication & Profile Flow**

Scenario: User registers, logs in, manages profile and addresses.

1. User registers with OTP (email/phone) and sets a password.
2. User logs in using credentials, receives JWT for authentication.
3. User can reset the password using OTP verification.
4. User navigates to profile to view and update details.
5. User can add, edit, delete addresses within their profile.

---

## **2. Product Listing & Details Flow**

Scenario: User browses and searches for products.

1. User navigates to product listing page.
2. Frontend fetches products using GET `/api/products` with pagination, filtering.
3. User uses search input; frontend calls GET `/api/products/search` with debounce for fuzzy search.
4. User filters products by category, price using GET `/api/products/filter`.
5. User clicks on a product to view details.
6. Frontend fetches product details using GET `/api/products/:id`.
7. Related products fetched using GET `/api/products/similar/:id`.

---

## **3. Review & Rating Flow**

Scenario: User reviews and rates purchased products.

1. User navigates to the purchased product detail page.
2. User clicks “Add Review” to add text, rating, images/videos.
3. Frontend sends POST `/api/products/:productId/reviews` with JWT and review data.
4. Backend verifies user purchase eligibility.
5. Review saved in MongoDB; admin notified for moderation.
6. Admin approves/rejects the review.
7. Once approved, review appears on the product page.
8. User can update (PATCH) or delete (DELETE) their review.
9. Average product rating updates on approval.

---

## **4. Wishlist Flow**

Scenario: User saves products for later.

1. User clicks “Add to Wishlist” on a product.
2. Frontend sends POST `/api/users/wishlist` with product ID.
3. User can view wishlist using GET `/api/users/wishlist`.
4. User can remove items using DELETE `/api/users/wishlist/:productId`.

---

## **5. Cart System Flow**

Scenario: User manages cart.

1. User adds products to cart from product listing or details.
2. Frontend sends POST `/api/cart` with product data.
3. User can view cart using GET `/api/cart`.
4. User can update quantities using PATCH `/api/cart/:cartItemId`.
5. User can remove items using DELETE `/api/cart/:cartItemId`.
6. Cart persists across sessions using user’s JWT; guest cart merges on login.
7. Leave cart notification system triggers if the user abandons the cart.

---

## **6. Checkout Flow**

Scenario: User places an order for delivery or pickup.

1. User proceeds to checkout from cart.
2. User selects address, payment method, delivery/pickup, applies coupon if applicable.
3. Frontend sends POST `/api/checkout` with cart and checkout details.
4. Backend verifies and creates checkout session.
5. If online payment, user completes payment, and frontend calls PATCH `/api/checkout/:id/pay`.
6. Frontend calls PATCH `/api/checkout/:id/finalize` to convert checkout session to order.
7. Backend creates the order, reduces stock, clears cart.
8. Notification sent to user on order placement.

---

## **7. Order Management Flow**

Scenario: User views and manages orders.

1. User navigates to “My Orders.”
2. Frontend fetches orders using GET `/api/orders`.
3. User views order details using GET `/api/orders/:id`.
4. User can search orders using GET `/api/orders/search`.
5. Admin updates order status, which reflects in user orders.
6. User receives notifications for order status updates.

---

## **8. Notifications Flow**

Scenario: User receives system and order notifications.

1. Backend sends notifications on order confirmation, payment success, status updates.
2. Leave cart notification triggers if cart abandoned.
3. Notifications stored in DB; user fetches using GET `/api/users/notifications`.
4. User can mark notifications as read using PATCH `/api/users/notifications/:id/read`.

---

## **9. Real-Time Chat Flow**

Scenario: User chats with admin.

1. User initiates chat from frontend.
2. Frontend connects to websocket/Socket.IO for real-time messaging.
3. Messages stored in MongoDB under user’s chat history.
4. Admin can view, reply, and manage user chats in the admin panel.
5. User can view chat history anytime while logged in.

---

## **10. Lending Diary Flow (Special Customers)**

Scenario: Special users manage borrowed items.

1. Admin enables lending permission for specific users.
2. User borrows products; admin records items, quantity, due dates.
3. User views lending diary using GET `/api/users/lending-diary`.
4. User sees borrowed items, payment status, due dates.
5. User can pay dues online from the lending diary page.
6. Admin updates payment status, closes dues upon payment.

---

## **11. Dynamic Pricing Flow**

Scenario: User requests a custom price; admin approves or rejects.

1. On product detail, user clicks “Request Custom Price.”
2. Frontend sends a requested price to backend.
3. Backend stores request and notifies admin.
4. Admin reviews using GET `/api/products/dynamic-price-requests` and approves/rejects.
5. User fetches requests using GET `/api/users/dynamic-price-requests`.
6. If approved, user can purchase at the approved dynamic price, which is applied during checkout.
7. Admin can delete or expire requests as needed.

---

## **12. Admin Management Flows**

### Dashboard:

1. Admin views total orders, sales, pending orders.
2. Sales charts update dynamically (daily, weekly, monthly, yearly).
3. Low stock alerts shown when quantity is below the threshold.

### Product Management:

1. Admin adds, edits, deletes products.
2. Admin updates stock and near-expiry discounts.

### Order Management:

1. Admin views, filters, updates order statuses.
2. Admin can cancel orders if needed.

### User Management:

1. Admin views users, edits user details.
2. Admin manages user roles (normal/special).
3. Admin enables lending permissions.

### Coupon Management:

1. Admin creates, updates, deletes coupons with constraints.

### Chat Management:

1. Admin views user chats, sends/receives messages.
2. Admin can create group or owner-specific chat rooms.

### Lending Diary Management:

1. Admin manages lending records, edits dues, tracks payments.

---

## **13. Delivery Map Integration Flow**

Scenario: Show store and delivery areas.

1. Frontend displays Google Maps with store location.
2. Delivery boundaries shown with overlays.
3. (Future) Real-time delivery tracking to be integrated.
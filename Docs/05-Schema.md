## **Schema Design (MongoDB, Mongoose)**

---

### **User Schema**

```ts
{
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: { code: String, expiresAt: Date },
  addresses: [
    {
      label: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] }
    }
  ],
  wishlist: [{ type: ObjectId, ref: 'Product' }],
  cart: [{ product: { type: ObjectId, ref: 'Product' }, quantity: Number }],
  isSpecialCustomer: { type: Boolean, default: false },
  notifications: [
    {
      type: String, // e.g., "order_status", "cart_reminder"
      message: String,
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  loyaltyPoints: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: 'en' },
  darkMode: { type: Boolean, default: false },
}, { timestamps: true }
```

---

### **Product Schema**

```ts
{
  name: String,
  description: String,
  images: [String],
  category: String,
  price: Number,
  stock: Number,
  nearExpiryDate: Date,
  discount: { type: Number, default: 0 },
  dynamicPricingAllowedUsers: [{ type: ObjectId, ref: 'User' }],
  ratings: [{ type: ObjectId, ref: 'Rating' }],
  reviews: [{ type: ObjectId, ref: 'Review' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true }
```

---

### **Review Schema**

```ts
{
  user: { type: ObjectId, ref: 'User' },
  product: { type: ObjectId, ref: 'Product' },
  content: String,
  images: [String],
  videos: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true }
```

---

### **Rating Schema**

```ts
{
  user: { type: ObjectId, ref: 'User' },
  product: { type: ObjectId, ref: 'Product' },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true }
```

---

### **Order Schema**

```ts
{
  user: { type: ObjectId, ref: 'User' },
  products: [
    {
      product: { type: ObjectId, ref: 'Product' },
      quantity: Number,
      priceAtPurchase: Number
    }
  ],
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  address: Object,
  deliveryMethod: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  deliveryCharges: { type: Number, default: 0 },
  coupon: { type: ObjectId, ref: 'Coupon' },
  totalAmount: Number,
  appliedDiscount: Number,
}, { timestamps: true }
```

---

### **Checkout Schema**

(If separate from Order for session control)

```ts
{
  user: { type: ObjectId, ref: 'User' },
  cart: [{ product: { type: ObjectId, ref: 'Product' }, quantity: Number }],
  status: { type: String, enum: ['pending', 'paid', 'finalized'], default: 'pending' },
  paymentMethod: String,
  address: Object,
  deliveryMethod: String,
  deliveryCharges: Number,
  coupon: { type: ObjectId, ref: 'Coupon' },
  totalAmount: Number,
}, { timestamps: true }
```

---

### **Coupon Schema**

```ts
{
  code: { type: String, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true }
```

---

### **Dynamic Price Request Schema**

```ts
{
  user: { type: ObjectId, ref: 'User' },
  product: { type: ObjectId, ref: 'Product' },
  requestedPrice: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: String,
}, { timestamps: true }
```

---

### **Lending Diary Schema**

```ts
{
  user: { type: ObjectId, ref: 'User' },
  entries: [
    {
      product: { type: ObjectId, ref: 'Product' },
      quantity: Number,
      amountPaid: Number,
      amountRemaining: Number,
      dueDate: Date,
      status: { type: String, enum: ['active', 'closed'], default: 'active' },
      notes: String,
    }
  ],
}, { timestamps: true }
```

---

### **Chat Schema**

```ts
{
  roomId: { type: String, unique: true },
  participants: [{ type: ObjectId, ref: 'User' }],
  messages: [
    {
      sender: { type: ObjectId, ref: 'User' },
      content: String,
      type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true }
```
# Features

## **User / Core Features**

- User registration, login, JWT authentication.
    - OTP With email & phone number.
    - Password reset.
- User profile section.
- Product listing with pagination or infinite scroll.
- Product details with multiple images & proper discription.
- Review system : add, update, remove, add video & Pictures. ( admin moderation )
- Rating system. ( admin moderation )
- Cart system : add, update, remove & persist across sesssions.
- Checkout with 
    - Address management
    - Payment method section (COD + mock Online)
    - Delivery charges as per admin set by range.
    - Cupon discount created by admin. 
- Delivery and takeaway managment ( user select delivery or pickup ).
- Notification of order update.
- chat with admin.
- Product search with debounce + fuzzy search (Fuse.js)
- Filtering by category, price range.
- wishlist / save for later.
- Payment integration.
- Dynamic Pricing / Price by Customer.
- Notificaton system : Leave cart notification, Order confirmation, order status.

## **Admin**

- Overview : total orders, sales, pending orders.
- Daily / weekly / Monthly / Yearly sales charts.
- Online order / Cash separate chart. 
- Low stock alert ( Quantity set by admin ).
- Product managment table.
- Order managment table.
- User managment.
    - Two different kind of user 1st Normal, 2nd Special only for lending purpose.
- Chats with all user with seprate room.
    - Normal User.
    - Special User.
    - Owner also can create there own room.
- Lending dairy managment.
- Update & Special Discount about near-expiry products.
- cupon cereation with constranint.

## **Lending Managmennt Dairy Special Page**

- User can see their borrow items (Only allowed for special customer).
- Product borrowed, Quantity, Amount paid / remaining, Due date.
- Payment status / Bill:
    - User view personal lending dairy with current dues & history.
    - Admin view : manage, edit, close dues.
- Online payment from this page.

## **Real Time Chat With Admin**

- User can chat with admin while browsing products.
- Admin can reply in real time.
- Chat history presistence in mongoDB.

## **Delivery Map Integration**

- show your store location on google map.
- show delivery area boundaries.
- Real time delivery taracking status on a map ( Future Improvement ).

## **Quality & UX Enhancements**

- Responsive, clean UI with Tailwind
- Loading states with skeleton loaders
- Form validation with React Hook Form + Yup
- Lazy Loading + Reduce React.
- SEO optimization (React Helmet)
- Optimize Re-renders
- Feedback Everywhere
    - Show toast notifications for success, errors, or status changes
    - Show loaders on async actions
    - Confirmation dialogs before destructive actions
- Accessibility improvements.

## **Security & Performance Best Practices**

- Rate limiting on API
- Input sanitization (express-validator)
- Environment variable management (.env)
- API error handling with consistent structure
- Logging with Morgan/Winston
- Image optimization before upload (Cloudinary/S3)

## **Special Feature OR Future Improvement**

- Generate QR codes for orders to scan at the store during takeaway.
- PWA (Progressive Web App) support for installability.
- Voice Search API.
- Dark Mode Support.
- Loyalty Points System
    - Users earn loyalty points per purchase
    - Points redeemable on future purchases or lending dues
- Multi-language Support
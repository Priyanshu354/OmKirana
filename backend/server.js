const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const refreshTokenRoute = require("./routes/refreshTokenRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoute = require("./routes/cartRotutes");
const checkoutRoute = require("./routes/checkoutRoutes");
const orderRoute = require("./routes/orderRoutes");

const adminProductRoute = require("./routes/Admin/adminProductRoutes");
const adminOrderRoute = require("./routes/Admin/adminOrderRoutes");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const port = process.env.PORT;

// Connection to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("DB connected Successfully");
    } catch (error) {
        console.error("DB connection failed:", error);
        process.exit(1);
    }
};
connectDB();

app.get("/", (req, res) => {
    res.send("Hi, You are here on Om Kirana");
});

app.use("/api/users", userRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/uploads", uploadRoute);
app.use("/api/refresh-token", refreshTokenRoute);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders" , orderRoute);

// Admin Routes
app.use("/api/admin/products", adminProductRoute);  
app.use("/api/admin/orders", adminOrderRoute);

app.listen(port, () => console.log(`🚀 Server is listening on PORT ${port}`));

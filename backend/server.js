const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/user");
const otpRoutes = require("./routes/otp");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

// Connection to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("✅ DB connected Successfully");
    } catch (error) {
        console.error("❌ DB connection failed:", error);
        process.exit(1);
    }
};
connectDB();

app.get("/", (req, res) => {
    res.send("Hi, You are here on Om Kirana");
});

//console.log(process.env.EMAIL, process.env.EMAIL_PASS);

app.use("/api/users", userRoutes);
app.use("/api/otp", otpRoutes);

app.listen(port, () => console.log(`🚀 Server is listening on PORT ${port}`));

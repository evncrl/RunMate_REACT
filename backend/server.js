const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDatabase = require("./database/database");
const { initFilter } = require("./utils/filterService");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize bad-words filter
initFilter();

// Connect to database
connectDatabase();

// Routes
app.get("/api", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
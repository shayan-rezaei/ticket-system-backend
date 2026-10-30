const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const commentRoutes = require("./routes/comments");
const categoryRoutes = require("./routes/categories");

const app = express();

// Middleware ها
app.use(express.json());
app.use(cors());

// اتصال روت‌های پروژه
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/categories", categoryRoutes);

// مسیر تست اولیه سرور
app.get("/", (req, res) => {
  res.json({ message: "سیستم مدیریت تیکت با موفقیت کار می‌کند!" });
});

// پورت سرور (برای اجرا روی سیستم لوکال خودتان)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// اکسپورت اپلیکیشن برای اجرا روی Vercel
module.exports = app;

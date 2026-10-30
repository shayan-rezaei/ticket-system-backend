const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// میدلور برای بررسی توکن JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "توکن احراز هویت یافت نشد." });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "super-secret-key",
    (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "توکن نامعتبر یا منقضی شده است." });
      }
      req.user = user; // شامل userId, email, role
      next();
    },
  );
};

// مسیر ورود به سیستم (Login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "ایمیل و رمز عبور الزامی است." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "super-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      message: "ورود با موفقیت انجام شد.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// دریافت اطلاعات کاربر جاری (برای صفحه تنظیمات)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد." });
    }

    res.json(user);
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ویرایش اطلاعات پروفایل و رمز عبور
router.patch("/update-profile", verifyToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد." });
    }

    let updateData = { name, email };

    // اگر کاربر خواست رمز عبور را تغییر دهد
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "وارد کردن رمز عبور فعلی الزامی است." });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return res.status(401).json({ error: "رمز عبور فعلی اشتباه است." });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({
      message: "پروفایل با موفقیت به‌روزرسانی شد.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

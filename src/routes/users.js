const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const verifyToken = require("../middlewares/auth");

const prisma = new PrismaClient();

// ۱. دریافت لیست همه کاربران (فقط ادمین)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";
    if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "شما دسترسی لازم را ندارید." });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۲. ساخت کاربر یا ادمین جدید توسط ادمین
router.post("/", verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";
    if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "شما دسترسی لازم را ندارید." });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "تمام فیلدهای اصلی الزامی هستند." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "این ایمیل قبلاً ثبت نام کرده است." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "requester", // می‌تواند requester، supporter یا admin باشد
      },
      select: { id: true, name: true, email: true, role: true },
    });

    res
      .status(201)
      .json({ message: "کاربر با موفقیت ایجاد شد.", user: newUser });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۳. ویرایش اطلاعات کاربر (فقط ادمین)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";
    if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "شما دسترسی لازم را ندارید." });
    }

    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const updateData = { name, email, role };
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({
      message: "اطلاعات کاربر با موفقیت ویرایش شد.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۴. حذف کاربر (فقط ادمین)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";
    if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "شما دسترسی لازم را ندارید." });
    }

    const { id } = req.params;

    // جلوگیری از حذف خود ادمین
    if (id === req.user.userId) {
      return res
        .status(400)
        .json({ error: "شما نمی‌توانید حساب خودتان را حذف کنید." });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "کاربر با موفقیت حذف شد." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

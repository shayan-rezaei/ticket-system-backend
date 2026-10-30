const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/auth");

const prisma = new PrismaClient();

// ۱. دریافت لیست همه دسته‌بندی‌ها
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ۲. ایجاد دسته‌بندی جدید (نیازمند احراز هویت)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "نام دسته‌بندی الزامی است." });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res
      .status(201)
      .json({ message: "دسته‌بندی با موفقیت ایجاد شد.", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

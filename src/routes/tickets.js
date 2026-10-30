const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/auth");

const prisma = new PrismaClient();

// ۱. دریافت لیست تیکت‌ها (سازگار با حروف کوچک و بزرگ نقش‌ها)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // نرمال‌سازی نقش به حروف بزرگ برای جلوگیری از خطای Case-Sensitivity
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

    let tickets;
    // اگر کاربر ادمین یا پشتیبان باشد، همه تیکت‌ها را ببیند
    if (userRole === "ADMIN" || userRole === "SUPPORTER") {
      tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else {
      // در غیر این صورت فقط تیکت‌های خودش را ببیند
      tickets = await prisma.ticket.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    }

    res.json(tickets);
  } catch (error) {
    console.error("Fetch tickets error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۲. ایجاد تیکت جدید (عنوان، توضیحات و اولویت)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      return res.status(400).json({ error: "عنوان و شرح درخواست الزامی است." });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || "normal",
        authorId: userId,
        status: "open", // وضعیت پیش‌فرض تیکت
      },
    });

    res.status(201).json({ message: "تیکت با موفقیت ایجاد شد.", ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۳. تغییر وضعیت تیکت (توسط ادمین یا پشتیبان)
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // مقادیر مجاز: "open", "in_progress", "closed"
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

    // بررسی دسترسی ادمین یا پشتیبان
    if (userRole !== "ADMIN" && userRole !== "SUPPORTER") {
      return res
        .status(403)
        .json({ error: "شما دسترسی لازم برای تغییر وضعیت تیکت را ندارید." });
    }

    if (!status) {
      return res.status(400).json({ error: "وضعیت تیکت الزامی است." });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: "وضعیت تیکت با موفقیت بروزرسانی شد.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ۴. حذف تیکت (فقط توسط ادمین مجاز است)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

    // بررسی دسترسی ادمین
    if (userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "شما اجازه دسترسی به حذف تیکت را ندارید." });
    }

    // ابتدا کامنت‌های مرتبط با تیکت را پاک می‌کنیم تا خطای کلید خارجی رخ ندهد
    await prisma.comment.deleteMany({
      where: { ticketId: id },
    });

    // سپس خود تیکت را حذف می‌کنیم
    await prisma.ticket.delete({
      where: { id },
    });

    res.json({ message: "تیکت با موفقیت حذف شد." });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

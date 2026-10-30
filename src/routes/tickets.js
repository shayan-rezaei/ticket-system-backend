const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/auth");

const prisma = new PrismaClient();

// ۱. دریافت لیست تیکت‌ها (سازگار با حروف کوچک و بزرگ نقش‌ها)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

    let tickets;
    if (userRole === "ADMIN" || userRole === "SUPPORTER") {
      tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else {
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
        status: "open",
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
    const { status } = req.body;
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

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

// ۴. حذف تیکت (توسط ادمین یا پشتیبان مجاز است)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.toUpperCase() : "";

    // اصلاح شد: هم ادمین و هم پشتیبان اجازه حذف دارند
    if (userRole !== "ADMIN" && userRole !== "SUPPORTER") {
      return res
        .status(403)
        .json({ error: "شما اجازه دسترسی به حذف تیکت را ندارید." });
    }

    await prisma.comment.deleteMany({
      where: { ticketId: id },
    });

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

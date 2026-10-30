const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/auth");

const prisma = new PrismaClient();

// دریافت کامنت‌های یک تیکت
router.get("/:ticketId", verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    res.json(comments);
  } catch (error) {
    console.error("Fetch comments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ثبت کامنت جدید (با بررسی بسته بودن تیکت)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { content, ticketId } = req.body;
    const userId = req.user.userId;

    if (!content || !ticketId) {
      return res
        .status(400)
        .json({ error: "متن پیام و شناسه تیکت الزامی است." });
    }

    // بررسی وضعیت تیکت
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "تیکت مورد نظر یافت نشد." });
    }

    // اگر تیکت بسته شده باشد، هیچ‌کس نباید بتواند پیام بفرستد
    if (ticket.status === "closed") {
      return res
        .status(403)
        .json({
          error: "این تیکت بسته شده است و امکان ارسال پیام وجود ندارد.",
        });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(201).json({ message: "پاسخ با موفقیت ثبت شد.", comment });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

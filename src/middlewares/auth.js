const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res
      .status(401)
      .json({ error: "دسترسی غیرمجاز. توکن ارسال نشده است." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "توکن نامعتبر است یا منقضی شده." });
    }
    req.user = user; // اطلاعات کاربر (مثل userId) را به درخواست اضافه می‌کنیم
    next();
  });
};

module.exports = verifyToken;

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // پاکسازی داده‌های قبلی برای جلوگیری از خطای تکرار ایمیل
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // هش کردن رمز عبور مشترک
  const hashedPassword = await bcrypt.hash("123456789", 10);

  // ۱. ایجاد کاربر ادمین
  const adminUser = await prisma.user.create({
    data: {
      name: "مدیر سامانه",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // ۲. ایجاد کاربر عادی
  const normalUser = await prisma.user.create({
    data: {
      name: "کاربر عادی",
      email: "username@gmail.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  console.log("کاربران تستی با موفقیت ایجاد شدند: 🚀");
  console.log({ adminUser, normalUser });
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@example.org";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN" as UserRole,
    },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN" as UserRole,
      isActive: true,
    },
  });

  console.log("Seeded admin user:", {
    email: admin.email,
    password: adminPassword,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


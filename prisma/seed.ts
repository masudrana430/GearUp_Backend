import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";

const categories = [
  {
    name: "Cycling",
    slug: "cycling",
    description: "Bicycles, helmets and cycling accessories",
  },
  {
    name: "Camping",
    slug: "camping",
    description: "Tents, sleeping bags and camping equipment",
  },
  {
    name: "Fitness",
    slug: "fitness",
    description: "Home workout and fitness equipment",
  },
  {
    name: "Water Sports",
    slug: "water-sports",
    description: "Kayaks, life jackets and water sports equipment",
  },
  {
    name: "Hiking",
    slug: "hiking",
    description: "Backpacks, trekking poles and hiking equipment",
  },
  {
    name: "Team Sports",
    slug: "team-sports",
    description: "Football, cricket, basketball and team sports gear",
  },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(
    env.ADMIN_PASSWORD,
    env.BCRYPT_SALT_ROUNDS,
  );

  const admin = await prisma.user.upsert({
    where: {
      email: env.ADMIN_EMAIL,
    },
    update: {
      name: "GearUp Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "GearUp Admin",
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: category,
    });
  }

  console.log("Database seeded successfully");
  console.log(`Admin created: ${admin.email}`);
  console.log(`${categories.length} categories created`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
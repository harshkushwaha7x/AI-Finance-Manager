import { PrismaClient } from "@prisma/client";

import {
  accountantPackageSeeds,
  defaultCategoryTemplates,
} from "../src/lib/db/seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const servicePackage of accountantPackageSeeds) {
    await prisma.accountantServicePackage.upsert({
      where: { slug: servicePackage.slug },
      update: servicePackage,
      create: servicePackage,
    });
  }

  console.log(
    `Seeded ${accountantPackageSeeds.length} accountant packages and prepared ${defaultCategoryTemplates.length} category templates.`,
  );
}

main()
  .catch((error) => {
    console.error("Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "../src/lib/prisma";
import { BADGE_CATALOG } from "../src/lib/badges";

async function main() {
  for (const badge of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      create: badge,
      update: badge,
    });
  }
  console.log(`Seeded ${BADGE_CATALOG.length} badges.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Seed script: fills the database with starter data so you can log in and test.
// Run it with:  npm run db:seed
//
// It is safe to run more than once. It uses "upsert" (update-or-insert): if a record with
// the same email / room name / bed label already exists, it is left alone instead of
// being duplicated.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Development-only passwords. You can override them in .env (see .env.example).
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin12345";
const TENANT_PASSWORD = process.env.SEED_TENANT_PASSWORD || "tenant12345";

// bcrypt "cost": higher = slower to hash = harder to crack. 10 is a common default.
const BCRYPT_COST = 10;

const ROOMS = [
  { name: "Room 101", floor: 1, monthlyRate: "2500.00", bedCount: 4, notes: "Near the stairs. Shared bathroom." },
  { name: "Room 102", floor: 1, monthlyRate: "3500.00", bedCount: 2, notes: "Air-conditioned." },
  { name: "Room 201", floor: 2, monthlyRate: "3000.00", bedCount: 3, notes: null },
];

// Both sample tenants share Room 101, which makes utility splitting easy to test later.
const TENANTS = [
  {
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    contactNumber: "09171234567",
    schoolOrWorkplace: "Sample University",
    emergencyContactName: "Rosa Dela Cruz",
    emergencyContactNumber: "09181234567",
    moveInDate: "2026-06-01",
    roomName: "Room 101",
    bedLabel: "Bed 1",
  },
  {
    name: "Maria Santos",
    email: "maria@example.com",
    contactNumber: "09221234567",
    schoolOrWorkplace: "Sample BPO Company",
    emergencyContactName: "Pedro Santos",
    emergencyContactNumber: "09231234567",
    moveInDate: "2026-08-15",
    roomName: "Room 101",
    bedLabel: "Bed 2",
  },
];

async function main() {
  // 1. The admin account
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Boarding House Admin",
      email: "admin@example.com",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_COST),
      role: "ADMIN",
    },
  });

  // 2. Rooms, each with its bed slots ("Bed 1", "Bed 2", ...)
  for (const { bedCount, ...roomData } of ROOMS) {
    const room = await prisma.room.upsert({
      where: { name: roomData.name },
      update: {},
      create: roomData,
    });

    for (let i = 1; i <= bedCount; i++) {
      const label = `Bed ${i}`;
      await prisma.bed.upsert({
        // "roomId_label" is how Prisma names the @@unique([roomId, label]) pair.
        where: { roomId_label: { roomId: room.id, label } },
        update: {},
        create: { roomId: room.id, label },
      });
    }
  }

  // 3. Tenants: a User login account plus a Tenant profile, assigned to a bed
  for (const t of TENANTS) {
    const bed = await prisma.bed.findFirst({
      where: { label: t.bedLabel, room: { name: t.roomName } },
      include: { tenant: true },
    });

    await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        passwordHash: await bcrypt.hash(TENANT_PASSWORD, BCRYPT_COST),
        role: "TENANT",
        // Creates the linked Tenant row in the same step.
        tenant: {
          create: {
            contactNumber: t.contactNumber,
            schoolOrWorkplace: t.schoolOrWorkplace,
            emergencyContactName: t.emergencyContactName,
            emergencyContactNumber: t.emergencyContactNumber,
            // "YYYY-MM-DD" strings are read as midnight UTC, which a @db.Date column
            // stores as exactly that calendar day.
            moveInDate: new Date(t.moveInDate),
            // Only take the bed if nobody else is in it (matters if you re-run the seed).
            bedId: bed && !bed.tenant ? bed.id : null,
          },
        },
      },
    });
  }

  const [users, rooms, beds, tenants] = await Promise.all([
    prisma.user.count(),
    prisma.room.count(),
    prisma.bed.count(),
    prisma.tenant.count(),
  ]);

  console.log("✅ Seed complete.");
  console.log(`   ${users} users, ${rooms} rooms, ${beds} beds, ${tenants} tenants in the database.`);
  console.log("");
  console.log("   Sample logins (development only):");
  console.log(`   Admin:   admin@example.com / ${ADMIN_PASSWORD}`);
  for (const t of TENANTS) {
    console.log(`   Tenant:  ${t.email} / ${TENANT_PASSWORD}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

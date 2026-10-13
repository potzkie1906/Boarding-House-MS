// TEMPORARY Phase 1 page: confirms that Next.js, Tailwind CSS, and the PostgreSQL
// connection all work. In Phase 3 this page will redirect to the login screen instead.
import { prisma } from "@/lib/prisma";

// Run this page on every request instead of pre-building it once,
// because we want a live check of the database each time it loads.
export const dynamic = "force-dynamic";

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL is not set. Did you create the .env file?" };
  }

  try {
    // A tiny query that works on any PostgreSQL database, even an empty one.
    const rows = await prisma.$queryRaw`SELECT current_database() AS name, version() AS version`;
    return { ok: true, name: rows[0].name, version: rows[0].version };
  } catch (error) {
    // Prisma wraps PostgreSQL's own message in extra text; show the plain one if we have it.
    const cause = error.meta?.driverAdapterError?.cause;
    return { ok: false, message: cause?.originalMessage ?? error.message.trim() };
  }
}

export default async function Home() {
  const db = await checkDatabase();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">Boarding House Management System</h1>
      <p className="mt-2 text-gray-600">Phase 1 setup check</p>

      <ul className="mt-8 space-y-3">
        <li className="rounded-lg border border-green-200 bg-green-50 p-4">
          ✅ <strong>Next.js</strong> is running (you are seeing this page).
        </li>
        {/* If this box looks plain gray instead of blue, Tailwind CSS is not loading. */}
        <li className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          ✅ <strong>Tailwind CSS</strong> is working (this box is blue).
        </li>
        {db.ok ? (
          <li className="rounded-lg border border-green-200 bg-green-50 p-4">
            ✅ <strong>PostgreSQL</strong> connected to database <code>{db.name}</code>
            <p className="mt-1 text-sm text-gray-600">{db.version}</p>
          </li>
        ) : (
          <li className="rounded-lg border border-red-200 bg-red-50 p-4">
            ❌ <strong>PostgreSQL</strong> connection failed
            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-700">{db.message}</pre>
            <p className="mt-2 text-sm text-gray-700">
              Check that PostgreSQL is running and that <code>DATABASE_URL</code> in your{" "}
              <code>.env</code> file has the right username, password, and database name.
            </p>
          </li>
        )}
      </ul>
    </main>
  );
}

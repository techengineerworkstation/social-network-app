import cron from "node-cron";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET ?? "";

if (!cronSecret) {
  console.warn("CRON_SECRET is not set. Cron endpoint calls will fail.");
}

// Run every 5 minutes
const task = cron.schedule("*/5 * * * *", async () => {
  try {
    const res = await fetch(`${appUrl}/api/cron`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Cron result:`, data);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Cron error:`, err);
  }
});

console.log("Local cron scheduler started. Checking /api/cron every 5 minutes.");

task.start();

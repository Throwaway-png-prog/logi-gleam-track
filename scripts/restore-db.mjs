#!/usr/bin/env node
/**
 * LogiBack — Restore from ./exports/ into a fresh Supabase project.
 * Assumes schema migrations have already been applied (psql or Supabase SQL editor).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const OUT = "./exports";

// Restore order — parents first to satisfy FKs.
const ORDER = [
  "teams", "profiles", "managers", "products", "vip_jobs", "payment_numbers",
  "news_items", "messages", "system_settings", "admin_security",
  "review_submissions", "job_completions", "points_transactions",
  "redemption_requests", "tier_upgrades", "upgrade_requests",
  "vip_completions", "vip_upgrade_requests", "team_members",
  "news_likes", "news_comments", "message_reads", "email_verifications",
  "daily_spins", "daily_challenges", "ai_training_completions",
  "activity_logs", "mpesa_codes", "admin_actions", "admin_audit_log",
  "admin_recovery_codes", "admin_ip_lockouts", "fraud_flags",
  "login_attempts", "product_views", "referral_earnings",
  "weekly_leaderboard_payouts", "jobs",
];

const BUCKETS = ["avatars", "review-screenshots"];

async function restoreTable(name) {
  try {
    const raw = await readFile(join(OUT, "data", `${name}.json`), "utf-8");
    const rows = JSON.parse(raw);
    if (!rows.length) { console.log(`  · ${name}: empty`); return; }
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from(name).upsert(slice, { onConflict: "id" });
      if (error) console.warn(`  ⚠ ${name}: ${error.message}`);
    }
    console.log(`  ✓ ${name}: ${rows.length} rows`);
  } catch (e) {
    console.log(`  · ${name}: skipped (${e.code ?? e.message})`);
  }
}

async function restoreBucket(bucket) {
  const dir = join(OUT, "storage", bucket);
  try { await stat(dir); } catch { console.log(`  · ${bucket}: no files`); return; }

  async function walk(prefix = "") {
    const entries = await readdir(join(dir, prefix), { withFileTypes: true });
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) { await walk(rel); continue; }
      const buf = await readFile(join(dir, rel));
      const { error } = await supabase.storage.from(bucket).upload(rel, buf, { upsert: true });
      if (error) console.warn(`     ⚠ ${rel}: ${error.message}`);
    }
  }
  await walk();
  console.log(`  ✓ ${bucket}`);
}

(async () => {
  console.log("♻️  Restoring tables…");
  for (const t of ORDER) await restoreTable(t);

  console.log("\n🗂  Restoring storage…");
  for (const b of BUCKETS) await restoreBucket(b);

  console.log("\n✅ Restore complete.");
})().catch((e) => { console.error(e); process.exit(1); });

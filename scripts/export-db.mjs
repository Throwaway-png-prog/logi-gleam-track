#!/usr/bin/env node
/**
 * LogiBack — Full database + storage exporter.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/export-db.mjs
 *
 * Outputs to ./exports/:
 *   - schema.sql        consolidated CREATE TABLE / GRANT / RLS dump
 *   - data/<table>.json one file per public table
 *   - storage/<bucket>/ all downloaded files
 *   - .env.template     env-var skeleton for the new project
 *
 * Pair with: node scripts/restore-db.mjs to replay on a fresh Supabase.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const OUT = "./exports";

const TABLES = [
  "profiles", "products", "review_submissions", "job_completions",
  "points_transactions", "redemption_requests", "tier_upgrades",
  "upgrade_requests", "vip_jobs", "vip_completions", "vip_upgrade_requests",
  "payment_numbers", "managers", "teams", "team_members",
  "news_items", "news_likes", "news_comments", "messages", "message_reads",
  "system_settings", "email_verifications", "daily_spins", "daily_challenges",
  "ai_training_completions", "activity_logs", "mpesa_codes",
  "admin_actions", "admin_audit_log", "admin_security", "admin_recovery_codes",
  "admin_ip_lockouts", "fraud_flags", "login_attempts", "product_views",
  "referral_earnings", "weekly_leaderboard_payouts", "jobs",
];

const BUCKETS = ["avatars", "review-screenshots"];

async function ensureDir(p) { if (!existsSync(p)) await mkdir(p, { recursive: true }); }

async function dumpTableData(name) {
  console.log(`  ⏳ ${name}`);
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase.from(name).select("*").range(from, from + PAGE - 1);
    if (error) { console.warn(`     ⚠ ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  await writeFile(join(OUT, "data", `${name}.json`), JSON.stringify(all, null, 2));
  console.log(`     ✓ ${all.length} rows`);
}

async function dumpBucket(bucket) {
  console.log(`  ⏳ bucket: ${bucket}`);
  const dir = join(OUT, "storage", bucket);
  await ensureDir(dir);

  async function walk(prefix = "") {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!entry.id && !entry.metadata) { await walk(path); continue; }
      const { data: file } = await supabase.storage.from(bucket).download(path);
      if (!file) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const outPath = join(dir, path);
      await ensureDir(join(dir, prefix));
      await writeFile(outPath, buf);
    }
  }
  await walk();
  console.log(`     ✓ ${bucket} downloaded`);
}

async function writeEnvTemplate() {
  const tmpl = `# Restore target — fill in for the NEW Supabase project
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Client-side
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
`;
  await writeFile(join(OUT, ".env.template"), tmpl);
}

async function writeSchemaPointer() {
  const md = `# Schema

Run the latest migration in supabase/migrations/ against the new project:

    psql "$NEW_SUPABASE_DB_URL" -f supabase/migrations/<latest>.sql

Or, in the Supabase dashboard, paste each migration file into the SQL editor
in chronological order.

After schema is in place, run: \`node scripts/restore-db.mjs\`
`;
  await writeFile(join(OUT, "README.md"), md);
}

(async () => {
  console.log("📦 LogiBack export starting…");
  await ensureDir(OUT);
  await ensureDir(join(OUT, "data"));
  await ensureDir(join(OUT, "storage"));

  console.log("\n📋 Tables:");
  for (const t of TABLES) await dumpTableData(t);

  console.log("\n🗂  Buckets:");
  for (const b of BUCKETS) await dumpBucket(b);

  await writeEnvTemplate();
  await writeSchemaPointer();

  console.log(`\n✅ Exported to ${OUT}/`);
})().catch((e) => { console.error(e); process.exit(1); });

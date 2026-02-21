import pg from "pg";
const { Pool, Client } = pg;

let pool = null;
let listenerClient = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    pool.on("error", (err) => {
      console.error("Unexpected database error:", err);
    });
  }
  return pool;
}

// Setup LISTEN/NOTIFY for roster changes
export async function setupRosterListener(onChangeCallback) {
  listenerClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await listenerClient.connect();
  await listenerClient.query("LISTEN roster_update");

  listenerClient.on("notification", async (msg) => {
    if (msg.channel === "roster_update") {
      console.log("📢 Roster change detected via DB notification");
      await onChangeCallback();
    }
  });

  listenerClient.on("error", (err) => {
    console.error("❌ Listener client error:", err);
  });

  console.log("👂 Listening for roster changes...");
}

// Get all active members grouped by rank
export async function getRoster() {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT username, name, rank, joined_at
      FROM members 
      WHERE status = 'active'
      ORDER BY 
        CASE rank
          WHEN 'Vanguard Supreme' THEN 1
          WHEN 'Phantom Leader' THEN 2
          WHEN 'Phantom Regent' THEN 3
          WHEN 'Night Council' THEN 4
          WHEN 'Black Sigil' THEN 5
          WHEN 'Honorary' THEN 6
          WHEN 'Spectre' THEN 7
          WHEN 'Revenant' THEN 8
          WHEN 'Vantage' THEN 9
          WHEN 'Dagger' THEN 10
          WHEN 'Neophyte' THEN 11
          ELSE 12
        END,
        name ASC
    `);

    const grouped = {};
    result.rows.forEach(member => {
      if (!grouped[member.rank]) {
        grouped[member.rank] = [];
      }
      grouped[member.rank].push(member);
    });

    return grouped;
  } catch (err) {
    console.error("Failed to fetch roster:", err);
    return {};
  }
}

// Get roster hash to detect changes
export async function getRosterHash() {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT md5(string_agg(username || name || rank, ',' ORDER BY username)) as hash
      FROM members
      WHERE status = 'active'
    `);
    return result.rows[0]?.hash || "";
  } catch (err) {
    console.error("Failed to get roster hash:", err);
    return "";
  }
}
import { getPool } from "../db/postgres.js";

export async function saveRosterState(state) {
  const pool = getPool();
  try {
    // Save rosterMessageId
    if (state.rosterMessageId) {
      await pool.query(
        'INSERT INTO roster_state (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        ['rosterMessageId', state.rosterMessageId]
      );
    }
    
    // Save lastHash
    if (state.lastHash) {
      await pool.query(
        'INSERT INTO roster_state (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        ['lastHash', state.lastHash]
      );
    }
    
    console.log('✅ Roster state saved to database');
  } catch (err) {
    console.error("❌ Failed to save roster state:", err);
  }
}

export async function loadRosterState() {
  const pool = getPool();
  try {
    const messageIdResult = await pool.query('SELECT value FROM roster_state WHERE key = $1', ['rosterMessageId']);
    const hashResult = await pool.query('SELECT value FROM roster_state WHERE key = $1', ['lastHash']);
    
    return {
      rosterMessageId: messageIdResult.rows[0]?.value || null,
      lastHash: hashResult.rows[0]?.value || ''
    };
  } catch (err) {
    console.error("❌ Failed to load roster state:", err);
    return { rosterMessageId: null, lastHash: "" };
  }
}
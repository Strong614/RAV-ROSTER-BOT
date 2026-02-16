import fs from "fs/promises";
import path from "path";

const STATE_FILE = path.join(process.cwd(), "roster-state.json");

export async function saveRosterState(state) {
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save roster state:", err);
  }
}

export async function loadRosterState() {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist yet
    return { rosterMessageId: null, lastHash: "" };
  }
}

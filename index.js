import "dotenv/config";
import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";
import express from "express";
import { getRoster, getRosterHash, setupRosterListener } from "./db/postgres.js";
import { generateRosterCanvas } from "./canvas/generateRoster.js";
import { saveRosterState, loadRosterState } from "./storage/rosterState.js";

// ===== ENVIRONMENT VARIABLES =====
const {
  DISCORD_TOKEN,
  GUILD_ID,
  ROSTER_CHANNEL_ID,
  PORT = 3000
} = process.env;

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== STATE TRACKING =====
let state = { rosterMessageId: null, lastHash: "" };
let isUpdating = false;

// ===== ROSTER UPDATE FUNCTION =====
async function updateRoster() {
  if (isUpdating) {
    console.log("⏳ Update already in progress, skipping...");
    return;
  }

  try {
    isUpdating = true;

    // Check if roster changed
    const currentHash = await getRosterHash();
    
    if (currentHash === state.lastHash && state.rosterMessageId) {
      console.log("✅ Roster unchanged, skipping update");
      isUpdating = false;
      return;
    }

    console.log("🔄 Roster changed, regenerating...");
    
    // Fetch roster data
    const rosterData = await getRoster();
    
    // Generate canvas
    console.log("🎨 Generating canvas...");
    const imageBuffer = await generateRosterCanvas(rosterData);
    const attachment = new AttachmentBuilder(imageBuffer, { name: "roster.png" });

    // Get channel
    const channel = await client.channels.fetch(ROSTER_CHANNEL_ID);
    if (!channel) {
      console.error("❌ Roster channel not found!");
      isUpdating = false;
      return;
    }

    // Update or post new message
    if (state.rosterMessageId) {
      try {
        const message = await channel.messages.fetch(state.rosterMessageId);
        await message.edit({ files: [attachment] });
        console.log("✅ Roster updated (edited existing message)!");
      } catch (err) {
        console.warn("⚠️ Could not edit existing message, posting new one...");
        const newMessage = await channel.send({ files: [attachment] });
        state.rosterMessageId = newMessage.id;
        await saveRosterState(state);
        console.log(`✅ New roster posted! Message ID: ${state.rosterMessageId}`);
      }
    } else {
      const newMessage = await channel.send({ files: [attachment] });
      state.rosterMessageId = newMessage.id;
      await saveRosterState(state);
      console.log(`✅ Roster posted! Message ID: ${state.rosterMessageId}`);
    }

    state.lastHash = currentHash;
    await saveRosterState(state);
    isUpdating = false;

  } catch (err) {
    console.error("❌ Error updating roster:", err);
    isUpdating = false;
  }
}

// ===== BOT EVENTS =====
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Load saved state
  state = await loadRosterState();
  console.log(`📂 Loaded state - Message ID: ${state.rosterMessageId || "none"}`);
  state.lastHash = ""; // Force a fresh render on every startup

  // Set presence
  try {
    await client.user.setPresence({
      activities: [{ name: "RAV Squad Roster" }],
      status: "online"
    });
    console.log("✅ Presence set");
  } catch (err) {
    console.warn("⚠️ Could not set presence:", err);
  }

  // Initial roster generation
  console.log("🚀 Generating initial roster...");
  await updateRoster();

  // Listen for DB changes instead of polling
  await setupRosterListener(updateRoster);

  console.log("✅ Roster bot is now monitoring for changes");
});

client.on("error", (err) => {
  console.error("❌ Discord client error:", err);
});

// ===== EXPRESS SERVER (for Render & Uptime Robot) =====
const app = express();

app.get("/", (req, res) => {
  res.send("✅ RAV Roster Bot is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    botOnline: !!client.user,
    rosterMessageId: state.rosterMessageId,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ===== LOGIN =====
console.log("🚀 Starting RAV Roster Bot...");
client.login(DISCORD_TOKEN)
  .then(() => console.log("✅ Discord login successful"))
  .catch(err => {
    console.error("❌ Discord login failed:", err);
    process.exit(1);
  });

// ===== ERROR HANDLING =====
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});
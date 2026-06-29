import fs from "fs";
import path from "path";

// Define the file path where the state will be persisted as a JSON file
const filePath = path.resolve("server/state.json");

// Default initial state structure used when no saved state is found
export const state = {
  sessions: [],
  currentSessionIndex: 0,

  cars: {},

  race: {
    mode: "Safe",
    running: false,
    remainingTime: 0
  },

  laps: {}
};

// --- PERSISTENCE: LOAD ON STARTUP ---
// When this file is imported, it immediately attempts to load any previously saved state.
// Object.assign is used to merge the saved properties into the active memory reference.
try {
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(rawData);
    Object.assign(state, parsedData);
  }
} catch (err) {
  console.error("Failed to load persistent state:", err);
}

// --- PERSISTENCE: SAVE ON MUTATION ---
// Helper function to serialize and write the current state to the JSON file.
// Call this function whenever the state object is modified.
export function saveState() {
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}
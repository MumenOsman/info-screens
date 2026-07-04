import { state, saveState } from "./state.js";

let timer = null;
let emit = () => { };

const DEV_DURATION = 60;
const PROD_DURATION = 600;

export function initializeRaceEngine(emitter) {
    emit = emitter;
}

export function startRace() {

    if (state.race.running) {
        return false;
    }

    state.race.running = true;
    state.race.mode = "Safe";
    state.laps = {};

    const isDevelopment =
        process.env.NODE_ENV !== "production";

    state.race.remainingTime =
        isDevelopment ? DEV_DURATION : PROD_DURATION;

    saveState();
    emit("race:start", state.race);

    startTimer();

    return true;
}

function startTimer() {

    clearInterval(timer);

    timer = setInterval(() => {

        if (!state.race.running) {
            return;
        }

        state.race.remainingTime--;

        saveState();
        emit("timer:update", {
            remainingTime: state.race.remainingTime
        });

        if (state.race.remainingTime <= 0) {
            finishRace();
        }

    }, 1000);

}

export function setRaceMode(mode) {

    const validModes = [
        "Safe",
        "Hazard",
        "Danger",
        "Finish"
    ];

    if (!validModes.includes(mode)) {
        return false;
    }

    if (state.race.mode === "Finish") {
        return false;
    }

    if (mode === "Finish") {
        finishRace();
    } else {
        state.race.mode = mode;
        saveState();
        emit("race:modeChanged", {
            mode: state.race.mode
        });
    }

    return true;

}

export function finishRace() {

    clearInterval(timer);

    state.race.running = false;
    state.race.mode = "Finish";
    state.race.remainingTime = 0;

    saveState();
    emit("race:modeChanged", {
        mode: "Finish"
    });

    emit("race:finished", state.race);

}

export function endSession() {

    if (state.race.mode !== "Finish") {
        return false;
    }

    state.race.mode = "Danger";

    state.currentSessionIndex++;

    saveState();
    emit("session:updated", {
        currentSessionIndex: state.currentSessionIndex
    });

    emit("race:modeChanged", {
        mode: "Danger"
    });

    return true;

}

// Resumes the countdown timer after a server restart.
// Called on startup when state.race.running is true and remainingTime > 0.
export function resumeTimer() {

    if (!state.race.running || state.race.remainingTime <= 0) return;

    clearInterval(timer);

    timer = setInterval(() => {

        if (!state.race.running) {
            clearInterval(timer);
            return;
        }

        state.race.remainingTime--;

        saveState();
        emit("timer:update", {
            remainingTime: state.race.remainingTime
        });

        if (state.race.remainingTime <= 0) {
            finishRace();
        }

    }, 1000);

}

// Records a lap-line crossing for a driver.
// First crossing starts their lap count. Each subsequent crossing
// records the elapsed lap time and increments the lap counter.
export function recordLap(driverName) {

    if (!state.race.running) return false;
    if (!(driverName in state.cars)) return false;

    const now = Date.now();

    if (!state.laps[driverName]) {
        // First crossing: start the clock, lap 1 begins
        state.laps[driverName] = {
            lapTimes: [],
            lastCrossing: now,
            lapCount: 1
        };
    } else {
        const lapData = state.laps[driverName];
        const lapDuration = (now - lapData.lastCrossing) / 1000; // seconds

        lapData.lapTimes.push(lapDuration);
        lapData.lastCrossing = now;
        lapData.lapCount++;
    }

    saveState();
    emit("leaderboard:updated", getLeaderboard());

    return true;

}

// Builds and returns leaderboard data for the current session,
// sorted by fastest lap time ascending (no lap time goes to the bottom).
export function getLeaderboard() {

    const currentSession = state.sessions[state.currentSessionIndex];
    if (!currentSession) return [];

    const entries = currentSession.drivers.map(driver => {
        const lapData = state.laps[driver] || { lapTimes: [], lapCount: 0 };
        const fastestLap = lapData.lapTimes.length > 0
            ? Math.min(...lapData.lapTimes)
            : null;

        return {
            driver,
            car: state.cars[driver],
            lapCount: lapData.lapCount,
            fastestLap
        };
    });

    // Drivers with a recorded lap time are sorted fastest first.
    // Drivers who haven't completed a full lap yet go to the bottom.
    entries.sort((a, b) => {
        if (a.fastestLap === null && b.fastestLap === null) return 0;
        if (a.fastestLap === null) return 1;
        if (b.fastestLap === null) return -1;
        return a.fastestLap - b.fastestLap;
    });

    return entries;

}
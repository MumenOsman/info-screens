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

    state.race.mode = mode;

    saveState();
    emit("race:modeChanged", {
        mode: state.race.mode
    });

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
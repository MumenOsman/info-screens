import { state, saveState } from "./state.js";

let emit = () => { };

export function initializeSessionManager(emitter) {
    emit = emitter;
}

export function addSession(name) {
    if (state.race.running) return false;

    const trimmedName = name?.trim();
    if (!trimmedName) return false;

    const exists = state.sessions.some(
        s => s.name?.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) return false;

    const session = {
        id: Date.now(),
        name: trimmedName,
        drivers: []
    };

    state.sessions.push(session);

    saveState();
    emit("session:updated", state.sessions);

    return session;
}

export function deleteSession(sessionId) {
    if (state.race.running) return false;

    state.sessions = state.sessions.filter(
        session => session.id !== sessionId
    );

    if (state.currentSessionIndex >= state.sessions.length) {
        state.currentSessionIndex = Math.max(0, state.sessions.length - 1);
    }

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

export function addDriver(sessionId, driverName) {
    if (state.race.running) return false;
    if (!driverName) return false;

    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    if (session.drivers.includes(driverName)) return false;

    session.drivers.push(driverName);

    assignCar(session, driverName);

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

export function removeDriver(sessionId, driverName) {
    if (state.race.running) return false;

    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    session.drivers = session.drivers.filter(
        d => d !== driverName
    );

    delete state.cars[driverName];

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

export function updateDriver(sessionId, oldName, newName) {
    if (state.race.running) return false;

    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    const index = session.drivers.indexOf(oldName);
    if (index === -1) return false;

    session.drivers[index] = newName;

    state.cars[newName] = state.cars[oldName];
    delete state.cars[oldName];

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

function assignCar(session, driverName) {
    const nextCarNumber = session.drivers.length;
    state.cars[driverName] = nextCarNumber;
}

export function getCurrentSession() {
    return state.sessions[state.currentSessionIndex] || null;
}

export function getNextSession() {
    return state.sessions[state.currentSessionIndex + 1] || null;
}

export function advanceSession() {
    if (state.currentSessionIndex < state.sessions.length - 1) {
        state.currentSessionIndex++;

        saveState();
        emit("session:changed", {
            currentSessionIndex: state.currentSessionIndex,
            session: getCurrentSession()
        });
    }
}
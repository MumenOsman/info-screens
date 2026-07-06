import { state, saveState } from "./state.js";

let emit = () => { };

export function initializeSessionManager(emitter) {
    emit = emitter;
}

// Creates a new race session
export function addSession(name) {
    if (state.race.running || state.race.mode === 'Finish') return false;

    const trimmedName = name?.trim();
    if (!trimmedName) return false;

    const exists = state.sessions.some(
        s => s.name?.toLowerCase() === trimmedName.toLowerCase() // Checks if sessions have duplicate names
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

// Deletes race session
export function deleteSession(sessionId) {
    if (state.race.running || state.race.mode === 'Finish') return false;

    const indexToDelete = state.sessions.findIndex(s => s.id === sessionId);
    if (indexToDelete === -1) return false;

    state.sessions.splice(indexToDelete, 1);

    if (indexToDelete < state.currentSessionIndex) {
        state.currentSessionIndex--;
    }

    if (state.currentSessionIndex >= state.sessions.length) {
        state.currentSessionIndex = Math.max(0, state.sessions.length - 1);
    }

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

// Checks if drivers have duplicate names
function isDriverNameDuplicate(newName) {
    const lowerName = newName.trim().toLowerCase();
    for (const session of state.sessions) {
        if (!session.drivers) continue;
        for (const driverName of session.drivers) {
            if (driverName.toLowerCase() === lowerName) return true;
        }
    }
    return false;
}

// Adds driver to session
export function addDriver(sessionId, driverName) {
    if (state.race.running || state.race.mode === 'Finish') return false;
    if (!driverName) return false;

    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    const trimmedName = driverName.trim();
    if (isDriverNameDuplicate(trimmedName)) return false;

    session.drivers.push(trimmedName);

    assignCar(session, trimmedName);

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

// Removes driver from session
export function removeDriver(sessionId, driverName) {
    if (state.race.running || state.race.mode === 'Finish') return false;

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

// Edits driver name
export function updateDriver(sessionId, oldName, newName) {
    if (state.race.running || state.race.mode === 'Finish') return false;

    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    const index = session.drivers.indexOf(oldName);
    if (index === -1) return false;

    const trimmedNew = newName.trim();
    if (!trimmedNew) return false;
    if (trimmedNew.toLowerCase() !== oldName.toLowerCase() && isDriverNameDuplicate(trimmedNew)) {
        return false;
    }

    session.drivers[index] = trimmedNew;

    state.cars[trimmedNew] = state.cars[oldName];
    delete state.cars[oldName];

    saveState();
    emit("session:updated", state.sessions);

    return true;
}

// Assings next available car to driver
function assignCar(session, driverName) {
    const assignedCars = new Set();
    for (const d of session.drivers) {
        if (d !== driverName && state.cars[d] !== undefined) {
            assignedCars.add(state.cars[d]);
        }
    }
    let nextCarNumber = 1;
    while (assignedCars.has(nextCarNumber)) {
        nextCarNumber++;
    }
    state.cars[driverName] = nextCarNumber;
}

export function getCurrentSession() {
    return state.sessions[state.currentSessionIndex] || null;
}

// Allows the receptionist to manually assign a specific car number to a driver
export function setCarNumber(driverName, carNumber) {
    if (state.race.running || state.race.mode === 'Finish') return false;
    if (!(driverName in state.cars)) return false;
    const num = parseInt(carNumber, 10);
    if (isNaN(num) || num < 1) return false;
    state.cars[driverName] = num;
    saveState();
    return true;
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
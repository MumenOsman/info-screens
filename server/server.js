import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { validateEnv, checkKey } from "./auth.js";
import { state, saveState } from "./state.js";
import path from "path";

// 1. Import your session manager
import * as sessionManager from "./session-manager.js";
import * as raceEngine from "./race-engine.js";

dotenv.config();
validateEnv();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// 2. Initialize the session manager with our Socket.IO emitter
// This allows session-manager.js to broadcast updates to all screens
sessionManager.initializeSessionManager((event, data) => {
    io.emit(event, data);
});

// 3. Initialize the race engine with the same Socket.IO emitter
raceEngine.initializeRaceEngine((event, data) => {
    io.emit(event, data);
});

// 4. Resume timer if the server was restarted during a live race
raceEngine.resumeTimer();

app.use(express.static("public"));

// --- ROUTES ---
app.get("/front-desk", (req, res) => {
    res.sendFile(path.resolve("views/employee/front-desk.html"));
});

app.get("/race-control", (req, res) => {
    res.sendFile(path.resolve("views/employee/race-control.html"));
});

app.get("/lap-line-tracker", (req, res) => {
    res.sendFile(path.resolve("views/employee/lap-line-tracker.html"));
});

app.get("/leader-board", (req, res) => {
    res.sendFile(path.resolve("views/public-displays/leader-board.html"));
});

app.get("/next-race", (req, res) => {
    res.sendFile(path.resolve("views/public-displays/next-race.html"));
});

app.get("/race-countdown", (req, res) => {
    res.sendFile(path.resolve("views/public-displays/race-countdown.html"));
});

app.get("/race-flags", (req, res) => {
    res.sendFile(path.resolve("views/public-displays/race-flags.html"));
});


// --- SOCKET COMMUNICATION ---
io.on("connection", (socket) => {
    console.log("Client connected");

    // Emit state_update so the Front Desk UI populates immediately
    socket.emit("state_update", state);

    socket.on("request_state", () => {
        socket.emit("state_update", state);
    });

    socket.on("auth", (data) => {
        if (checkKey(data.role, data.key)) {
            socket.emit("auth_success");
        } else {
            setTimeout(() => {
                socket.emit("auth_fail", "Invalid access key");
            }, 500);
        }
    });

    // --- SESSION MANAGER BRIDGE ---
    // These events catch requests from the Front Desk and route them to your session manager logic

    socket.on("add_session", (name) => {
        if (state.race.running || state.race.mode === 'Finish') {
            socket.emit("session:error", "Cannot add sessions while a race is in progress");
            return;
        }

        const result = sessionManager.addSession(name);

        if (!result) {
            socket.emit("session:error", "Session name already exists");
            return;
        }

        io.emit("state_update", state);
    });


    socket.on("delete_session", (sessionId) => {
        sessionManager.deleteSession(sessionId);
        io.emit("state_update", state);
    });

    socket.on("add_driver", (data) => {
        console.log("DRIVER ADDED:", data.driverName, "TO SESSION:", data.sessionId);
        sessionManager.addDriver(data.sessionId, data.driverName);
        io.emit("state_update", state);
    });

    socket.on("remove_driver", (data) => {
        sessionManager.removeDriver(data.sessionId, data.driverName);
        io.emit("state_update", state);
    });

    socket.on("update_driver", (data) => {
        sessionManager.updateDriver(data.sessionId, data.oldName, data.newName);
        io.emit("state_update", state);
    });

    // Allow receptionist to reassign a driver to a specific car number
    socket.on("set_car", (data) => {
        sessionManager.setCarNumber(data.driverName, data.carNumber);
        io.emit("state_update", state);
    });

    // --- RACE ENGINE BRIDGE ---
    // These events handle race lifecycle and lap tracking from the Safety Official
    // and Lap-Line Observer screens.

    socket.on("race:start", () => {
        raceEngine.startRace();
        io.emit("state_update", state);
    });

    socket.on("race:setMode", (mode) => {
        raceEngine.setRaceMode(mode);
    });

    socket.on("race:endSession", () => {
        raceEngine.endSession();
        io.emit("state_update", state);
    });

    socket.on("lap:record", (driverName) => {
        raceEngine.recordLap(driverName);
    });

});

server.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`Server running on ${process.env.PORT}`);
});
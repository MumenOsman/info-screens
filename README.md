# Beachside Racetrack MVP 

A real-time, WebSocket-driven track management system designed to eliminate manual communication between race officials, drivers, and spectators. 

Built for Beachside Racetrack, this system uses a single "source of truth" backend to instantly synchronize employee control dashboards and public displays without relying on page refreshes or polling. It features a modern, responsive Glassmorphism UI optimized for desktop monitors, public TVs, and trackside tablets.

## Project Overview

This Minimum Viable Product (MVP) handles the core operational flow of a race session:
1. **Queuing:** Registering drivers and assigning cars at the Front Desk.
2. **Execution:** Starting the race, managing track safety modes (Safe, Hazard, Danger, Finished), and running the official countdown timer.
3. **Tracking:** Logging real-time lap times as cars cross the line via tablet interfaces.
4. **Broadcasting:** Instantly updating public screens for drivers (paddock queues, flag alerts) and spectators (live leaderboards).

*Note: As per MVP requirements, this application utilizes in-memory state management. All race data is reset if the Node.js server restarts.*

---

## 🛠 Setup and Installation

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A terminal/command prompt.

### 1. Installation
Clone or download this repository, then navigate to the project root directory in your terminal:
```bash
npm install express socket.io dotenv
npm install
cd info-screens
cd server

3. Starting the Server
Note: As per MVP requirements, this application utilizes in-memory state management. All race data is reset if the Node.js server restarts.

For Testing (60-second races):
npm run dev

For Production (10-minute races):
npm start

### Security Setup (.env)
The employee dashboards are protected by access keys. Create a file named `.env` inside your `server` folder and add the following keys exactly as shown (they must be lowercase):

```env
receptionist_key=receptionist
safety_key=safety
observer_key=observer
PORT=3000


 The Testing Flight Manual
To test this real-time, multi-interface application by yourself locally, you need to simulate the track environment by opening multiple browser windows side-by-side.

Phase 1: The Command Center Setup
Open your web browser and arrange four different windows on your screen so you can see them all at once.

Window 1 (Front Desk): http://localhost:3000/front-desk

Window 2 (Paddock View): http://localhost:3000/next-race

Window 3 (Race Control): http://localhost:3000/race-control

Window 4 (Leaderboard): http://localhost:3000/leader-board

Phase 2: Queuing Drivers
In the Front Desk window, unlock the dashboard using the key: receptionist.

Type a driver's name (e.g., "Lewis") and hit Add Driver.

Watch the magic: Without refreshing anything, look at your Paddock window. Lewis will instantly appear assigned to Car 1.

Add two more drivers (e.g., "Max" and "Charles").

Phase 3: Starting the Race
In the Race Control window, unlock it using the key: safety.

Click Start Race.

Check the other windows:

The Race Control status flips to "Safe" and the timer starts.

The Leaderboard populates with your three drivers (0 laps).

The Paddock window updates its title to warn waiting drivers that the track is currently busy.

Phase 4: Tracking Laps (The Action)
Open a new tab: http://localhost:3000/lap-line-tracker and unlock it with observer.

Click "Car 1" once (starts Lap 1). Wait 3 seconds, click "Car 1" again.

Check the Leaderboard: Car 1 instantly jumps to 1st place, showing 1 Lap completed and their exact lap time in milliseconds.

Tap the buttons for Cars 2 and 3 and watch the Leaderboard sort them automatically.

Phase 5: Hazard and Finish Flags
Open http://localhost:3000/race-flags in a new tab.

In the Race Control window, click Flag: Hazard (Yellow). The flag screen instantly turns yellow.

Wait for the 60-second timer to hit zero (or click Finish Race manually).

The public flag screen will change to a black-and-white checkered pattern.

The Lap-Line Tracker buttons will disappear to prevent further lap logging.

Phase 6: Resetting for the Next Race
In the Race Control window, click End Session (Cars returned).

Look at the Leaderboard—it will clear out.

Look at the Paddock screen—it will reset to a pulsing "PROCEED TO CARS", ready for the next batch of drivers!
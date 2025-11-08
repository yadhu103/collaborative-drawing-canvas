# 🏗️ System Architecture — Sketchy

Sketchy is a real-time collaborative drawing web application using **Socket.IO** and **Express**.

## 📦 Overview
The app lets multiple users draw on the same canvas in real-time with synchronized updates, undo/redo, and cursor tracking.

## ⚙️ Architecture
```
Client (Browser)
 ├── index.html
 ├── style.css
 ├── canvas.js
 └── websocket.js
        ↓
Socket.IO (WebSocket Layer)
        ↓
Server (Node.js + Express)
 ├── server.js
 ├── Handles draw events, history, undo/redo
 └── Broadcasts updates to connected clients
```

## 🔁 Event Flow
| Event | Direction | Description |
|-------|------------|-------------|
| draw | Client → Server → Clients | Syncs drawing |
| cursor-move | Client → Server → Clients | Updates cursors |
| undo / redo | Client ↔ Server | Manages undo/redo |
| history | Server → Client | Sends existing drawings |

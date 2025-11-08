
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');


const app = express();

const server = http.createServer(app);

const io = new Server(server);


const clientPath = path.join(__dirname, '..', 'client');
console.log(`Serving static files from: ${clientPath}`);

app.use(express.static(clientPath));
const drawingHistory = [];
let redoStack = [];

io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    socket.emit('history', drawingHistory);
    socket.on('draw', (data) => {
        if (redoStack.length > 0) {
            redoStack = [];
        }
        drawingHistory.push(data);
        socket.broadcast.emit('draw', data);
    });
    socket.on('cursor-move', (data) => {
        
        socket.broadcast.emit('cursor-move', {
            ...data, 
            userId: socket.id
        });
    });
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
    socket.on('undo', () => {
        if (drawingHistory.length === 0) {
            return; 
        }

        
        const lastStrokeId = drawingHistory[drawingHistory.length - 1].strokeId;
        
       
        const undoneStroke = [];
        
        
        while (drawingHistory.length > 0 && 
               drawingHistory[drawingHistory.length - 1].strokeId === lastStrokeId) {
           
            undoneStroke.unshift(drawingHistory.pop());
        }
        
      
        if (undoneStroke.length > 0) {
            redoStack.push(undoneStroke);
        }
        
       
        io.emit('redraw', drawingHistory);
    });

  
    socket.on('redo', () => {
        if (redoStack.length === 0) {
            return;
        }
        
       
        const strokeToRedo = redoStack.pop();
        
        
        for (const data of strokeToRedo) {
            drawingHistory.push(data);
        }
        
        
        io.emit('redraw', drawingHistory);
    });
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
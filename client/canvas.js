window.addEventListener('load', () => {

    const canvas = document.getElementById('drawing-canvas');
    const colorPicker = document.getElementById('color-picker');
    const strokeWidth = document.getElementById('stroke-width');
    const brushBtn = document.getElementById('brush-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    const cursorCanvas = document.getElementById('cursor-canvas');

    const ctx = canvas.getContext('2d');
    const cursorCtx = cursorCanvas.getContext('2d');

    canvas.width = 1000;
    canvas.height = 600;
    
    cursorCanvas.width = 1000;
    cursorCanvas.height = 600;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    let currentStrokeId = null; 

    let remoteCursors = {};

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        currentStrokeId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function draw(e) {
        socket.emit('cursor-move', { x: e.offsetX, y: e.offsetY });

        if (!isDrawing) return;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        const drawData = {
            x0: lastX,
            y0: lastY,
            x1: e.offsetX,
            y1: e.offsetY,
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
            tool: ctx.globalCompositeOperation,
            strokeId: currentStrokeId 
        };

        socket.emit('draw', drawData);

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function stopDrawing() {
        isDrawing = false;
    }

    colorPicker.addEventListener('change', (e) => {
        ctx.strokeStyle = e.target.value;
    });

    strokeWidth.addEventListener('input', (e) => {
        ctx.lineWidth = e.target.value;
    });

    brushBtn.addEventListener('click', () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    });

    eraserBtn.addEventListener('click', () => {
        ctx.globalCompositeOperation = 'destination-out';
    });

    undoBtn.addEventListener('click', () => {
        socket.emit('undo');
    });

    redoBtn.addEventListener('click', () => {
        socket.emit('redo');
    });

    canvas.addEventListener('mousedown', startDrawing);
    
    canvas.addEventListener('mousemove', (e) => {
        draw(e);
        if (!isDrawing) {
            socket.emit('cursor-move', { x: e.offsetX, y: e.offsetY });
        }
    });

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    function drawRemote(data) {
        ctx.save();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.globalCompositeOperation = data.tool;
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
        ctx.restore();
    }

    socket.on('draw', (data) => {
        drawRemote(data);
    });

    socket.on('history', (history) => {
        console.log(`Replaying ${history.length} draw events...`);
        for (const data of history) {
            drawRemote(data);
        }
        console.log('...History replay complete!');
    });

    socket.on('redraw', (history) => {
        console.log('Redrawing canvas from history...');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const data of history) {
            drawRemote(data);
        }
    });

    socket.on('cursor-move', (data) => {
        remoteCursors[data.userId] = { x: data.x, y: data.y };
    });

    socket.on('user-disconnected', (userId) => {
        delete remoteCursors[userId];
    });

    function drawCursorLoop() {
        cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

        for (const userId in remoteCursors) {
            const pos = remoteCursors[userId];
            
            cursorCtx.beginPath();
            cursorCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
            cursorCtx.fillStyle = 'blue';
            cursorCtx.fill();
            
            cursorCtx.font = '12px Arial';
            cursorCtx.fillText(userId.substring(0, 5), pos.x + 5, pos.y + 5);
        }

        requestAnimationFrame(drawCursorLoop);
    }

    drawCursorLoop();

});
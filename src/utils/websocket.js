const WebSocket = require('ws');

let wss;

exports.init = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('close', () => console.log('Client disconnected'));
    });
};

exports.send = (data) => {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
};
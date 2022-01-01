
const express = require('express');
const app = express();
const port = 3000;
const WebSocket = require('ws');

const expressWs = require('express-ws')(app);

app.use(express.static('public'));

const status = {
    clients: []
};

sendStatusToAll = () => {
    expressWs.getWss().clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(status));
        }
    });
}

app.ws('/ws', (ws, req) => {
    let clientId;

    const getClient = () => status.clients.find((client) => client.clientId !== clientId);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.command) {
            case 'connect':
                clientId = data.clientId;
                status.clients.push({ clientId });
                console.log('Connected: ', clientId);
                break;
            case 'set-name':
                const client = getClient();
                client.name = data.name;
                console.log('Set name for ', client.clientId, client.name );
                break;
            default:
        };

        sendStatusToAll();
    });

    ws.on('close', function () {
        console.log('Disconnected: ', clientId);
        status.clients = status.clients.filter((client) => client.clientId !== clientId);
        sendStatusToAll();
    });
});

app.listen(port, () => {
    console.log(`Lesocki server is listening at http://localhost:${port}`)
});
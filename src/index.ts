
import express from 'express';
import WebSocket from 'ws';
import expressWs from 'express-ws';

import { v4 as uuid } from 'uuid';

import { ApplyCommand, Command, ConnectCommand, GameReport, GameState } from './shared/types';
import { gameConfig } from './shared/config';

const port = 3000;


const { app, getWss } = expressWs(express());

app.use(express.static('public'));

const gameState: GameState = {
    status: 'GATHERING',
    clients: []
};

app.ws('/ws', (ws, req) => {
    const getClient = () => gameState.clients.find((client) => client.ws === ws);
    const getPlayers = () => gameState.clients
        .filter((client) => client.player)
        .map((client) => client.player);
    const sendReportToAll = () => {
        getWss().clients.forEach((clientWs) => {
            const { status, clients } = gameState;
            const myClient = clients.find((client) => client.ws === clientWs);
            if (myClient && clientWs.readyState === WebSocket.OPEN) {
                const playerClients = clients.filter((client) => client.player);
                const myIndex = playerClients.findIndex((client) => client.ws === clientWs);
                const players = playerClients.map((client) => ({
                    ...client.player,
                    connected: !!client.ws
                }));
                const numOfClients = clients.length;
                const myClientId = myClient.clientId;
                const report: GameReport = { status, myIndex, myClientId, players, numOfClients };
                clientWs.send(JSON.stringify(report));
            } else {
                console.error('Could not find my client');
            }
        });
    }

    ws.on('message', (message: string) => {
        const data: Command = JSON.parse(message);
        switch (data.command) {
            case 'connect': {
                const connectCommend = data as ConnectCommand;
                if (connectCommend.clientId) {
                    const existingClient = gameState.clients.find(client => client.clientId === connectCommend.clientId && !client.ws);
                    if (existingClient) {
                        // reconnect existing session
                        existingClient.ws = ws;
                        console.log('Reconnected: ', existingClient.clientId);
                        break;
                    }
                }
                const clientId = uuid();
                gameState.clients.push({ ws, clientId });
                console.log('Connected: ', clientId);
                break;
            }
            case 'apply': {
                const applyCommand = data as ApplyCommand;
                const { name } = applyCommand;

                // find an unused color index
                let color: number;
                do {
                    color = Math.floor(Math.random() * 4);
                } while (gameState.clients.filter((c) => c.player).find((c) => c.player.color === color));

                const client = getClient();
                if (gameState.status === 'GATHERING' && client && !client.player) {
                    client.player = { name, color, gameData: null };
                    console.log('Applied: ', client.player);
                }
                break;
            }
            case 'quit': {
                const client = getClient();
                if (gameState.status === 'GATHERING' && client && client.player) {
                    console.log('Quit: ', client.player.name);
                    client.player = null;
                }
                break;
            }
            case 'quitNotConnectedPlayers': {
                if (gameState.status === 'GATHERING') {
                    gameState.clients
                        .filter((client) => client.player && !client.ws)
                        .forEach((client) => {
                            console.log('Force quit: ', client.player.name);
                            client.player = null;
                        });
                }
                break;
            }
            case 'start': {
                const numOfPlayers = getPlayers().length;
                if (gameState.status === 'GATHERING'
                    && numOfPlayers >= gameConfig.numOfPlayers.min
                    && numOfPlayers <= gameConfig.numOfPlayers.max) {
                    console.log('Start game');
                    getPlayers().forEach(player => { player.gameData = {} });
                    gameState.status = 'GAME';
                }
                break;
            }
            case 'stop': {
                if (gameState.status !== 'GATHERING') {
                    getPlayers().forEach(player => { player.gameData = null });
                    console.log('Stop game');
                    gameState.status = 'GATHERING';
                }
                break;
            }
            default:
        };
        sendReportToAll();
    });

    ws.on('close', function () {
        const client = getClient();
        client.ws = null;
        console.log('Disconnected: ', client.clientId);
        sendReportToAll();
    });
});

app.listen(port, () => {
    console.log(`Lesocki server is listening at http://localhost:${port}`)
});
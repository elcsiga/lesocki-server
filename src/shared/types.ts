import { WebsocketMethod } from "express-ws";


export interface GameData {
    //TODO
}
export interface Player {
    name: string;
    color: number;
    gameData: GameData;
};

export interface PlayerReport extends Player {
    connected: boolean;
}

export interface GameClient {
    ws: any;
    clientId: string;
    player?: Player
};

export type GameStatus = 'GATHERING' | 'GAME';

// inner status
export interface GameState {
    status: GameStatus;
    clients: GameClient[];
};

// report for clients

export interface GameReport {
    status: GameStatus;
    myIndex: number;
    myClientId: string;
    players: PlayerReport[];
    numOfClients: number;
};

// commands

export interface Command {
    command: 'connect' | 'apply' | 'quit' | 'quitNotConnectedPlayers' | 'start' | 'stop';
}
export interface ConnectCommand extends Command {
    command: 'connect';
    clientId: string;
}

export interface ApplyCommand extends Command {
    command: 'apply';
    name: string;
}

export interface QuitCommand extends Command {
    command: 'quit';
}
export interface QuitNotConnectedPlayersCommand extends Command {
    command: 'quitNotConnectedPlayers';
}

export interface StartCommand extends Command {
    command: 'start';
}

export interface StopCommand extends Command {
    command: 'stop';
}
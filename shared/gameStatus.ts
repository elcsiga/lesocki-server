
export interface GameClient {
    clientId: string;
    name: string;
};

export interface GameStatus {
    clients: GameClient[];
};
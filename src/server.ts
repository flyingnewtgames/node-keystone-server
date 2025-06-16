// Main WebSocket server implementation, handling connections, messages, and game state.
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // For generating unique player IDs
import { encodeServerMessage, decodeClientMessage, ClientMessage, ServerMessage, PlayerConnectedMessage, PlayerDisconnectedMessage, StateUpdateMessage } from './protocol';
import { Game } from './game';
import { PlayerState } from './player';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const GAME_TICK_RATE = 1000 / 2; // 2 updates per second

interface CustomWebSocket extends WebSocket {
    id: string; // Add a unique ID to each WebSocket connection
}

const wss = new WebSocketServer({ port: PORT });
const game = new Game();

console.log(`WebSocket server starting on port ${PORT}`);

// Map to store WebSocket connections by player ID
const clients = new Map<string, CustomWebSocket>();

/**
 * Broadcasts a server message to all connected clients.
 * @param {ServerMessage} message - The message object to send.
 */
function broadcast(message: ServerMessage): void {
    const encodedMessage = encodeServerMessage(message);
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(encodedMessage);
        }
    });
}

wss.on('connection', ws => {
    // Generate a unique ID for the new connection
    const playerId = uuidv4();
    (ws as CustomWebSocket).id = playerId;
    clients.set(playerId, ws as CustomWebSocket);

    console.log(`Client connected: ${playerId}`);

    // Add player to the game state
    const initialPlayerState = game.addPlayer(playerId, Math.random() * 100); // Random initial X

    // Notify the new client of their ID and the initial game state
    ws.send(encodeServerMessage({ type: 'connected', playerId } as PlayerConnectedMessage));
    ws.send(encodeServerMessage({ type: 'state', players: game.getAllPlayerStates() } as StateUpdateMessage));

    // Broadcast to all other clients that a new player has connected
    broadcast({ type: 'connected', playerId: playerId } as PlayerConnectedMessage);

    ws.on('message', message => {
        // Ensure message is a Buffer before decoding
        if (message instanceof Buffer) {
            const decodedMessage = decodeClientMessage(new Uint8Array(message));

            if (!decodedMessage) {
                console.warn(`Received malformed message from ${playerId}.`);
                return;
            }

            // Handle different client message types
            switch (decodedMessage.type) {
                case 'move':
                    const moveMsg = decodedMessage;
                    // Validate playerId (ensure client can only move their own player)
                    if (moveMsg.type === 'move' && moveMsg.x !== undefined && moveMsg.z !== undefined) {
                        game.updatePlayerPosition(playerId, moveMsg.x, moveMsg.z);
                        // The game loop will broadcast the state,
                        // so no need to broadcast immediately here for every move.
                    }
                    break;
                default:
                    console.warn(`Unknown message type received from ${playerId}:`, decodedMessage);
            }
        } else {
            console.warn(`Received non-binary message from ${playerId}. Ignoring.`);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${playerId}`);
        clients.delete(playerId);
        game.removePlayer(playerId);
        // Broadcast to all remaining clients that a player has disconnected
        broadcast({ type: 'disconnected', playerId } as PlayerDisconnectedMessage);
    });

    ws.on('error', error => {
        console.error(`WebSocket error for client ${playerId}:`, error);
        clients.delete(playerId);
        game.removePlayer(playerId);
        // Inform others of disconnection due to error
        broadcast({ type: 'disconnected', playerId } as PlayerDisconnectedMessage);
    });
});

/**
 * Game update loop. This periodically broadcasts the full game state
 * to all connected clients. This helps reduce bandwidth by not sending
 * updates on every single client move, but rather in fixed intervals.
 */
setInterval(() => {
    game.update(); // Placeholder for any complex game logic updates
    const allPlayerStates: PlayerState[] = game.getAllPlayerStates();
    if (allPlayerStates.length > 0) {
        broadcast({ type: 'state', players: allPlayerStates } as StateUpdateMessage);
    }
}, GAME_TICK_RATE);

console.log('WebSocket server is running.');
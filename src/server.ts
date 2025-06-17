// Main WebSocket server implementation, handling connections, messages, and game state.
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // For generating unique player IDs
import { encodeServerMessage, decodeClientMessage, ClientMessage, ServerMessage, PlayerConnectedMessage, PlayerDisconnectedMessage, StateUpdateMessage, NameAcceptedMessage, NameRejectedMessage } from './protocol';
import { Game } from './game';
import { PlayerState } from './player';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const GAME_TICK_RATE = 1000 / 60; // 4 updates per second

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

/**
 * Sends a server message to a specific player by their ID.
 * @param {string} playerId - The ID of the player to send the message to.
 * @param {ServerMessage} message - The message object to send.
 * @returns {boolean} - Returns true if message was sent successfully, false if player not found or connection closed.
 */
function sendToPlayer(playerId: string, message: ServerMessage): boolean {
    const client = clients.get(playerId);
    
    if (!client) {
        console.warn(`Attempted to send message to non-existent player: ${playerId}`);
        return false;
    }
    
    if (client.readyState !== WebSocket.OPEN) {
        console.warn(`Attempted to send message to player with closed connection: ${playerId}`);
        return false;
    }
    
    try {
        const encodedMessage = encodeServerMessage(message);
        client.send(encodedMessage);
        return true;
    } catch (error) {
        console.error(`Failed to send message to player ${playerId}:`, error);
        return false;
    }
}

wss.on('connection', ws => {
    // Generate a unique ID for the new connection
    const playerId = uuidv4();
    (ws as CustomWebSocket).id = playerId;
    clients.set(playerId, ws as CustomWebSocket);

    console.log(`Client connected: ${playerId}`);

    // Add player to the game state
    const initialPlayerState = game.addPlayer(playerId, Math.random() * 50, 1, 0); // Random initial X, default Z and rotation

    // Send the new client their assigned ID directly
    ws.send(encodeServerMessage({ type: 'id_assignment', playerId } as any)); // You'll need to add this type to your protocol
    
    // Send the new client the initial game state
    ws.send(encodeServerMessage({ type: 'state', players: game.getAllPlayerStates() } as StateUpdateMessage));

    // Broadcast to all OTHER clients that a new player has connected (excluding the new client)
    const connectMessage = { type: 'connected', playerId: playerId } as PlayerConnectedMessage;
    const encodedConnectMessage = encodeServerMessage(connectMessage);
    clients.forEach((client, clientId) => {
        if (clientId !== playerId && client.readyState === WebSocket.OPEN) {
            client.send(encodedConnectMessage);
        }
    });

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
                    if (moveMsg.type === 'move' && moveMsg.x !== undefined && moveMsg.z !== undefined && moveMsg.rot !== undefined) {
                        game.updatePlayerPosition(playerId, moveMsg.x, moveMsg.z, moveMsg.rot);
                        // The game loop will broadcast the state,
                        // so no need to broadcast immediately here for every move.
                    }
                    break;
                case 'set_name':
                    const setNameMsg = decodedMessage;
                    if (setNameMsg.name && typeof setNameMsg.name === 'string') {
                        const nameSet = game.setPlayerName(playerId, setNameMsg.name);
                        if (nameSet) {
                            sendToPlayer(playerId, { type: 'name_accepted' } as NameAcceptedMessage);
                            console.log(`Player ${playerId} successfully set name to "${setNameMsg.name}"`);
                        } else {
                            sendToPlayer(playerId, { 
                                type: 'name_rejected', 
                                reason: 'Name already taken' 
                            } as NameRejectedMessage);
                            console.log(`Player ${playerId} failed to set name "${setNameMsg.name}" - already taken`);
                        }
                    } else {
                        sendToPlayer(playerId, { 
                            type: 'name_rejected', 
                            reason: 'Invalid name format' 
                        } as NameRejectedMessage);
                        console.log(`Player ${playerId} sent invalid name format`);
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
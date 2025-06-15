// Defines the message structures for communication between client and server
// using MessagePack.
import { encode, decode } from '@msgpack/msgpack';
import { PlayerState } from './player';

// --- Client-to-Server Messages ---

/**
 * Message sent by a client to request movement for their player.
 * @property {string} type - Always 'move'.
 * @property {number} x - The new X coordinate for the player.
 */
export interface MoveMessage {
    type: 'move';
    x: number;
}

/**
 * Union type for all possible messages a client can send to the server.
 */
export type ClientMessage = MoveMessage;

// --- Server-to-Client Messages ---

/**
 * Message sent by the server to update all clients about the current game state.
 * @property {string} type - Always 'state'.
 * @property {PlayerState[]} players - An array of all player states in the game.
 */
export interface StateUpdateMessage {
    type: 'state';
    players: PlayerState[];
}

/**
 * Message sent by the server when a new player connects.
 * @property {string} type - Always 'connected'.
 * @property {string} playerId - The ID of the newly connected player.
 */
export interface PlayerConnectedMessage {
    type: 'connected';
    playerId: string;
}

/**
 * Message sent by the server when a player disconnects.
 * @property {string} type - Always 'disconnected'.
 * @property {string} playerId - The ID of the disconnected player.
 */
export interface PlayerDisconnectedMessage {
    type: 'disconnected';
    playerId: string;
}

/**
 * Union type for all possible messages the server can send to a client.
 */
export type ServerMessage = StateUpdateMessage | PlayerConnectedMessage | PlayerDisconnectedMessage;

/**
 * Encodes a server message into MessagePack binary format.
 * @param {ServerMessage} message - The message object to encode.
 * @returns {Uint8Array} The MessagePack encoded binary data.
 */
export function encodeServerMessage(message: ServerMessage): Uint8Array {
    return encode(message);
}

/**
 * Decodes MessagePack binary data into a client message object.
 * Catches decoding errors and returns null if the message is invalid.
 * @param {Uint8Array} data - The binary data to decode.
 * @returns {ClientMessage | null} The decoded message object, or null if decoding fails.
 */
export function decodeClientMessage(data: Uint8Array): ClientMessage | null {
    try {
        const decoded = decode(data);
        // Basic type guard to ensure the decoded object loosely matches ClientMessage structure
        if (typeof decoded === 'object' && decoded !== null && 'type' in decoded) {
            return decoded as ClientMessage;
        }
        return null;
    } catch (error) {
        console.error('Failed to decode client message:', error);
        return null;
    }
}
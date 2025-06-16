// Defines the message structures for communication between client and server
// with configurable serialization (JSON or MessagePack).
import { encode, decode } from '@msgpack/msgpack';
import { PlayerState } from './player';

// Configuration for protocol serialization
export const PROTOCOL_CONFIG = {
    USE_MSGPACK: false, // Set to true to use MessagePack, false for JSON
};

// Timecode utilities for space-efficient timestamps
const SERVER_START_TIME = Date.now();
const TIMECODE_WRAP = 2**24; // ~16.7M milliseconds (~4.6 hours), fits in 3 bytes

/**
 * Gets a space-efficient wraparound timecode.
 * Wraps every ~4.6 hours to keep numbers small and MessagePack-efficient.
 * @returns {number} Timecode as milliseconds since server start (mod 2^24).
 */
export function getTimecode(): number {
    return (Date.now() - SERVER_START_TIME) % TIMECODE_WRAP;
}

/**
 * Calculates the difference between two wraparound timecodes.
 * Handles wraparound correctly for time differences up to ~2.3 hours.
 * @param {number} newer - The newer timecode.
 * @param {number} older - The older timecode.
 * @returns {number} Time difference in milliseconds.
 */
export function timecodeDistance(newer: number, older: number): number {
    const diff = newer - older;
    const halfWrap = TIMECODE_WRAP / 2;
    
    if (diff > halfWrap) {
        // Older timecode wrapped around
        return diff - TIMECODE_WRAP;
    } else if (diff < -halfWrap) {
        // Newer timecode wrapped around
        return diff + TIMECODE_WRAP;
    }
    return diff;
}

/**
 * Calculates message age from wraparound timecode.
 * @param {number} timecode - The message timecode.
 * @returns {number} Age in milliseconds (positive value).
 */
export function getMessageAge(timecode: number): number {
    return Math.abs(timecodeDistance(getTimecode(), timecode));
}

// Rest of the interfaces remain the same...
export interface MoveMessage {
    type: 'move';
    x: number;
    z: number;
    rot: number;
    t: number; // wraparound timecode
}

export type ClientMessage = MoveMessage;

export interface StateUpdateMessage {
    type: 'state';
    players: PlayerState[];
    t: number; // wraparound timecode
}

export interface PlayerConnectedMessage {
    type: 'connected';
    playerId: string;
    t: number; // wraparound timecode
}

export interface PlayerDisconnectedMessage {
    type: 'disconnected';
    playerId: string;
    t: number; // wraparound timecode
}

export type ServerMessage = StateUpdateMessage | PlayerConnectedMessage | PlayerDisconnectedMessage;

export function encodeServerMessage(message: ServerMessage): Uint8Array | string {
    const messageWithTimecode = {
        ...message,
        t: message.t || getTimecode()
    };

    if (PROTOCOL_CONFIG.USE_MSGPACK) {
        return encode(messageWithTimecode);
    } else {
        return JSON.stringify(messageWithTimecode);
    }
}

export function decodeClientMessage(data: Uint8Array | string): ClientMessage | null {
    try {
        let decoded: any;
        
        if (PROTOCOL_CONFIG.USE_MSGPACK) {
            if (typeof data === 'string') {
                console.error('Expected Uint8Array for MessagePack decoding, got string');
                return null;
            }
            decoded = decode(data);
        } else {
            let jsonString: string;
            if (data instanceof Uint8Array) {
                // Convert Uint8Array to string for JSON parsing
                jsonString = new TextDecoder().decode(data);
            } else {
                jsonString = data;
            }
            decoded = JSON.parse(jsonString);
        }
        
        if (typeof decoded === 'object' && decoded !== null && 'type' in decoded) {
            if (!('t' in decoded)) {
                decoded.t = getTimecode();
            }
            return decoded as ClientMessage;
        }
        return null;
    } catch (error) {
        console.error('Failed to decode client message:', error);
        return null;
    }
}

export function setProtocolMode(useMsgpack: boolean): void {
    PROTOCOL_CONFIG.USE_MSGPACK = useMsgpack;
}
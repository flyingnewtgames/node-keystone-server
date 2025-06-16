// Defines the PlayerState interface and a simple Player class for managing player data.

/**
 * Represents the essential state of a player in the game.
 * @property {string} id - Unique identifier for the player (e.g., WebSocket ID).
 * @property {number} x - The player's current X coordinate.
 * @property {number} y - The player's current Y coordinate (fixed as vertical movement is disallowed).
 * @property {number} z - The player's current Z coordinate.
 * @property {number} rot - The player's rotation in degrees.
 */
export interface PlayerState {
    id: string;
    x: number;
    y: number; // Y is fixed as per requirement (no vertical movement)
    z: number;
    rot: number;
}

/**
 * Manages individual player data and provides methods for state updates.
 */
export class Player {
    private _id: string;
    private _x: number;
    private _y: number; // Fixed Y-coordinate
    private _z: number;
    private _rot: number;

    /**
     * Creates a new Player instance.
     * @param {string} id - The unique ID for the player.
     * @param {number} initialX - The player's starting X coordinate.
     * @param {number} initialY - The player's starting Y coordinate (defaulting to 1 if not provided).
     * @param {number} initialZ - The player's starting Z coordinate (defaulting to 1 if not provided).
     * @param {number} initialRot - The player's starting rotation in degrees (defaulting to 0 if not provided).
     */
    constructor(id: string, initialX: number = 1, initialY: number = 1, initialZ: number = 1, initialRot: number = 0) {
        this._id = id;
        this._x = initialX;
        this._y = initialY; // Y is fixed and won't change
        this._z = initialZ;
        this._rot = initialRot;
    }

    /**
     * Gets the player's ID.
     * @returns {string} The player's ID.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Gets the player's current X coordinate.
     * @returns {number} The player's X coordinate.
     */
    public get x(): number {
        return this._x;
    }

    /**
     * Sets the player's X coordinate.
     * @param {number} newX - The new X coordinate.
     */
    public set x(newX: number) {
        // Add any validation or boundary checks here if needed
        this._x = newX;
    }

    /**
     * Gets the player's current Y coordinate.
     * @returns {number} The player's Y coordinate.
     */
    public get y(): number {
        return this._y;
    }

    /**
     * Gets the player's current Z coordinate.
     * @returns {number} The player's Z coordinate.
     */
    public get z(): number {
        return this._z;
    }

    /**
     * Sets the player's Z coordinate.
     * @param {number} newZ - The new Z coordinate.
     */
    public set z(newZ: number) {
        this._z = newZ;
    }

    /**
     * Gets the player's current rotation.
     * @returns {number} The player's rotation in degrees.
     */
    public get rot(): number {
        return this._rot;
    }

    /**
     * Sets the player's rotation.
     * @param {number} newRot - The new rotation in degrees.
     */
    public set rot(newRot: number) {
        this._rot = newRot;
    }

    /**
     * Returns the player's current state as a PlayerState object.
     * @returns {PlayerState} The current state of the player.
     */
    public getState(): PlayerState {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            z: this.z,
            rot: this.rot
        };
    }
}
// Defines the PlayerState interface and a simple Player class for managing player data.

/**
 * Represents the essential state of a player in the game.
 * @property {string} id - Unique identifier for the player (e.g., WebSocket ID).
 * @property {number} x - The player's current X coordinate.
 * @property {number} y - The player's current Y coordinate (fixed as vertical movement is disallowed).
 */
export interface PlayerState {
    id: string;
    x: number;
    y: number; // Y is fixed as per requirement (no vertical movement)
}

/**
 * Manages individual player data and provides methods for state updates.
 */
export class Player {
    private _id: string;
    private _x: number;
    private _y: number; // Fixed Y-coordinate

    /**
     * Creates a new Player instance.
     * @param {string} id - The unique ID for the player.
     * @param {number} initialX - The player's starting X coordinate.
     * @param {number} initialY - The player's starting Y coordinate (defaulting to 0 if not provided).
     */
    constructor(id: string, initialX: number = 0, initialY: number = 0) {
        this._id = id;
        this._x = initialX;
        this._y = initialY; // Y is fixed and won't change
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
     * Returns the player's current state as a PlayerState object.
     * @returns {PlayerState} The current state of the player.
     */
    public getState(): PlayerState {
        return {
            id: this._id,
            x: this._x,
            y: this._y,
        };
    }
}
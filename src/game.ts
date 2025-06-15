// Manages the overall game state, including all connected players and their positions.
import { Player, PlayerState } from './player';

/**
 * Manages the core game logic, including player states and updates.
 * This class serves as the single source of truth for the game world.
 */
export class Game {
    private players: Map<string, Player>; // Maps player ID to Player instance
    private fixedY: number = 0; // All players will be on this fixed Y-coordinate

    constructor() {
        this.players = new Map<string, Player>();
        console.log('Game initialized.');
    }

    /**
     * Adds a new player to the game.
     * @param {string} playerId - The unique ID of the player to add.
     * @param {number} initialX - The starting X position for the new player.
     * @returns {PlayerState} The state of the newly added player.
     */
    public addPlayer(playerId: string, initialX: number = 0): PlayerState {
        if (this.players.has(playerId)) {
            console.warn(`Player with ID ${playerId} already exists.`);
            return this.players.get(playerId)!.getState();
        }
        const player = new Player(playerId, initialX, this.fixedY);
        this.players.set(playerId, player);
        console.log(`Player ${playerId} added at (${initialX}, ${this.fixedY}).`);
        return player.getState();
    }

    /**
     * Removes a player from the game.
     * @param {string} playerId - The ID of the player to remove.
     * @returns {boolean} True if the player was successfully removed, false otherwise.
     */
    public removePlayer(playerId: string): boolean {
        if (this.players.delete(playerId)) {
            console.log(`Player ${playerId} removed.`);
            return true;
        }
        console.warn(`Attempted to remove non-existent player ${playerId}.`);
        return false;
    }

    /**
     * Updates a player's X position. Y position remains fixed.
     * @param {string} playerId - The ID of the player to update.
     * @param {number} newX - The new X coordinate for the player.
     * @returns {PlayerState | null} The updated player state, or null if the player does not exist.
     */
    public updatePlayerPosition(playerId: string, newX: number): PlayerState | null {
        const player = this.players.get(playerId);
        if (player) {
            player.x = newX;
            // Y is fixed, so no need to update player.y
            // console.log(`Player ${playerId} moved to X: ${newX}.`);
            return player.getState();
        }
        console.warn(`Attempted to move non-existent player ${playerId}.`);
        return null;
    }

    /**
     * Gets the state of a specific player.
     * @param {string} playerId - The ID of the player to retrieve.
     * @returns {PlayerState | null} The player's state, or null if the player does not exist.
     */
    public getPlayerState(playerId: string): PlayerState | null {
        return this.players.get(playerId)?.getState() || null;
    }

    /**
     * Retrieves the states of all players currently in the game.
     * @returns {PlayerState[]} An array of all player states.
     */
    public getAllPlayerStates(): PlayerState[] {
        return Array.from(this.players.values()).map(player => player.getState());
    }

    /**
     * Placeholder for future game logic updates (e.g., physics, interactions).
     * This method would be called periodically by the game loop.
     */
    public update(): void {
        // Implement game logic here, e.g.,
        // - Collision detection
        // - Environmental interactions
        // - AI updates
        // For now, it just ensures player positions are consistent.
    }
}
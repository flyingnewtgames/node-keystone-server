// Manages the overall game state, including all connected players and their positions.
import { Player, PlayerState } from './player';

/**
 * Manages the core game logic, including player states and updates.
 * This class serves as the single source of truth for the game world.
 */
export class Game {
    private players: Map<string, Player>; // Maps player ID to Player instance
    private playerNames: Set<string>; // Track taken names for uniqueness
    private lastKnownPositions: Map<string, { x: number; z: number; rot: number }>; // Track last sent X, Z positions and rotation
    private updateInterval: NodeJS.Timeout | null = null;
    private readonly POLLING_RATE = 500; // 2 times per second (500ms)

    constructor() {
        this.players = new Map<string, Player>();
        this.playerNames = new Set<string>();
        this.lastKnownPositions = new Map<string, { x: number; z: number; rot: number }>();
        console.log('Game initialized.');
        this.startUpdateLoop();
    }

    /**
     * Generates a random coordinate value between -50 and 50
     */
    private generateRandomCoordinate(): number {
        return Math.floor(Math.random() * 101) - 50; // Range: -50 to 50
    }

    /**
     * Starts the game update loop at 2 times per second
     */
    private startUpdateLoop(): void {
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.POLLING_RATE);
    }

    /**
     * Stops the game update loop
     */
    public stopUpdateLoop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Checks if a name is available (not taken by another player).
     * @param {string} name - The name to check.
     * @returns {boolean} True if the name is available, false if taken.
     */
    public isNameAvailable(name: string): boolean {
        return !this.playerNames.has(name);
    }

    /**
     * Sets a player's name if it's available.
     * @param {string} playerId - The ID of the player.
     * @param {string} name - The desired name.
     * @returns {boolean} True if the name was set successfully, false if taken or player doesn't exist.
     */
    public setPlayerName(playerId: string, name: string): boolean {
        const player = this.players.get(playerId);
        if (!player) {
            console.warn(`Attempted to set name for non-existent player ${playerId}.`);
            return false;
        }

        // Check if name is already taken
        if (this.playerNames.has(name)) {
            return false;
        }

        // Remove old name if player had one
        if (player.name) {
            this.playerNames.delete(player.name);
        }

        // Set new name
        player.name = name;
        this.playerNames.add(name);
        console.log(`Player ${playerId} set name to "${name}".`);
        return true;
    }

    /**
     * Adds a new player to the game with random X and Z coordinates.
     * @param {string} playerId - The unique ID of the player to add.
     * @param {number} initialX - The starting X position for the new player (optional, will use random if not provided).
     * @param {number} initialZ - The starting Z position for the new player (optional, will use random if not provided).
     * @param {number} initialRot - The starting rotation for the new player (optional, will use 0 if not provided).
     * @returns {PlayerState} The state of the newly added player.
     */
    public addPlayer(playerId: string, initialX?: number, initialZ?: number, initialRot?: number): PlayerState {
        if (this.players.has(playerId)) {
            console.warn(`Player with ID ${playerId} already exists.`);
            return this.players.get(playerId)!.getState();
        }
        
        const x = initialX ?? this.generateRandomCoordinate();
        const z = initialZ ?? this.generateRandomCoordinate();
        const rot = initialRot ?? 0;
        
        const player = new Player(playerId, x, 1, z, rot); // Y remains 1 (ground level)
        this.players.set(playerId, player);
        this.lastKnownPositions.set(playerId, { x, z, rot });
        console.log(`Player ${playerId} added at (${x}, 1, ${z}) with rotation ${rot}.`);
        return player.getState();
    }

    /**
     * Removes a player from the game.
     * @param {string} playerId - The ID of the player to remove.
     * @returns {boolean} True if the player was successfully removed, false otherwise.
     */
    public removePlayer(playerId: string): boolean {
        const player = this.players.get(playerId);
        if (player) {
            // Remove player's name from the taken names set
            if (player.name) {
                this.playerNames.delete(player.name);
            }
            this.players.delete(playerId);
            this.lastKnownPositions.delete(playerId);
            console.log(`Player ${playerId} removed.`);
            return true;
        }
        console.warn(`Attempted to remove non-existent player ${playerId}.`);
        return false;
    }

    /**
     * Updates a player's X, Z position and rotation. Y position remains fixed at 1.
     * @param {string} playerId - The ID of the player to update.
     * @param {number} newX - The new X coordinate for the player.
     * @param {number} newZ - The new Z coordinate for the player.
     * @param {number} newRot - The new rotation for the player (optional).
     * @returns {PlayerState | null} The updated player state, or null if the player does not exist.
     */
    public updatePlayerPosition(playerId: string, newX: number, newZ: number, newRot?: number): PlayerState | null {
        const player = this.players.get(playerId);
        if (player) {
            player.x = newX;
            player.z = newZ;
            player.rot = newRot ?? player.rot;
            // Y remains fixed at 1
            // console.log(`Player ${playerId} moved to (${newX}, 1, ${newZ}) with rotation ${player.rot}.`);
            return player.getState();
        }
        console.warn(`Attempted to move non-existent player ${playerId}.`);
        return null;
    }

    /**
     * Updates a player's position and rotation.
     * @param {string} playerId - The ID of the player to update.
     * @param {number} newX - The new X coordinate for the player.
     * @param {number} newZ - The new Z coordinate for the player.
     * @param {number} newRot - The new rotation for the player.
     * @returns {PlayerState | null} The updated player state, or null if the player does not exist.
     */
    public updatePlayerPositionAndRotation(playerId: string, newX: number, newZ: number, newRot: number): PlayerState | null {
        const player = this.players.get(playerId);
        if (player) {
            player.x = newX;
            player.z = newZ;
            player.rot = newRot;
            // Y remains fixed at 1
            // console.log(`Player ${playerId} moved to (${newX}, 1, ${newZ}) with rotation ${newRot}.`);
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
     * Gets only the players whose positions or rotation have changed since last update.
     * @returns {PlayerState[]} An array of player states that have moved or rotated.
     */
    public getUpdatedPlayerStates(): PlayerState[] {
        const updatedPlayers: PlayerState[] = [];
        
        for (const [playerId, player] of this.players) {
            const currentX = player.x;
            const currentZ = player.z;
            const currentRot = player.rot;
            const lastKnownPosition = this.lastKnownPositions.get(playerId);
            
            if (!lastKnownPosition || 
                currentX !== lastKnownPosition.x || 
                currentZ !== lastKnownPosition.z ||
                currentRot !== lastKnownPosition.rot) {
                updatedPlayers.push(player.getState());
                this.lastKnownPositions.set(playerId, { x: currentX, z: currentZ, rot: currentRot });
            }
        }
        
        return updatedPlayers;
    }

    /**
     * Game logic updates called at 2 times per second.
     * This method would be called periodically by the game loop.
     */
    public update(): void {
        // Get players with position changes
        const updatedPlayers = this.getUpdatedPlayerStates();
        
        // Only broadcast/log if there are actually players who moved
        if (updatedPlayers.length > 1) {
            // Here you would typically broadcast the updates to connected clients
            // For now, we'll just log the updates
            /* console.log(`Broadcasting updates for ${updatedPlayers.length} players:`, 
                updatedPlayers.map(p => `${p.id}: (${p.x}, ${p.y}, ${p.z}) rot: ${p.rot}`)); */
        }
        // No output when no players have moved
        
        // Implement additional game logic here, e.g.,
        // - Collision detection
        // - Environmental interactions
        // - AI updates
    }
}
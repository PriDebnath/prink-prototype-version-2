import type { CanvasState } from "../types";

export interface SavedPrink {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvasState: Partial<CanvasState>;
}

const STORAGE_KEY = "prink-saved-drawings";

export const storage = {
  // Get all saved prinks
  getAllPrinks(): SavedPrink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading prinks:", error);
      return [];
    }
  },

  // Get a specific prink by ID
  getPrink(id: string): SavedPrink | null {
    const prinks = this.getAllPrinks();
    return prinks.find((p) => p.id === id) || null;
  },

  // Save a prink (create or update)
  savePrink(prink: Omit<SavedPrink, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }): SavedPrink {
    const prinks = this.getAllPrinks();
    const existingIndex = prinks.findIndex((p) => p.id === prink.id);

    const now = new Date().toISOString();
    const savedPrink: SavedPrink = {
      ...prink,
      createdAt: prink.createdAt || now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      // Update existing - preserve original createdAt
      savedPrink.createdAt = prinks[existingIndex].createdAt;
      prinks[existingIndex] = savedPrink;
    } else {
      // Create new
      prinks.push(savedPrink);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prinks));
      return savedPrink;
    } catch (error) {
      console.error("Error saving prink:", error);
      throw error;
    }
  },

  // Delete a prink
  deletePrink(id: string): boolean {
    const prinks = this.getAllPrinks();
    const filtered = prinks.filter((p) => p.id !== id);
    
    if (filtered.length === prinks.length) {
      return false; // Prink not found
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Error deleting prink:", error);
      throw error;
    }
  },

  // Generate a unique ID for a new prink
  generateId(): string {
    return `prink-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};


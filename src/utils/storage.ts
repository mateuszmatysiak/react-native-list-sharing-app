import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types';

// Generic storage interface
export interface StorageService {
	getItem: <T>(key: string) => Promise<T | null>;
	setItem: <T>(key: string, value: T) => Promise<boolean>;
	removeItem: (key: string) => Promise<boolean>;
	clear: () => Promise<boolean>;
	getAllKeys: () => Promise<string[]>;
	multiGet: <T>(keys: string[]) => Promise<Array<[string, T | null]>>;
	multiSet: <T>(keyValuePairs: Array<[string, T]>) => Promise<boolean>;
	multiRemove: (keys: string[]) => Promise<boolean>;
}

// Storage implementation with error handling
class AsyncStorageService implements StorageService {
	// Get single item with type safety
	async getItem<T>(key: string): Promise<T | null> {
		try {
			const value = await AsyncStorage.getItem(key);
			if (value === null) {
				return null;
			}
			return JSON.parse(value) as T;
		} catch (error) {
			console.error(`Error getting item "${key}" from storage:`, error);
			return null;
		}
	}

	// Set single item with type safety
	async setItem<T>(key: string, value: T): Promise<boolean> {
		try {
			await AsyncStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (error) {
			console.error(`Error setting item "${key}" in storage:`, error);
			return false;
		}
	}

	// Remove single item
	async removeItem(key: string): Promise<boolean> {
		try {
			await AsyncStorage.removeItem(key);
			return true;
		} catch (error) {
			console.error(`Error removing item "${key}" from storage:`, error);
			return false;
		}
	}

	// Clear all storage
	async clear(): Promise<boolean> {
		try {
			await AsyncStorage.clear();
			return true;
		} catch (error) {
			console.error('Error clearing storage:', error);
			return false;
		}
	}

	// Get all keys
	async getAllKeys(): Promise<string[]> {
		try {
			return Array.from(await AsyncStorage.getAllKeys());
		} catch (error) {
			console.error('Error getting all keys from storage:', error);
			return [];
		}
	}

	// Get multiple items
	async multiGet<T>(keys: string[]): Promise<Array<[string, T | null]>> {
		try {
			const results = await AsyncStorage.multiGet(keys);
			return results.map(([key, value]) => [key, value ? (JSON.parse(value) as T) : null]);
		} catch (error) {
			console.error('Error getting multiple items from storage:', error);
			return keys.map((key) => [key, null]);
		}
	}

	// Set multiple items
	async multiSet<T>(keyValuePairs: Array<[string, T]>): Promise<boolean> {
		try {
			const stringPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => [
				key,
				JSON.stringify(value),
			]);
			await AsyncStorage.multiSet(stringPairs);
			return true;
		} catch (error) {
			console.error('Error setting multiple items in storage:', error);
			return false;
		}
	}

	// Remove multiple items
	async multiRemove(keys: string[]): Promise<boolean> {
		try {
			await AsyncStorage.multiRemove(keys);
			return true;
		} catch (error) {
			console.error('Error removing multiple items from storage:', error);
			return false;
		}
	}
}

// Storage service instance
export const storage = new AsyncStorageService();

// Utility functions for common storage operations
export const storageUtils = {
	// Save user session data
	async saveUserSession(token: string, userData: unknown): Promise<ApiResponse> {
		const success = await Promise.all([
			storage.setItem('userToken', token),
			storage.setItem('userData', userData),
		]);

		if (success.every(Boolean)) {
			return { success: true, message: 'User session saved successfully' };
		}

		return { success: false, error: 'Failed to save user session' };
	},

	// Clear user session data
	async clearUserSession(): Promise<ApiResponse> {
		const success = await storage.multiRemove(['userToken', 'userData']);

		if (success) {
			return { success: true, message: 'User session cleared successfully' };
		}

		return { success: false, error: 'Failed to clear user session' };
	},

	// Get user session data
	async getUserSession(): Promise<ApiResponse<{ token: string; userData: unknown }>> {
		try {
			const results = await storage.multiGet<string | unknown>(['userToken', 'userData']);
			const token = results[0]?.[1] as string;
			const userData = results[1]?.[1];

			if (token && userData) {
				return {
					success: true,
					data: { token, userData },
					message: 'User session retrieved successfully',
				};
			}

			return { success: false, error: 'No user session found' };
		} catch (_error) {
			return { success: false, error: 'Failed to retrieve user session' };
		}
	},

	// Check if storage is available
	async isStorageAvailable(): Promise<boolean> {
		try {
			const testKey = '__storage_test__';
			const testValue = 'test';

			await storage.setItem(testKey, testValue);
			const retrieved = await storage.getItem<string>(testKey);
			await storage.removeItem(testKey);

			return retrieved === testValue;
		} catch {
			return false;
		}
	},

	// Get storage usage info
	async getStorageInfo(): Promise<{
		totalKeys: number;
		keys: string[];
		estimatedSize: number;
	}> {
		try {
			const keys = await storage.getAllKeys();
			const values = await storage.multiGet<unknown>(keys);

			const estimatedSize = values.reduce((size, [, value]) => {
				return size + (value ? JSON.stringify(value).length : 0);
			}, 0);

			return {
				totalKeys: keys.length,
				keys,
				estimatedSize,
			};
		} catch {
			return {
				totalKeys: 0,
				keys: [],
				estimatedSize: 0,
			};
		}
	},
};

// Storage event emitter for cross-component updates
export class StorageEventEmitter {
	private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

	// Subscribe to storage changes
	subscribe(key: string, callback: (data: unknown) => void): () => void {
		if (!this.listeners.has(key)) {
			this.listeners.set(key, []);
		}

		this.listeners.get(key)?.push(callback);

		// Return unsubscribe function
		return () => {
			const callbacks = this.listeners.get(key);
			if (callbacks) {
				const index = callbacks.indexOf(callback);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
			}
		};
	}

	// Emit storage change event
	emit(key: string, data: unknown): void {
		const callbacks = this.listeners.get(key);
		if (callbacks) {
			callbacks.forEach((callback) => callback(data));
		}
	}

	// Clear all listeners
	clear(): void {
		this.listeners.clear();
	}
}

// Global storage event emitter instance
export const storageEvents = new StorageEventEmitter();

// Enhanced storage with events
export const enhancedStorage = {
	...storage,

	async setItem<T>(key: string, value: T): Promise<boolean> {
		const success = await storage.setItem(key, value);
		if (success) {
			storageEvents.emit(key, value);
		}
		return success;
	},

	async removeItem(key: string): Promise<boolean> {
		const success = await storage.removeItem(key);
		if (success) {
			storageEvents.emit(key, null);
		}
		return success;
	},
};

import type { ApiResponse, List, Task } from '../types';
import type {
	CreateListPayload,
	CreateTaskPayload,
	ListExport,
	ListFilter,
	ListStatistics,
	ListWithStats,
	ShareListPayload,
	UpdateListPayload,
	UpdateTaskPayload,
} from '../types/lists';
import {
	ERROR_MESSAGES,
	generateId,
	getCurrentTimestamp,
	MOCK_USERS,
	STORAGE_KEYS,
	SUCCESS_MESSAGES,
	VALIDATION_RULES,
} from '../utils/constants';
import { storage } from '../utils/storage';
import { validationSchemas, validators } from '../utils/validation';

export class ListService {
	private static instance: ListService;
	private cache: Map<string, ListWithStats[]> = new Map();
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

	// Singleton pattern
	static getInstance(): ListService {
		if (!ListService.instance) {
			ListService.instance = new ListService();
		}
		return ListService.instance;
	}

	// Generate storage key for user lists
	private getUserListsKey(userId: string): string {
		return `${STORAGE_KEYS.LISTS_PREFIX}${userId}`;
	}

	// Calculate list statistics
	private calculateStatistics(list: List): ListStatistics {
		const totalTasks = list.tasks.length;
		const completedTasks = list.tasks.filter((task) => task.completed).length;
		const pendingTasks = totalTasks - completedTasks;
		const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

		return {
			totalTasks,
			completedTasks,
			pendingTasks,
			completionPercentage,
			lastActivity: list.updatedAt || list.createdAt,
		};
	}

	// Get current user's email for permission checks
	private getCurrentUserEmail(userId: string): string | null {
		return MOCK_USERS.find((u) => u.id === userId)?.email || null;
	}

	// Check if user has edit permissions for a list
	private canUserEditList(list: List, userId: string): boolean {
		if (list.ownerId === userId) return true;

		const userEmail = this.getCurrentUserEmail(userId);
		return userEmail ? list.sharedWith.includes(userEmail) : false;
	}

	// Find a list by ID, searching both owned and shared lists
	private async findListById(
		userId: string,
		listId: string,
	): Promise<{
		list: List;
		ownerId: string;
		listIndex: number;
		ownerLists: List[];
	} | null> {
		// First, try to find in current user's lists (owned lists)
		const currentUserLists = (await storage.getItem<List[]>(this.getUserListsKey(userId))) || [];
		const ownedListIndex = currentUserLists.findIndex((list) => list.id === listId);

		if (ownedListIndex !== -1) {
			const list = currentUserLists[ownedListIndex];
			if (list) {
				return {
					list,
					ownerId: userId,
					listIndex: ownedListIndex,
					ownerLists: currentUserLists,
				};
			}
		}

		// If not found in owned lists, search in shared lists
		const currentUserEmail = this.getCurrentUserEmail(userId);
		if (!currentUserEmail) return null;

		// Search through all other users' lists for shared lists
		for (const user of MOCK_USERS) {
			if (user.id !== userId) {
				const userLists = (await storage.getItem<List[]>(this.getUserListsKey(user.id))) || [];
				const sharedListIndex = userLists.findIndex(
					(list) => list.id === listId && list.sharedWith.includes(currentUserEmail),
				);

				if (sharedListIndex !== -1) {
					const list = userLists[sharedListIndex];
					if (list) {
						return {
							list,
							ownerId: user.id,
							listIndex: sharedListIndex,
							ownerLists: userLists,
						};
					}
				}
			}
		}

		return null;
	}

	// Convert List to ListWithStats
	private enrichList(list: List, currentUserId: string): ListWithStats {
		const statistics = this.calculateStatistics(list);
		const isOwner = list.ownerId === currentUserId;
		const isShared = list.sharedWith.length > 0;

		// Find current user's email for permission checks
		const currentUserEmail = this.getCurrentUserEmail(currentUserId);
		const isSharedWithCurrentUser = currentUserEmail
			? list.sharedWith.includes(currentUserEmail)
			: false;

		return {
			...list,
			statistics,
			isOwner,
			isShared,
			canEdit: isOwner || isSharedWithCurrentUser,
			canDelete: isOwner,
			canShare: isOwner,
		};
	}

	// Filter and sort lists
	private filterLists(lists: ListWithStats[], filter: ListFilter): ListWithStats[] {
		let filtered = [...lists];

		// Apply search filter
		if (filter.searchTerm?.trim()) {
			const searchTerm = filter.searchTerm.toLowerCase().trim();
			filtered = filtered.filter(
				(list) =>
					list.title.toLowerCase().includes(searchTerm) ||
					list.tasks.some((task) => task.text.toLowerCase().includes(searchTerm)),
			);
		}

		// Apply ownership filters
		if (filter.showOwned !== undefined || filter.showShared !== undefined) {
			filtered = filtered.filter((list) => {
				if (filter.showOwned && filter.showShared) return true;
				if (filter.showOwned && !filter.showShared) return list.isOwner;
				if (!filter.showOwned && filter.showShared) return list.isShared;
				return false;
			});
		}

		// Apply completion filter
		if (filter.showCompleted !== undefined) {
			if (!filter.showCompleted) {
				filtered = filtered.filter((list) => list.statistics.completionPercentage < 100);
			}
		}

		// Apply sorting
		if (filter.sortBy) {
			filtered.sort((a, b) => {
				let aValue: string | number;
				let bValue: string | number;

				switch (filter.sortBy) {
					case 'title':
						aValue = a.title.toLowerCase();
						bValue = b.title.toLowerCase();
						break;
					case 'createdAt':
						aValue = new Date(a.createdAt).getTime();
						bValue = new Date(b.createdAt).getTime();
						break;
					case 'updatedAt':
						aValue = new Date(a.updatedAt || a.createdAt).getTime();
						bValue = new Date(b.updatedAt || b.createdAt).getTime();
						break;
					case 'completionPercentage':
						aValue = a.statistics.completionPercentage;
						bValue = b.statistics.completionPercentage;
						break;
					default:
						return 0;
				}

				if (aValue < bValue) return filter.sortOrder === 'desc' ? 1 : -1;
				if (aValue > bValue) return filter.sortOrder === 'desc' ? -1 : 1;
				return 0;
			});
		}

		return filtered;
	}

	// Load lists for user
	async loadUserLists(
		userId: string,
		filter: ListFilter = {},
	): Promise<ApiResponse<ListWithStats[]>> {
		try {
			// Check cache first
			const cacheKey = `${userId}_${JSON.stringify(filter)}`;
			const cached = this.cache.get(cacheKey);
			if (cached) {
				return {
					success: true,
					data: cached,
					message: 'Lists loaded from cache',
				};
			}

			// Load own lists from storage
			const listsKey = this.getUserListsKey(userId);
			const storedLists = await storage.getItem<List[]>(listsKey);

			let allLists: List[] = [];

			if (!storedLists) {
				// Initialize with sample data for demo
				const sampleLists: List[] = [
					{
						id: generateId(),
						title: 'Zakupy spożywcze',
						ownerId: userId,
						sharedWith: [],
						tasks: [
							{ id: generateId(), text: 'Mleko', completed: false },
							{ id: generateId(), text: 'Chleb', completed: true },
							{ id: generateId(), text: 'Jajka', completed: false },
							{ id: generateId(), text: 'Masło', completed: false },
						],
						createdAt: getCurrentTimestamp(),
					},
					{
						id: generateId(),
						title: 'Zadania do wykonania',
						ownerId: userId,
						sharedWith: ['anna@example.com'], // Shared with second mock user
						tasks: [
							{ id: generateId(), text: 'Przygotować prezentację', completed: false },
							{ id: generateId(), text: 'Zadzwonić do klienta', completed: true },
							{ id: generateId(), text: 'Wysłać raport', completed: false },
						],
						createdAt: getCurrentTimestamp(),
					},
				];

				await storage.setItem(listsKey, sampleLists);
				allLists = sampleLists;
			} else {
				allLists = storedLists;
			}

			// Load shared lists from other users
			const sharedLists: List[] = [];
			const allUsers = MOCK_USERS;
			const currentUserEmail = allUsers.find((u) => u.id === userId)?.email;

			if (currentUserEmail) {
				for (const user of allUsers) {
					if (user.id !== userId) {
						const userListsKey = this.getUserListsKey(user.id);
						const userLists = await storage.getItem<List[]>(userListsKey);

						if (userLists) {
							// Find lists that are shared with current user by email
							const sharedWithMe = userLists.filter((list) =>
								list.sharedWith.includes(currentUserEmail),
							);
							sharedLists.push(...sharedWithMe);
						}
					}
				}
			}

			// Combine own lists and shared lists
			const combinedLists = [...allLists, ...sharedLists];

			// Enrich and filter lists
			const enrichedLists = combinedLists.map((list) => this.enrichList(list, userId));
			const filteredLists = this.filterLists(enrichedLists, filter);

			// Cache result
			this.cache.set(cacheKey, filteredLists);

			return {
				success: true,
				data: filteredLists,
				message: storedLists ? 'Lists loaded successfully' : 'Sample lists initialized',
			};
		} catch (error) {
			console.error('Load lists error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.STORAGE_ERROR,
			};
		}
	}

	// Save lists for user
	private async saveUserLists(userId: string, lists: List[]): Promise<boolean> {
		try {
			const listsKey = this.getUserListsKey(userId);
			await storage.setItem(listsKey, lists);

			// Clear cache to force refresh
			this.clearCache(userId);

			// Clear cache for all users who have shared lists from this user
			this.clearCacheForSharedListUsers(lists);

			return true;
		} catch (error) {
			console.error('Save lists error:', error);
			return false;
		}
	}

	// Clear cache for user
	private clearCache(userId?: string): void {
		if (userId) {
			const keysToDelete = Array.from(this.cache.keys()).filter((key) => key.startsWith(userId));
			keysToDelete.forEach((key) => this.cache.delete(key));
		} else {
			this.cache.clear();
		}
	}

	// Clear cache for all users who have shared lists from this user
	private clearCacheForSharedListUsers(lists: List[]): void {
		const sharedEmails = new Set<string>();

		// Collect all emails that have shared lists
		lists.forEach((list) => {
			list.sharedWith.forEach((email) => sharedEmails.add(email));
		});

		// Find user IDs from emails and clear their cache
		sharedEmails.forEach((email) => {
			const user = MOCK_USERS.find((u) => u.email === email);
			if (user) {
				this.clearCache(user.id);
			}
		});
	}

	// Create new list
	async createList(
		userId: string,
		payload: CreateListPayload,
	): Promise<ApiResponse<ListWithStats>> {
		// Validate input
		const validation = validationSchemas.createList({
			title: payload.title,
			tasks: payload.initialTasks || [],
		});

		if (!validation.isValid) {
			return {
				success: false,
				error: validation.errorList[0]?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}

		try {
			// Load existing lists
			const currentLists = (await storage.getItem<List[]>(this.getUserListsKey(userId))) || [];

			// Check limits
			if (currentLists.length >= 50) {
				// Arbitrary limit
				return {
					success: false,
					error: 'Osiągnięto maksymalną liczbę list (50)',
				};
			}

			// Create new list
			const newList: List = {
				id: generateId(),
				title: payload.title.trim(),
				ownerId: userId,
				sharedWith: [],
				tasks: (payload.initialTasks || []).map((text) => ({
					id: generateId(),
					text: text.trim(),
					completed: false,
					createdAt: getCurrentTimestamp(),
				})),
				createdAt: getCurrentTimestamp(),
			};

			// Save updated lists
			const updatedLists = [newList, ...currentLists];
			const saved = await this.saveUserLists(userId, updatedLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			const enrichedList = this.enrichList(newList, userId);

			return {
				success: true,
				data: enrichedList,
				message: SUCCESS_MESSAGES.LIST_CREATED,
			};
		} catch (error) {
			console.error('Create list error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Update list
	async updateList(
		userId: string,
		listId: string,
		updates: UpdateListPayload,
	): Promise<ApiResponse<ListWithStats>> {
		try {
			const listData = await this.findListById(userId, listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list, ownerId, listIndex, ownerLists } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do edycji tej listy',
				};
			}

			// Validate title if provided
			if (updates.title !== undefined) {
				const titleError = validators.listTitle(updates.title);
				if (titleError) {
					return {
						success: false,
						error: titleError,
					};
				}
			}

			// Apply updates
			const updatedList: List = {
				...list,
				title: updates.title?.trim() || list.title,
				sharedWith: updates.sharedWith !== undefined ? updates.sharedWith : list.sharedWith,
				updatedAt: getCurrentTimestamp(),
			};

			ownerLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(ownerId, ownerLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			const enrichedList = this.enrichList(updatedList, userId);

			return {
				success: true,
				data: enrichedList,
				message: SUCCESS_MESSAGES.LIST_UPDATED,
			};
		} catch (error) {
			console.error('Update list error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Delete list
	async deleteList(userId: string, listId: string): Promise<ApiResponse> {
		try {
			const currentLists = (await storage.getItem<List[]>(this.getUserListsKey(userId))) || [];
			const list = currentLists.find((l) => l.id === listId);

			if (!list) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			// Check permissions - only owner can delete
			if (list.ownerId !== userId) {
				return {
					success: false,
					error: 'Tylko właściciel może usunąć listę',
				};
			}

			const updatedLists = currentLists.filter((l) => l.id !== listId);
			const saved = await this.saveUserLists(userId, updatedLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				message: SUCCESS_MESSAGES.LIST_DELETED,
			};
		} catch (error) {
			console.error('Delete list error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Share list
	async shareList(userId: string, payload: ShareListPayload): Promise<ApiResponse> {
		// Validate email
		const emailValidation = validationSchemas.shareList(payload.userEmail);
		if (!emailValidation.isValid) {
			return {
				success: false,
				error: emailValidation.errorList[0]?.message || ERROR_MESSAGES.INVALID_EMAIL,
			};
		}

		try {
			// Find target user
			const targetUser = MOCK_USERS.find((u) => u.email === payload.userEmail);
			if (!targetUser) {
				return {
					success: false,
					error: ERROR_MESSAGES.USER_NOT_FOUND,
				};
			}

			// Can't share with yourself
			if (targetUser.id === userId) {
				return {
					success: false,
					error: 'Nie możesz udostępnić listy samemu sobie',
				};
			}

			const currentLists = (await storage.getItem<List[]>(this.getUserListsKey(userId))) || [];
			const listIndex = currentLists.findIndex((list) => list.id === payload.listId);

			if (listIndex === -1) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const list = currentLists[listIndex];

			// Check permissions - only owner can share
			if (list?.ownerId !== userId) {
				return {
					success: false,
					error: 'Tylko właściciel może udostępnić listę',
				};
			}

			// Check if already shared
			if (list.sharedWith.includes(payload.userEmail)) {
				return {
					success: false,
					error: 'Lista jest już udostępniona temu użytkownikowi',
				};
			}

			// Check sharing limits
			if (list.sharedWith.length >= VALIDATION_RULES.MAX_SHARED_USERS) {
				return {
					success: false,
					error: ERROR_MESSAGES.MAX_SHARED_USERS_EXCEEDED,
				};
			}

			// Update list - store email instead of user ID for consistent display
			const updatedList: List = {
				...list,
				sharedWith: [...list.sharedWith, payload.userEmail],
				updatedAt: getCurrentTimestamp(),
			};

			currentLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(userId, currentLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			// Clear cache for the target user as well so they can see the shared list
			this.clearCache(targetUser.id);

			return {
				success: true,
				message: SUCCESS_MESSAGES.LIST_SHARED,
			};
		} catch (error) {
			console.error('Share list error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Add task to list
	async addTask(userId: string, payload: CreateTaskPayload): Promise<ApiResponse<Task>> {
		const validation = validationSchemas.addTask(payload.text);
		if (!validation.isValid) {
			return {
				success: false,
				error: validation.errorList[0]?.message || ERROR_MESSAGES.TASK_TEXT_REQUIRED,
			};
		}

		try {
			const listData = await this.findListById(userId, payload.listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list, ownerId, listIndex, ownerLists } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do edycji tej listy',
				};
			}

			// Check task limit
			if (list.tasks.length >= VALIDATION_RULES.MAX_TASKS_PER_LIST) {
				return {
					success: false,
					error: ERROR_MESSAGES.MAX_TASKS_EXCEEDED,
				};
			}

			const newTask: Task = {
				id: generateId(),
				text: payload.text.trim(),
				completed: false,
				createdAt: getCurrentTimestamp(),
			};

			const updatedList: List = {
				...list,
				tasks: [...list.tasks, newTask],
				updatedAt: getCurrentTimestamp(),
			};

			ownerLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(ownerId, ownerLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				data: newTask,
				message: SUCCESS_MESSAGES.TASK_ADDED,
			};
		} catch (error) {
			console.error('Add task error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Update task
	async updateTask(
		userId: string,
		listId: string,
		taskId: string,
		updates: UpdateTaskPayload,
	): Promise<ApiResponse<Task>> {
		try {
			const listData = await this.findListById(userId, listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list, ownerId, listIndex, ownerLists } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do edycji tej listy',
				};
			}

			const taskIndex = list.tasks.findIndex((task) => task.id === taskId);
			if (taskIndex === -1) {
				return {
					success: false,
					error: 'Zadanie nie zostało znalezione',
				};
			}

			// Validate text if provided
			if (updates.text !== undefined) {
				const textError = validators.taskText(updates.text);
				if (textError) {
					return {
						success: false,
						error: textError,
					};
				}
			}

			const task = list.tasks[taskIndex];

			if (!task) {
				return {
					success: false,
					error: 'Zadanie nie zostało znalezione',
				};
			}

			const updatedTask: Task = {
				...task,
				text: updates.text?.trim() || task.text,
				completed: updates.completed !== undefined ? updates.completed : task.completed,
				completedAt:
					updates.completed && !task.completed ? getCurrentTimestamp() : task.completedAt,
			};

			const updatedList: List = {
				...list,
				tasks: list.tasks.map((t, index) => (index === taskIndex ? updatedTask : t)),
				updatedAt: getCurrentTimestamp(),
			};

			ownerLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(ownerId, ownerLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				data: updatedTask,
				message: SUCCESS_MESSAGES.TASK_UPDATED,
			};
		} catch (error) {
			console.error('Update task error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Delete task
	async deleteTask(userId: string, listId: string, taskId: string): Promise<ApiResponse> {
		try {
			const listData = await this.findListById(userId, listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list, ownerId, listIndex, ownerLists } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do edycji tej listy',
				};
			}

			const taskExists = list.tasks.some((task) => task.id === taskId);
			if (!taskExists) {
				return {
					success: false,
					error: 'Zadanie nie zostało znalezione',
				};
			}

			const updatedList: List = {
				...list,
				tasks: list.tasks.filter((task) => task.id !== taskId),
				updatedAt: getCurrentTimestamp(),
			};

			ownerLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(ownerId, ownerLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				message: SUCCESS_MESSAGES.TASK_DELETED,
			};
		} catch (error) {
			console.error('Delete task error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Toggle task completion
	async toggleTask(userId: string, listId: string, taskId: string): Promise<ApiResponse<Task>> {
		try {
			const listData = await this.findListById(userId, listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list, ownerId, listIndex, ownerLists } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do edycji tej listy',
				};
			}

			const taskIndex = list.tasks.findIndex((task) => task.id === taskId);
			if (taskIndex === -1) {
				return {
					success: false,
					error: 'Zadanie nie zostało znalezione',
				};
			}

			const task = list.tasks[taskIndex];

			if (!task) {
				return {
					success: false,
					error: 'Zadanie nie zostało znalezione',
				};
			}

			const updatedTask: Task = {
				...task,
				completed: !task.completed,
				completedAt: !task.completed ? getCurrentTimestamp() : undefined,
			};

			const updatedList: List = {
				...list,
				tasks: list.tasks.map((t, index) => (index === taskIndex ? updatedTask : t)),
				updatedAt: getCurrentTimestamp(),
			};

			ownerLists[listIndex] = updatedList;
			const saved = await this.saveUserLists(ownerId, ownerLists);

			if (!saved) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				data: updatedTask,
				message: updatedTask.completed
					? SUCCESS_MESSAGES.TASK_COMPLETED
					: SUCCESS_MESSAGES.TASK_UNCOMPLETED,
			};
		} catch (error) {
			console.error('Toggle task error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Export lists for backup
	async exportLists(userId: string): Promise<ApiResponse<ListExport>> {
		try {
			const currentLists = (await storage.getItem<List[]>(this.getUserListsKey(userId))) || [];
			const user = MOCK_USERS.find((u) => u.id === userId);

			if (!user) {
				return {
					success: false,
					error: ERROR_MESSAGES.USER_NOT_FOUND,
				};
			}

			const exportData: ListExport = {
				version: '1.0.0',
				exportedAt: getCurrentTimestamp(),
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
				lists: currentLists,
			};

			return {
				success: true,
				data: exportData,
				message: 'Lists exported successfully',
			};
		} catch (error) {
			console.error('Export lists error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Get list by ID
	async getListById(userId: string, listId: string): Promise<ApiResponse<ListWithStats>> {
		try {
			const listData = await this.findListById(userId, listId);

			if (!listData) {
				return {
					success: false,
					error: 'Lista nie została znaleziona',
				};
			}

			const { list } = listData;

			// Check permissions
			if (!this.canUserEditList(list, userId)) {
				return {
					success: false,
					error: 'Brak uprawnień do przeglądania tej listy',
				};
			}

			const enrichedList = this.enrichList(list, userId);

			return {
				success: true,
				data: enrichedList,
				message: 'List retrieved successfully',
			};
		} catch (error) {
			console.error('Get list by ID error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}
}

// Export singleton instance
export const listService = ListService.getInstance();

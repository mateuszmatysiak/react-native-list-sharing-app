import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from 'react';
import { listService } from '../services/listService';
import type { Task } from '../types';
import type {
	CreateListPayload,
	CreateTaskPayload,
	ListContextType,
	ListFilter,
	ListWithStats,
	ShareListPayload,
	UpdateListPayload,
	UpdateTaskPayload,
} from '../types/lists';
import { useAuth } from './AuthContext';
import { initialListState, listActions, listReducer } from './listReducer';

// Create context with undefined default
const ListContext = createContext<ListContextType | undefined>(undefined);

// List provider props
interface ListProviderProps {
	children: ReactNode;
}

// List provider component
export const ListProvider: React.FC<ListProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(listReducer, initialListState);
	const { user } = useAuth();

	// Refresh lists from storage
	const refreshLists = useCallback(async (): Promise<void> => {
		if (!user) return;

		dispatch(listActions.setLoading(true));
		dispatch(listActions.clearError());

		try {
			const result = await listService.loadUserLists(user.id, state.filter);

			if (result.success && result.data) {
				dispatch(listActions.setLists(result.data));
			} else {
				dispatch(listActions.setError(result.error || 'Błąd ładowania list'));
			}
		} catch (error) {
			console.error('Refresh lists error:', error);
			dispatch(listActions.setError('Nieoczekiwany błąd podczas ładowania list'));
		}
	}, [user, state.filter]);

	// Load lists when user changes
	useEffect(() => {
		if (user) {
			refreshLists();
		} else {
			// Clear lists when user logs out
			dispatch(listActions.setLists([]));
		}
	}, [user, refreshLists]);

	// Create list
	const createList = useCallback(
		async (payload: CreateListPayload) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.createList(user.id, payload);

				if (result.success && result.data) {
					dispatch(listActions.addList(result.data));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd tworzenia listy'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas tworzenia listy';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Update list
	const updateList = useCallback(
		async (listId: string, updates: UpdateListPayload) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.updateList(user.id, listId, updates);

				if (result.success && result.data) {
					dispatch(listActions.updateList(listId, result.data));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd aktualizacji listy'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas aktualizacji listy';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Delete list
	const deleteList = useCallback(
		async (listId: string) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.deleteList(user.id, listId);

				if (result.success) {
					dispatch(listActions.deleteList(listId));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd usuwania listy'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas usuwania listy';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Share list
	const shareList = useCallback(
		async (payload: ShareListPayload) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.shareList(user.id, payload);

				if (result.success) {
					// Update the list's sharedWith array in local state
					const list = state.lists.find((l) => l.id === payload.listId);
					if (list) {
						// Store the email instead of user ID for display purposes
						dispatch(
							listActions.updateList(payload.listId, {
								sharedWith: [...list.sharedWith, payload.userEmail],
							}),
						);
					}

					// Refresh to get updated data
					await refreshLists();
				} else {
					dispatch(listActions.setError(result.error || 'Błąd udostępniania listy'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas udostępniania listy';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user, state.lists, refreshLists],
	);

	// Add task
	const addTask = useCallback(
		async (payload: CreateTaskPayload) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.addTask(user.id, payload);

				if (result.success && result.data) {
					dispatch(listActions.addTask(payload.listId, result.data));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd dodawania zadania'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas dodawania zadania';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Update task
	const updateTask = useCallback(
		async (listId: string, taskId: string, updates: UpdateTaskPayload) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.updateTask(user.id, listId, taskId, updates);

				if (result.success && result.data) {
					dispatch(listActions.updateTask(listId, taskId, result.data));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd aktualizacji zadania'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas aktualizacji zadania';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Delete task
	const deleteTask = useCallback(
		async (listId: string, taskId: string) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.deleteTask(user.id, listId, taskId);

				if (result.success) {
					dispatch(listActions.deleteTask(listId, taskId));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd usuwania zadania'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas usuwania zadania';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Toggle task completion
	const toggleTask = useCallback(
		async (listId: string, taskId: string) => {
			if (!user) {
				return { success: false, error: 'Użytkownik nie jest zalogowany' };
			}

			dispatch(listActions.clearError());

			try {
				const result = await listService.toggleTask(user.id, listId, taskId);

				if (result.success && result.data) {
					dispatch(listActions.updateTask(listId, taskId, result.data));
				} else {
					dispatch(listActions.setError(result.error || 'Błąd zmiany statusu zadania'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas zmiany statusu zadania';
				dispatch(listActions.setError(errorMessage));
				return { success: false, error: errorMessage };
			}
		},
		[user],
	);

	// Clear error
	const clearError = useCallback((): void => {
		dispatch(listActions.clearError());
	}, []);

	// Set filter
	const setFilter = useCallback((filter: Partial<ListFilter>): void => {
		dispatch(listActions.setFilter(filter));
	}, []);

	// Set selected list
	const setSelectedList = useCallback((listId: string | null): void => {
		dispatch(listActions.setSelectedList(listId));
	}, []);

	// Get list by ID
	const getListById = useCallback(
		(listId: string): ListWithStats | undefined => {
			return state.lists.find((list) => list.id === listId);
		},
		[state.lists],
	);

	// Get task by ID
	const getTaskById = useCallback(
		(listId: string, taskId: string): Task | undefined => {
			const list = getListById(listId);
			return list?.tasks.find((task) => task.id === taskId);
		},
		[getListById],
	);

	// Context value with all state and methods
	const contextValue: ListContextType = {
		// State
		...state,
		// Methods
		createList,
		updateList,
		deleteList,
		shareList,
		addTask,
		updateTask,
		deleteTask,
		toggleTask,
		refreshLists,
		clearError,
		setFilter,
		setSelectedList,
		getListById,
		getTaskById,
	};

	return <ListContext.Provider value={contextValue}>{children}</ListContext.Provider>;
};

// Custom hook to use list context
export const useList = (): ListContextType => {
	const context = useContext(ListContext);

	if (context === undefined) {
		throw new Error('useList must be used within a ListProvider');
	}

	return context;
};

// Utility hooks
export const useListById = (listId: string | null): ListWithStats | undefined => {
	const { getListById } = useList();
	return listId ? getListById(listId) : undefined;
};

export const useTaskById = (listId: string | null, taskId: string | null): Task | undefined => {
	const { getTaskById } = useList();
	return listId && taskId ? getTaskById(listId, taskId) : undefined;
};

export const useListStats = (listId: string | null) => {
	const list = useListById(listId);
	return list ? list.statistics : null;
};

export const useFilteredLists = () => {
	const { lists } = useList();

	// Apply client-side filtering if needed
	// (The service already handles most filtering, but this can be used for additional filters)
	return lists;
};

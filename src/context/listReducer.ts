import type { Task } from '../types';
import type { ListAction, ListFilter, ListState, ListWithStats } from '../types/lists';
import { getCurrentTimestamp } from '../utils/constants';

// Initial list state
export const initialListState: ListState = {
	lists: [],
	loading: false,
	error: null,
	filter: {
		sortBy: 'createdAt',
		sortOrder: 'desc',
		showCompleted: true,
		showShared: true,
		showOwned: true,
	},
	selectedListId: null,
	lastSync: null,
};

// List reducer with full type safety
export const listReducer = (state: ListState, action: ListAction): ListState => {
	switch (action.type) {
		case 'SET_LOADING':
			return {
				...state,
				loading: action.payload,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.payload,
				loading: false,
			};

		case 'CLEAR_ERROR':
			return {
				...state,
				error: null,
			};

		case 'SET_LISTS':
			return {
				...state,
				lists: action.payload,
				loading: false,
				error: null,
				lastSync: getCurrentTimestamp(),
			};

		case 'ADD_LIST':
			return {
				...state,
				lists: [action.payload, ...state.lists],
				error: null,
			};

		case 'UPDATE_LIST':
			return {
				...state,
				lists: state.lists.map((list) =>
					list.id === action.payload.listId ? { ...list, ...action.payload.updates } : list,
				),
				error: null,
			};

		case 'DELETE_LIST':
			return {
				...state,
				lists: state.lists.filter((list) => list.id !== action.payload),
				selectedListId: state.selectedListId === action.payload ? null : state.selectedListId,
				error: null,
			};

		case 'ADD_TASK':
			return {
				...state,
				lists: state.lists.map((list) =>
					list.id === action.payload.listId
						? {
								...list,
								tasks: [...list.tasks, action.payload.task],
								statistics: {
									...list.statistics,
									totalTasks: list.statistics.totalTasks + 1,
									pendingTasks: list.statistics.pendingTasks + 1,
									completionPercentage:
										list.statistics.totalTasks > 0
											? (list.statistics.completedTasks / (list.statistics.totalTasks + 1)) * 100
											: 0,
								},
							}
						: list,
				),
				error: null,
			};

		case 'UPDATE_TASK':
			return {
				...state,
				lists: state.lists.map((list) =>
					list.id === action.payload.listId
						? {
								...list,
								tasks: list.tasks.map((task) =>
									task.id === action.payload.taskId ? { ...task, ...action.payload.updates } : task,
								),
								statistics: (() => {
									const updatedTasks = list.tasks.map((task) =>
										task.id === action.payload.taskId
											? { ...task, ...action.payload.updates }
											: task,
									);
									const totalTasks = updatedTasks.length;
									const completedTasks = updatedTasks.filter((task) => task.completed).length;
									const pendingTasks = totalTasks - completedTasks;
									const completionPercentage =
										totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

									return {
										...list.statistics,
										totalTasks,
										completedTasks,
										pendingTasks,
										completionPercentage,
										lastActivity: getCurrentTimestamp(),
									};
								})(),
							}
						: list,
				),
				error: null,
			};

		case 'DELETE_TASK':
			return {
				...state,
				lists: state.lists.map((list) =>
					list.id === action.payload.listId
						? {
								...list,
								tasks: list.tasks.filter((task) => task.id !== action.payload.taskId),
								statistics: {
									...list.statistics,
									totalTasks: list.statistics.totalTasks - 1,
									pendingTasks: list.statistics.pendingTasks - 1,
									completionPercentage:
										list.statistics.totalTasks > 1
											? (list.statistics.completedTasks / (list.statistics.totalTasks - 1)) * 100
											: 0,
								},
							}
						: list,
				),
				error: null,
			};

		case 'SET_FILTER':
			return {
				...state,
				filter: { ...state.filter, ...action.payload },
			};

		case 'SET_SELECTED_LIST':
			return {
				...state,
				selectedListId: action.payload,
			};

		case 'SET_LAST_SYNC':
			return {
				...state,
				lastSync: action.payload,
			};

		default:
			return state;
	}
};

// Action creators for better type safety
export const listActions = {
	setLoading: (loading: boolean): ListAction => ({
		type: 'SET_LOADING',
		payload: loading,
	}),

	setError: (error: string | null): ListAction => ({
		type: 'SET_ERROR',
		payload: error,
	}),

	clearError: (): ListAction => ({
		type: 'CLEAR_ERROR',
	}),

	setLists: (lists: ListWithStats[]): ListAction => ({
		type: 'SET_LISTS',
		payload: lists,
	}),

	addList: (list: ListWithStats): ListAction => ({
		type: 'ADD_LIST',
		payload: list,
	}),

	updateList: (listId: string, updates: Partial<ListWithStats>): ListAction => ({
		type: 'UPDATE_LIST',
		payload: { listId, updates },
	}),

	deleteList: (listId: string): ListAction => ({
		type: 'DELETE_LIST',
		payload: listId,
	}),

	addTask: (listId: string, task: Task): ListAction => ({
		type: 'ADD_TASK',
		payload: { listId, task },
	}),

	updateTask: (listId: string, taskId: string, updates: Partial<Task>): ListAction => ({
		type: 'UPDATE_TASK',
		payload: { listId, taskId, updates },
	}),

	deleteTask: (listId: string, taskId: string): ListAction => ({
		type: 'DELETE_TASK',
		payload: { listId, taskId },
	}),

	setFilter: (filter: Partial<ListFilter>): ListAction => ({
		type: 'SET_FILTER',
		payload: filter,
	}),

	setSelectedList: (listId: string | null): ListAction => ({
		type: 'SET_SELECTED_LIST',
		payload: listId,
	}),

	setLastSync: (timestamp: string): ListAction => ({
		type: 'SET_LAST_SYNC',
		payload: timestamp,
	}),
};

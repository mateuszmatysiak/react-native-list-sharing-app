import type { ApiResponse, List, Task, User } from './index';

// List creation payload
export interface CreateListPayload {
	title: string;
	initialTasks?: string[];
}

// List update payload
export interface UpdateListPayload {
	title?: string;
	sharedWith?: string[];
}

// Task creation payload
export interface CreateTaskPayload {
	text: string;
	listId: string;
}

// Task update payload
export interface UpdateTaskPayload {
	text?: string;
	completed?: boolean;
}

// List sharing payload
export interface ShareListPayload {
	listId: string;
	userEmail: string;
}

// List statistics
export interface ListStatistics {
	totalTasks: number;
	completedTasks: number;
	pendingTasks: number;
	completionPercentage: number;
	lastActivity: string;
}

// List with computed properties
export interface ListWithStats extends List {
	statistics: ListStatistics;
	isOwner: boolean;
	isShared: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canShare: boolean;
}

// List filter options
export interface ListFilter {
	searchTerm?: string;
	showCompleted?: boolean;
	showShared?: boolean;
	showOwned?: boolean;
	sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'completionPercentage';
	sortOrder?: 'asc' | 'desc';
}

// List state interface
export interface ListState {
	lists: ListWithStats[];
	loading: boolean;
	error: string | null;
	filter: ListFilter;
	selectedListId: string | null;
	lastSync: string | null;
}

// List action types
export type ListAction =
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'CLEAR_ERROR' }
	| { type: 'SET_LISTS'; payload: ListWithStats[] }
	| { type: 'ADD_LIST'; payload: ListWithStats }
	| { type: 'UPDATE_LIST'; payload: { listId: string; updates: Partial<ListWithStats> } }
	| { type: 'DELETE_LIST'; payload: string }
	| { type: 'ADD_TASK'; payload: { listId: string; task: Task } }
	| { type: 'UPDATE_TASK'; payload: { listId: string; taskId: string; updates: Partial<Task> } }
	| { type: 'DELETE_TASK'; payload: { listId: string; taskId: string } }
	| { type: 'SET_FILTER'; payload: Partial<ListFilter> }
	| { type: 'SET_SELECTED_LIST'; payload: string | null }
	| { type: 'SET_LAST_SYNC'; payload: string };

// List context methods interface
export interface ListContextMethods {
	// List operations
	createList: (payload: CreateListPayload) => Promise<ApiResponse<ListWithStats>>;
	updateList: (listId: string, updates: UpdateListPayload) => Promise<ApiResponse<ListWithStats>>;
	deleteList: (listId: string) => Promise<ApiResponse>;
	shareList: (payload: ShareListPayload) => Promise<ApiResponse>;

	// Task operations
	addTask: (payload: CreateTaskPayload) => Promise<ApiResponse<Task>>;
	updateTask: (
		listId: string,
		taskId: string,
		updates: UpdateTaskPayload,
	) => Promise<ApiResponse<Task>>;
	deleteTask: (listId: string, taskId: string) => Promise<ApiResponse>;
	toggleTask: (listId: string, taskId: string) => Promise<ApiResponse<Task>>;

	// Utility operations
	refreshLists: () => Promise<void>;
	clearError: () => void;
	setFilter: (filter: Partial<ListFilter>) => void;
	setSelectedList: (listId: string | null) => void;
	getListById: (listId: string) => ListWithStats | undefined;
	getTaskById: (listId: string, taskId: string) => Task | undefined;
}

// Complete list context interface
export interface ListContextType extends ListState, ListContextMethods {}

// List sync options
export interface ListSyncOptions {
	forceRefresh?: boolean;
	background?: boolean;
}

// Batch operations
export interface BatchOperation {
	type: 'create' | 'update' | 'delete';
	target: 'list' | 'task';
	payload: unknown;
	id?: string;
}

export interface BatchOperationResult {
	success: boolean;
	operations: Array<{
		operation: BatchOperation;
		result: ApiResponse;
	}>;
}

// List export/import types
export interface ListExport {
	version: string;
	exportedAt: string;
	user: Pick<User, 'id' | 'name' | 'email'>;
	lists: List[];
}

export interface ListImportResult {
	imported: number;
	skipped: number;
	errors: string[];
}

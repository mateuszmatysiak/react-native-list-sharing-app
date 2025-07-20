// Import list types
import type { ListWithStats } from './lists';

// User-related types
export interface User {
	id: string;
	email: string;
	password: string;
	name: string;
	createdAt?: string;
}

// Task-related types
export interface Task {
	id: string;
	text: string;
	completed: boolean;
	createdAt?: string;
	completedAt?: string;
}

// List-related types
export interface List {
	id: string;
	title: string;
	ownerId: string;
	sharedWith: string[];
	tasks: Task[];
	createdAt: string;
	updatedAt?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Auth-related types
export interface AuthResult {
	success: boolean;
	error?: string;
	user?: User;
	token?: string;
}

export interface AuthState {
	isLoading: boolean;
	isSignout: boolean;
	userToken: string | null;
	user: User | null;
}

// Form validation types
export interface ValidationError {
	field: string;
	message: string;
}

export interface FormErrors {
	[key: string]: string | undefined;
}

// Storage types
export interface StorageKeys {
	USER_TOKEN: 'userToken';
	USER_DATA: 'userData';
	LISTS_PREFIX: 'lists_';
	APP_SETTINGS: 'appSettings';
}

// Navigation parameter types
export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
};

export type AppStackParamList = {
	Home: undefined;
	ListDetail: { list: List };
	CreateListModal: undefined;
	ShareModal: { list: List };
	EditListModal: { list: ListWithStats };
};

// Component prop types
export interface BaseComponentProps {
	testID?: string;
	accessibilityLabel?: string;
}

// Hook return types
export interface UseListManagerReturn {
	lists: List[];
	loading: boolean;
	error: string | null;
	createList: (title: string, initialTasks?: string[]) => Promise<List>;
	deleteList: (listId: string) => Promise<void>;
	updateList: (listId: string, updates: Partial<List>) => Promise<void>;
	addTask: (listId: string, taskText: string) => Promise<void>;
	toggleTask: (listId: string, taskId: string) => Promise<void>;
	deleteTask: (listId: string, taskId: string) => Promise<void>;
	shareList: (listId: string, userEmail: string) => Promise<ApiResponse>;
	refreshLists: () => Promise<void>;
}

// Utility types
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

import type { StorageKeys, User } from '../types';

// App metadata
export const APP_CONFIG = {
	NAME: 'Lista App',
	VERSION: '1.0.0',
	BUILD: '1',
	AUTHOR: 'Your Name',
} as const;

// Validation constants
export const VALIDATION_RULES = {
	MIN_PASSWORD_LENGTH: 6,
	MAX_PASSWORD_LENGTH: 50,
	MIN_NAME_LENGTH: 2,
	MAX_NAME_LENGTH: 50,
	MAX_EMAIL_LENGTH: 100,
	MIN_LIST_TITLE_LENGTH: 1,
	MAX_LIST_TITLE_LENGTH: 100,
	MIN_TASK_TEXT_LENGTH: 1,
	MAX_TASK_TEXT_LENGTH: 200,
	MAX_TASKS_PER_LIST: 100,
	MAX_SHARED_USERS: 10,
} as const;

// Storage keys
export const STORAGE_KEYS: StorageKeys = {
	USER_TOKEN: 'userToken',
	USER_DATA: 'userData',
	LISTS_PREFIX: 'lists_',
	APP_SETTINGS: 'appSettings',
} as const;

// Mock users for development and demo
export const MOCK_USERS: User[] = [
	{
		id: '1',
		email: 'user@example.com',
		password: 'password123',
		name: 'Jan Kowalski',
		createdAt: '2024-01-01T00:00:00.000Z',
	},
	{
		id: '2',
		email: 'anna@example.com',
		password: 'password123',
		name: 'Anna Nowak',
		createdAt: '2024-01-01T00:00:00.000Z',
	},
	{
		id: '3',
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		createdAt: '2024-01-01T00:00:00.000Z',
	},
] as const;

// Error messages
export const ERROR_MESSAGES = {
	REQUIRED_FIELD: 'To pole jest wymagane',
	INVALID_EMAIL: 'Wprowadź prawidłowy adres email',
	PASSWORD_TOO_SHORT: `Hasło musi mieć co najmniej ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} znaków`,
	PASSWORD_TOO_LONG: `Hasło może mieć maksymalnie ${VALIDATION_RULES.MAX_PASSWORD_LENGTH} znaków`,
	PASSWORDS_NOT_MATCH: 'Hasła nie są identyczne',
	NAME_TOO_SHORT: `Imię musi mieć co najmniej ${VALIDATION_RULES.MIN_NAME_LENGTH} znaki`,
	NAME_TOO_LONG: `Imię może mieć maksymalnie ${VALIDATION_RULES.MAX_NAME_LENGTH} znaków`,
	EMAIL_TOO_LONG: `Email może mieć maksymalnie ${VALIDATION_RULES.MAX_EMAIL_LENGTH} znaków`,
	USER_EXISTS: 'Użytkownik z tym emailem już istnieje',
	USER_NOT_FOUND: 'Użytkownik nie został znaleziony',
	INVALID_CREDENTIALS: 'Nieprawidłowy email lub hasło',
	LIST_TITLE_REQUIRED: 'Tytuł listy jest wymagany',
	LIST_TITLE_TOO_LONG: `Tytuł listy może mieć maksymalnie ${VALIDATION_RULES.MAX_LIST_TITLE_LENGTH} znaków`,
	TASK_TEXT_REQUIRED: 'Tekst zadania jest wymagany',
	TASK_TEXT_TOO_LONG: `Tekst zadania może mieć maksymalnie ${VALIDATION_RULES.MAX_TASK_TEXT_LENGTH} znaków`,
	MAX_TASKS_EXCEEDED: `Lista może zawierać maksymalnie ${VALIDATION_RULES.MAX_TASKS_PER_LIST} zadań`,
	MAX_SHARED_USERS_EXCEEDED: `Lista może być udostępniona maksymalnie ${VALIDATION_RULES.MAX_SHARED_USERS} użytkownikom`,
	NETWORK_ERROR: 'Sprawdź połączenie internetowe',
	UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd',
	STORAGE_ERROR: 'Błąd zapisu danych',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
	LOGIN_SUCCESS: 'Zalogowano pomyślnie',
	REGISTER_SUCCESS: 'Konto zostało utworzone',
	LIST_CREATED: 'Lista została utworzona',
	LIST_UPDATED: 'Lista została zaktualizowana',
	LIST_DELETED: 'Lista została usunięta',
	LIST_SHARED: 'Lista została udostępniona',
	TASK_ADDED: 'Zadanie zostało dodane',
	TASK_UPDATED: 'Zadanie zostało zaktualizowane',
	TASK_DELETED: 'Zadanie zostało usunięte',
	TASK_COMPLETED: 'Zadanie zostało ukończone',
	TASK_UNCOMPLETED: 'Zadanie zostało oznaczone jako nieukończone',
} as const;

// UI constants
export const UI_CONSTANTS = {
	ANIMATION_DURATION: 300,
	DEBOUNCE_DELAY: 500,
	REFRESH_TIMEOUT: 2000,
	LOADING_MIN_DURATION: 1000,
	TOAST_DURATION: 3000,
} as const;

// Color palette
export const COLORS = {
	PRIMARY: '#2563eb',
	PRIMARY_DARK: '#1d4ed8',
	PRIMARY_LIGHT: '#60a5fa',
	SECONDARY: '#64748b',
	SUCCESS: '#22c55e',
	ERROR: '#ef4444',
	WARNING: '#f59e0b',
	INFO: '#3b82f6',
	BACKGROUND: '#f9fafb',
	SURFACE: '#ffffff',
	TEXT_PRIMARY: '#111827',
	TEXT_SECONDARY: '#6b7280',
	TEXT_DISABLED: '#9ca3af',
	BORDER: '#e5e7eb',
	BORDER_FOCUS: '#3b82f6',
} as const;

// Helper functions for constants
export const generateId = (): string => {
	const timestamp = Date.now().toString();
	const random = Math.random().toString(36).substring(2, 15);
	return `${timestamp}_${random}`;
};

export const getCurrentTimestamp = (): string => {
	return new Date().toISOString();
};

export const getStorageKey = (userId: string, suffix: string): string => {
	return `${STORAGE_KEYS.LISTS_PREFIX}${userId}_${suffix}`;
};

// Type guards
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= VALIDATION_RULES.MAX_EMAIL_LENGTH;
};

export const isValidPassword = (password: string): boolean => {
	return (
		password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH &&
		password.length <= VALIDATION_RULES.MAX_PASSWORD_LENGTH
	);
};

export const isValidName = (name: string): boolean => {
	return (
		name.trim().length >= VALIDATION_RULES.MIN_NAME_LENGTH &&
		name.trim().length <= VALIDATION_RULES.MAX_NAME_LENGTH
	);
};

export const isValidListTitle = (title: string): boolean => {
	return (
		title.trim().length >= VALIDATION_RULES.MIN_LIST_TITLE_LENGTH &&
		title.trim().length <= VALIDATION_RULES.MAX_LIST_TITLE_LENGTH
	);
};

export const isValidTaskText = (text: string): boolean => {
	return (
		text.trim().length >= VALIDATION_RULES.MIN_TASK_TEXT_LENGTH &&
		text.trim().length <= VALIDATION_RULES.MAX_TASK_TEXT_LENGTH
	);
};

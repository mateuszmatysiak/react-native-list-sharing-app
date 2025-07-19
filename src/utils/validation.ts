import type { FormErrors, ValidationError } from '../types';
import {
	ERROR_MESSAGES,
	isValidEmail,
	isValidListTitle,
	isValidName,
	isValidPassword,
	isValidTaskText,
	VALIDATION_RULES,
} from './constants';

// Validation result type
export interface ValidationResult {
	isValid: boolean;
	errors: FormErrors;
	errorList: ValidationError[];
}

// Individual field validators
export const validators = {
	// Email validation
	email: (email: string): string | undefined => {
		if (!email.trim()) {
			return ERROR_MESSAGES.REQUIRED_FIELD;
		}
		if (!isValidEmail(email)) {
			return ERROR_MESSAGES.INVALID_EMAIL;
		}
		return undefined;
	},

	// Password validation
	password: (password: string): string | undefined => {
		if (!password) {
			return ERROR_MESSAGES.REQUIRED_FIELD;
		}
		if (!isValidPassword(password)) {
			if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
				return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
			}
			if (password.length > VALIDATION_RULES.MAX_PASSWORD_LENGTH) {
				return ERROR_MESSAGES.PASSWORD_TOO_LONG;
			}
		}
		return undefined;
	},

	// Confirm password validation
	confirmPassword: (password: string, confirmPassword: string): string | undefined => {
		if (!confirmPassword) {
			return ERROR_MESSAGES.REQUIRED_FIELD;
		}
		if (password !== confirmPassword) {
			return ERROR_MESSAGES.PASSWORDS_NOT_MATCH;
		}
		return undefined;
	},

	// Name validation
	name: (name: string): string | undefined => {
		if (!name.trim()) {
			return ERROR_MESSAGES.REQUIRED_FIELD;
		}
		if (!isValidName(name)) {
			if (name.trim().length < VALIDATION_RULES.MIN_NAME_LENGTH) {
				return ERROR_MESSAGES.NAME_TOO_SHORT;
			}
			if (name.trim().length > VALIDATION_RULES.MAX_NAME_LENGTH) {
				return ERROR_MESSAGES.NAME_TOO_LONG;
			}
		}
		return undefined;
	},

	// List title validation
	listTitle: (title: string): string | undefined => {
		if (!title.trim()) {
			return ERROR_MESSAGES.LIST_TITLE_REQUIRED;
		}
		if (!isValidListTitle(title)) {
			return ERROR_MESSAGES.LIST_TITLE_TOO_LONG;
		}
		return undefined;
	},

	// Task text validation
	taskText: (text: string): string | undefined => {
		if (!text.trim()) {
			return ERROR_MESSAGES.TASK_TEXT_REQUIRED;
		}
		if (!isValidTaskText(text)) {
			return ERROR_MESSAGES.TASK_TEXT_TOO_LONG;
		}
		return undefined;
	},
};

// Form validation schemas
export const validationSchemas = {
	// Login form validation
	login: (data: { email: string; password: string }): ValidationResult => {
		const errors: FormErrors = {};
		const errorList: ValidationError[] = [];

		// Validate email
		const emailError = validators.email(data.email);
		if (emailError) {
			errors.email = emailError;
			errorList.push({ field: 'email', message: emailError });
		}

		// Validate password
		const passwordError = validators.password(data.password);
		if (passwordError) {
			errors.password = passwordError;
			errorList.push({ field: 'password', message: passwordError });
		}

		return {
			isValid: errorList.length === 0,
			errors,
			errorList,
		};
	},

	// Registration form validation
	register: (data: {
		name: string;
		email: string;
		password: string;
		confirmPassword: string;
	}): ValidationResult => {
		const errors: FormErrors = {};
		const errorList: ValidationError[] = [];

		// Validate name
		const nameError = validators.name(data.name);
		if (nameError) {
			errors.name = nameError;
			errorList.push({ field: 'name', message: nameError });
		}

		// Validate email
		const emailError = validators.email(data.email);
		if (emailError) {
			errors.email = emailError;
			errorList.push({ field: 'email', message: emailError });
		}

		// Validate password
		const passwordError = validators.password(data.password);
		if (passwordError) {
			errors.password = passwordError;
			errorList.push({ field: 'password', message: passwordError });
		}

		// Validate confirm password
		const confirmPasswordError = validators.confirmPassword(data.password, data.confirmPassword);
		if (confirmPasswordError) {
			errors.confirmPassword = confirmPasswordError;
			errorList.push({ field: 'confirmPassword', message: confirmPasswordError });
		}

		return {
			isValid: errorList.length === 0,
			errors,
			errorList,
		};
	},

	// Create list form validation
	createList: (data: { title: string; tasks: string[] }): ValidationResult => {
		const errors: FormErrors = {};
		const errorList: ValidationError[] = [];

		// Validate title
		const titleError = validators.listTitle(data.title);
		if (titleError) {
			errors.title = titleError;
			errorList.push({ field: 'title', message: titleError });
		}

		// Validate tasks
		if (data.tasks.length > VALIDATION_RULES.MAX_TASKS_PER_LIST) {
			errors.tasks = ERROR_MESSAGES.MAX_TASKS_EXCEEDED;
			errorList.push({ field: 'tasks', message: ERROR_MESSAGES.MAX_TASKS_EXCEEDED });
		}

		data.tasks.forEach((task, index) => {
			if (task.trim()) {
				const taskError = validators.taskText(task);
				if (taskError) {
					errors[`task_${index}`] = taskError;
					errorList.push({ field: `task_${index}`, message: taskError });
				}
			}
		});

		return {
			isValid: errorList.length === 0,
			errors,
			errorList,
		};
	},

	// Add task validation
	addTask: (taskText: string): ValidationResult => {
		const errors: FormErrors = {};
		const errorList: ValidationError[] = [];

		const taskError = validators.taskText(taskText);
		if (taskError) {
			errors.taskText = taskError;
			errorList.push({ field: 'taskText', message: taskError });
		}

		return {
			isValid: errorList.length === 0,
			errors,
			errorList,
		};
	},

	// Share list validation
	shareList: (email: string): ValidationResult => {
		const errors: FormErrors = {};
		const errorList: ValidationError[] = [];

		const emailError = validators.email(email);
		if (emailError) {
			errors.email = emailError;
			errorList.push({ field: 'email', message: emailError });
		}

		return {
			isValid: errorList.length === 0,
			errors,
			errorList,
		};
	},
};

// Utility function to format validation errors for display
export const formatValidationErrors = (errors: ValidationError[]): string => {
	return errors.map((error) => error.message).join('\n');
};

// Debounced validation for real-time feedback
export const createDebouncedValidator = <T>(
	validator: (data: T) => ValidationResult,
	delay: number = 300,
) => {
	let timeoutId: NodeJS.Timeout;

	return (data: T, callback: (result: ValidationResult) => void): void => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			const result = validator(data);
			callback(result);
		}, delay);
	};
};

import { useCallback, useState } from 'react';
import { useList } from '../context/ListContext';
import type { FormErrors } from '../types';
import type { CreateListPayload } from '../types/lists';
import { validationSchemas } from '../utils/validation';

// Create list form hook
export const useCreateListForm = () => {
	const [title, setTitle] = useState<string>('');
	const [tasks, setTasks] = useState<string[]>(['']);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { createList } = useList();

	const addTaskField = useCallback((): void => {
		setTasks((prev) => [...prev, '']);
	}, []);

	const updateTask = useCallback((index: number, value: string): void => {
		setTasks((prev) => prev.map((task, i) => (i === index ? value : task)));
	}, []);

	const removeTask = useCallback(
		(index: number): void => {
			if (tasks.length > 1) {
				setTasks((prev) => prev.filter((_, i) => i !== index));
			}
		},
		[tasks.length],
	);

	const validateForm = useCallback((): boolean => {
		const validation = validationSchemas.createList({ title, tasks });
		setErrors(validation.errors);
		return validation.isValid;
	}, [title, tasks]);

	const resetForm = useCallback((): void => {
		setTitle('');
		setTasks(['']);
		setErrors({});
		setIsSubmitting(false);
	}, []);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (!validateForm()) {
			return false;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const payload: CreateListPayload = {
				title: title.trim(),
				initialTasks: tasks.filter((task) => task.trim()).map((task) => task.trim()),
			};

			const result = await createList(payload);
			setIsSubmitting(false);

			if (result.success) {
				resetForm();
			}

			return result.success;
		} catch {
			setIsSubmitting(false);
			return false;
		}
	}, [title, tasks, createList, validateForm, resetForm]);

	return {
		// Form state
		title,
		tasks,
		errors,
		isSubmitting,
		// Form actions
		setTitle,
		setTasks,
		addTaskField,
		updateTask,
		removeTask,
		handleSubmit,
		resetForm,
		validateForm,
	};
};

// Share list form hook
export const useShareListForm = (listId: string) => {
	const [email, setEmail] = useState<string>('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { shareList } = useList();

	const validateForm = useCallback((): boolean => {
		const validation = validationSchemas.shareList(email);
		setErrors(validation.errors);
		return validation.isValid;
	}, [email]);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (!validateForm()) {
			return false;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const result = await shareList({ listId, userEmail: email.trim() });
			setIsSubmitting(false);

			if (result.success) {
				setEmail('');
			}

			return result.success;
		} catch {
			setIsSubmitting(false);
			return false;
		}
	}, [email, listId, shareList, validateForm]);

	const resetForm = useCallback((): void => {
		setEmail('');
		setErrors({});
		setIsSubmitting(false);
	}, []);

	return {
		// Form state
		email,
		errors,
		isSubmitting,
		// Form actions
		setEmail,
		handleSubmit,
		resetForm,
		validateForm,
	};
};

// Add task form hook
export const useAddTaskForm = (listId: string) => {
	const [text, setText] = useState<string>('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { addTask } = useList();

	const validateForm = useCallback((): boolean => {
		const validation = validationSchemas.addTask(text);
		setErrors(validation.errors);
		return validation.isValid;
	}, [text]);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (!validateForm()) {
			return false;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const result = await addTask({ listId, text: text.trim() });
			setIsSubmitting(false);

			if (result.success) {
				setText('');
			}

			return result.success;
		} catch {
			setIsSubmitting(false);
			return false;
		}
	}, [text, listId, addTask, validateForm]);

	const resetForm = useCallback((): void => {
		setText('');
		setErrors({});
		setIsSubmitting(false);
	}, []);

	return {
		// Form state
		text,
		errors,
		isSubmitting,
		// Form actions
		setText,
		handleSubmit,
		resetForm,
		validateForm,
	};
};

// List operations hook
export const useListOperations = () => {
	const { updateList, deleteList, toggleTask, deleteTask } = useList();

	const handleDeleteList = useCallback(
		async (listId: string): Promise<boolean> => {
			const result = await deleteList(listId);
			return result.success;
		},
		[deleteList],
	);

	const handleToggleTask = useCallback(
		async (listId: string, taskId: string): Promise<boolean> => {
			const result = await toggleTask(listId, taskId);
			return result.success;
		},
		[toggleTask],
	);

	const handleDeleteTask = useCallback(
		async (listId: string, taskId: string): Promise<boolean> => {
			const result = await deleteTask(listId, taskId);
			return result.success;
		},
		[deleteTask],
	);

	const handleUpdateListTitle = useCallback(
		async (listId: string, title: string): Promise<boolean> => {
			const result = await updateList(listId, { title });
			return result.success;
		},
		[updateList],
	);

	return {
		handleDeleteList,
		handleToggleTask,
		handleDeleteTask,
		handleUpdateListTitle,
	};
};

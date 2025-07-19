import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { FormErrors } from '../types';
import { validationSchemas } from '../utils/validation';

// Login form hook
export const useLoginForm = () => {
	const [email, setEmail] = useState<string>('user@example.com'); // Pre-filled for demo
	const [password, setPassword] = useState<string>('password123'); // Pre-filled for demo
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { signIn } = useAuth();

	const validateForm = useCallback((): boolean => {
		const validation = validationSchemas.login({ email, password });
		setErrors(validation.errors);
		return validation.isValid;
	}, [email, password]);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (!validateForm()) {
			return false;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const result = await signIn(email, password);
			setIsSubmitting(false);
			return result.success;
		} catch {
			setIsSubmitting(false);
			return false;
		}
	}, [email, password, signIn, validateForm]);

	const resetForm = useCallback((): void => {
		setEmail('');
		setPassword('');
		setErrors({});
		setIsSubmitting(false);
	}, []);

	return {
		// Form state
		email,
		password,
		errors,
		isSubmitting,
		// Form actions
		setEmail,
		setPassword,
		handleSubmit,
		resetForm,
		validateForm,
	};
};

// Registration form hook
export const useRegisterForm = () => {
	const [name, setName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { signUp } = useAuth();

	const validateForm = useCallback((): boolean => {
		const validation = validationSchemas.register({
			name,
			email,
			password,
			confirmPassword,
		});
		setErrors(validation.errors);
		return validation.isValid;
	}, [name, email, password, confirmPassword]);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (!validateForm()) {
			return false;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const result = await signUp(name, email, password);
			setIsSubmitting(false);
			return result.success;
		} catch {
			setIsSubmitting(false);
			return false;
		}
	}, [name, email, password, signUp, validateForm]);

	const resetForm = useCallback((): void => {
		setName('');
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setErrors({});
		setIsSubmitting(false);
	}, []);

	return {
		// Form state
		name,
		email,
		password,
		confirmPassword,
		errors,
		isSubmitting,
		// Form actions
		setName,
		setEmail,
		setPassword,
		setConfirmPassword,
		handleSubmit,
		resetForm,
		validateForm,
	};
};

// Auth status hook
export const useAuthStatus = () => {
	const { isLoading, userToken, user, error, clearError } = useAuth();

	const isAuthenticated = !!(userToken && user);
	const isGuest = !isAuthenticated && !isLoading;
	const hasError = !!error;

	return {
		isLoading,
		isAuthenticated,
		isGuest,
		hasError,
		error,
		user,
		clearError,
	};
};

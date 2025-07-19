import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from 'react';
import { authService } from '../services/authService';
import type { ApiResponse, User } from '../types';
import type { AuthConfig, AuthContextType } from '../types/auth';
import { authActions, authReducer, initialAuthState } from './authReducer';

// Create context with undefined default (will throw error if used outside provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
	children: ReactNode;
	config?: AuthConfig;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, config = {} }) => {
	const [state, dispatch] = useReducer(authReducer, initialAuthState);

	// Memoized auth methods to prevent unnecessary re-renders
	const signIn = useCallback(
		async (
			email: string,
			password: string,
		): Promise<ApiResponse<{ user: User; token: string }>> => {
			dispatch(authActions.setLoading(true));
			dispatch(authActions.clearError());

			try {
				const result = await authService.signIn(email, password);

				if (result.success && result.data) {
					dispatch(authActions.signIn(result.data.token, result.data.user));
				} else {
					dispatch(authActions.setError(result.error || 'Błąd logowania'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas logowania';
				dispatch(authActions.setError(errorMessage));
				return {
					success: false,
					error: errorMessage,
				};
			}
		},
		[],
	);

	const signUp = useCallback(
		async (
			name: string,
			email: string,
			password: string,
		): Promise<ApiResponse<{ user: User; token: string }>> => {
			dispatch(authActions.setLoading(true));
			dispatch(authActions.clearError());

			try {
				const result = await authService.signUp(name, email, password);

				if (result.success && result.data) {
					dispatch(authActions.signIn(result.data.token, result.data.user));
				} else {
					dispatch(authActions.setError(result.error || 'Błąd rejestracji'));
				}

				return result;
			} catch (_error) {
				const errorMessage = 'Nieoczekiwany błąd podczas rejestracji';
				dispatch(authActions.setError(errorMessage));
				return {
					success: false,
					error: errorMessage,
				};
			}
		},
		[],
	);

	const signOut = useCallback(async (): Promise<void> => {
		dispatch(authActions.setLoading(true));

		try {
			await authService.signOut();
			dispatch(authActions.signOut());
		} catch (error) {
			console.error('Sign out error:', error);
			// Even if there's an error, we should sign out locally
			dispatch(authActions.signOut());
		}
	}, []);

	const clearError = useCallback((): void => {
		dispatch(authActions.clearError());
	}, []);

	const restoreSession = useCallback(async (): Promise<void> => {
		dispatch(authActions.setLoading(true));

		try {
			const result = await authService.restoreSession();

			if (result.success && result.data) {
				dispatch(authActions.signIn(result.data.token, result.data.user));
			} else {
				dispatch(authActions.restoreToken(null, null));
			}
		} catch (error) {
			console.error('Restore session error:', error);
			dispatch(authActions.restoreToken(null, null));
		}
	}, []);

	// Restore session on app start
	useEffect(() => {
		restoreSession();
	}, [restoreSession]);

	// Auto sign out on session timeout (if configured)
	useEffect(() => {
		if (config.autoSignOut && config.sessionTimeout && state.userToken) {
			const timeoutId = setTimeout(() => {
				signOut();
			}, config.sessionTimeout);

			return () => clearTimeout(timeoutId);
		}

		return () => null;
	}, [config.autoSignOut, config.sessionTimeout, state.userToken, signOut]);

	// Context value with all state and methods
	const contextValue: AuthContextType = {
		// State
		...state,
		// Methods
		signIn,
		signUp,
		signOut,
		clearError,
		restoreSession,
	};

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context with proper error handling
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
};

// Hook to check if user is authenticated
export const useIsAuthenticated = (): boolean => {
	const { userToken, user } = useAuth();
	return !!(userToken && user);
};

// Hook to get current user
export const useCurrentUser = (): User | null => {
	const { user } = useAuth();
	return user;
};

// Hook to check if auth is loading
export const useAuthLoading = (): boolean => {
	const { isLoading } = useAuth();
	return isLoading;
};

// Hook to get auth error
export const useAuthError = (): string | null => {
	const { error } = useAuth();
	return error;
};

// Hook to get auth status
export const useAuthStatus = () => {
	const { isLoading, userToken, user, error, clearError } = useAuth();

	const isAuthenticated = !!(userToken && user);
	const isGuest = !userToken && !user;
	const hasError = !!error;

	return {
		isLoading,
		isAuthenticated,
		isGuest,
		hasError,
		error,
		clearError,
	};
};

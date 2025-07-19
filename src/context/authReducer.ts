import type { User } from '../types';
import type { AuthAction, AuthState } from '../types/auth';

// Initial auth state
export const initialAuthState: AuthState = {
	isLoading: true,
	isSignout: false,
	userToken: null,
	user: null,
	error: null,
};

// Auth reducer with full type safety
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case 'RESTORE_TOKEN':
			return {
				...state,
				userToken: action.payload.token,
				user: action.payload.user,
				isLoading: false,
				error: null,
			};

		case 'SIGN_IN':
			return {
				...state,
				isSignout: false,
				userToken: action.payload.token,
				user: action.payload.user,
				isLoading: false,
				error: null,
			};

		case 'SIGN_OUT':
			return {
				...state,
				isSignout: true,
				userToken: null,
				user: null,
				isLoading: false,
				error: null,
			};

		case 'SET_LOADING':
			return {
				...state,
				isLoading: action.payload,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};

		case 'CLEAR_ERROR':
			return {
				...state,
				error: null,
			};

		default:
			return state;
	}
};

// Action creators for better type safety
export const authActions = {
	restoreToken: (token: string | null, user: User | null): AuthAction => ({
		type: 'RESTORE_TOKEN',
		payload: { token, user },
	}),

	signIn: (token: string, user: User): AuthAction => ({
		type: 'SIGN_IN',
		payload: { token, user },
	}),

	signOut: (): AuthAction => ({
		type: 'SIGN_OUT',
	}),

	setLoading: (loading: boolean): AuthAction => ({
		type: 'SET_LOADING',
		payload: loading,
	}),

	setError: (error: string | null): AuthAction => ({
		type: 'SET_ERROR',
		payload: error,
	}),

	clearError: (): AuthAction => ({
		type: 'CLEAR_ERROR',
	}),
};

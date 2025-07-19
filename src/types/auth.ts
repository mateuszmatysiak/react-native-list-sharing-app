import type { ApiResponse, User } from './index';

// Auth state interface
export interface AuthState {
	isLoading: boolean;
	isSignout: boolean;
	userToken: string | null;
	user: User | null;
	error: string | null;
}

// Auth action types
export type AuthAction =
	| { type: 'RESTORE_TOKEN'; payload: { token: string | null; user: User | null } }
	| { type: 'SIGN_IN'; payload: { token: string; user: User } }
	| { type: 'SIGN_OUT' }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'CLEAR_ERROR' };

// Auth context methods interface
export interface AuthContextMethods {
	signIn: (email: string, password: string) => Promise<ApiResponse<{ user: User; token: string }>>;
	signUp: (
		name: string,
		email: string,
		password: string,
	) => Promise<ApiResponse<{ user: User; token: string }>>;
	signOut: () => Promise<void>;
	clearError: () => void;
	restoreSession: () => Promise<void>;
}

// Complete auth context interface
export interface AuthContextType extends AuthState, AuthContextMethods {}

// Auth hook configuration
export interface AuthConfig {
	enableBiometrics?: boolean;
	sessionTimeout?: number;
	maxLoginAttempts?: number;
	autoSignOut?: boolean;
}

// Session data interface
export interface SessionData {
	token: string;
	user: User;
	expiresAt: string;
	lastActivity: string;
}

// Login attempt tracking
export interface LoginAttempt {
	email: string;
	timestamp: string;
	success: boolean;
	ipAddress?: string;
}

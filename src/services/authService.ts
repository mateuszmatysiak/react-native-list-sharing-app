import type { ApiResponse, User } from '../types';
import type { LoginAttempt, SessionData } from '../types/auth';
import {
	ERROR_MESSAGES,
	generateId,
	getCurrentTimestamp,
	MOCK_USERS,
	STORAGE_KEYS,
} from '../utils/constants';
import { storage, storageUtils } from '../utils/storage';
import { validationSchemas } from '../utils/validation';

// Authentication service class
export class AuthService {
	private static instance: AuthService;
	private loginAttempts: Map<string, LoginAttempt[]> = new Map();
	private readonly maxAttempts = 5;
	private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

	// Singleton pattern
	static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	// Generate JWT-like token (simplified for demo)
	private generateToken(userId: string): string {
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const payload = btoa(
			JSON.stringify({
				sub: userId,
				iat: Date.now(),
				exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			}),
		);
		const signature = btoa(`signature_${userId}_${Date.now()}`);

		return `${header}.${payload}.${signature}`;
	}

	// Validate token (simplified for demo)
	private validateToken(token: string): { valid: boolean; userId?: string; expired?: boolean } {
		try {
			const [, payloadBase64] = token.split('.');

			if (!payloadBase64) {
				return { valid: false };
			}

			const payload = JSON.parse(atob(payloadBase64));

			if (payload.exp < Date.now()) {
				return { valid: false, expired: true };
			}

			return { valid: true, userId: payload.sub };
		} catch {
			return { valid: false };
		}
	}

	// Check if user is locked out
	private isUserLockedOut(email: string): boolean {
		const attempts = this.loginAttempts.get(email) || [];
		const recentFailedAttempts = attempts.filter(
			(attempt) =>
				!attempt.success &&
				Date.now() - new Date(attempt.timestamp).getTime() < this.lockoutDuration,
		);

		return recentFailedAttempts.length >= this.maxAttempts;
	}

	// Record login attempt
	private recordLoginAttempt(email: string, success: boolean): void {
		const attempts = this.loginAttempts.get(email) || [];
		attempts.push({
			email,
			timestamp: getCurrentTimestamp(),
			success,
		});

		// Keep only last 10 attempts
		this.loginAttempts.set(email, attempts.slice(-10));
	}

	// Sign in method
	async signIn(
		email: string,
		password: string,
	): Promise<ApiResponse<{ user: User; token: string }>> {
		// Validate input
		const validation = validationSchemas.login({ email, password });
		if (!validation.isValid) {
			return {
				success: false,
				error: validation.errorList[0]?.message || ERROR_MESSAGES.INVALID_CREDENTIALS,
			};
		}

		// Check lockout
		if (this.isUserLockedOut(email)) {
			return {
				success: false,
				error: `Konto zostało zablokowane na ${this.lockoutDuration / 60000} minut z powodu zbyt wielu nieudanych prób logowania.`,
			};
		}

		try {
			// Find user in mock data (in real app, this would be an API call)
			const user = MOCK_USERS.find((u) => u.email === email && u.password === password);

			if (!user) {
				this.recordLoginAttempt(email, false);
				return {
					success: false,
					error: ERROR_MESSAGES.INVALID_CREDENTIALS,
				};
			}

			// Generate token
			const token = this.generateToken(user.id);

			// Create session data
			const sessionData: SessionData = {
				token,
				user,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				lastActivity: getCurrentTimestamp(),
			};

			// Save session
			const saveResult = await storageUtils.saveUserSession(token, sessionData);
			if (!saveResult.success) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			// Record successful attempt
			this.recordLoginAttempt(email, true);

			return {
				success: true,
				data: { user, token },
				message: 'Zalogowano pomyślnie',
			};
		} catch (error) {
			console.error('Sign in error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Sign up method
	async signUp(
		name: string,
		email: string,
		password: string,
	): Promise<ApiResponse<{ user: User; token: string }>> {
		// Validate input
		const validation = validationSchemas.register({
			name,
			email,
			password,
			confirmPassword: password,
		});
		if (!validation.isValid) {
			return {
				success: false,
				error: validation.errorList[0]?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}

		try {
			// Check if user already exists
			const existingUser = MOCK_USERS.find((u) => u.email === email);
			if (existingUser) {
				return {
					success: false,
					error: ERROR_MESSAGES.USER_EXISTS,
				};
			}

			// Create new user
			const newUser: User = {
				id: generateId(),
				name: name.trim(),
				email: email.toLowerCase().trim(),
				password, // In real app, this would be hashed
				createdAt: getCurrentTimestamp(),
			};

			// Add to mock data (in real app, this would be an API call)
			MOCK_USERS.push(newUser);

			// Generate token
			const token = this.generateToken(newUser.id);

			// Create session data
			const sessionData: SessionData = {
				token,
				user: newUser,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				lastActivity: getCurrentTimestamp(),
			};

			// Save session
			const saveResult = await storageUtils.saveUserSession(token, sessionData);
			if (!saveResult.success) {
				return {
					success: false,
					error: ERROR_MESSAGES.STORAGE_ERROR,
				};
			}

			return {
				success: true,
				data: { user: newUser, token },
				message: 'Konto zostało utworzone pomyślnie',
			};
		} catch (error) {
			console.error('Sign up error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Sign out method
	async signOut(): Promise<ApiResponse> {
		try {
			const result = await storageUtils.clearUserSession();
			return {
				success: result.success,
				error: result.error,
				message: result.success ? 'Wylogowano pomyślnie' : undefined,
			};
		} catch (error) {
			console.error('Sign out error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Restore session method
	async restoreSession(): Promise<ApiResponse<{ user: User; token: string }>> {
		try {
			const sessionResult = await storageUtils.getUserSession();

			if (!sessionResult.success || !sessionResult.data) {
				return {
					success: false,
					error: 'No session found',
				};
			}

			const { token } = sessionResult.data;
			const sessionData = sessionResult.data.userData as SessionData;

			// Validate token
			const tokenValidation = this.validateToken(token);
			if (!tokenValidation.valid) {
				// Clear invalid session
				await storageUtils.clearUserSession();
				return {
					success: false,
					error: tokenValidation.expired ? 'Session expired' : 'Invalid session',
				};
			}

			// Check session expiration
			if (new Date(sessionData.expiresAt) < new Date()) {
				await storageUtils.clearUserSession();
				return {
					success: false,
					error: 'Session expired',
				};
			}

			// Update last activity
			const updatedSessionData: SessionData = {
				...sessionData,
				lastActivity: getCurrentTimestamp(),
			};

			await storage.setItem(STORAGE_KEYS.USER_DATA, updatedSessionData);

			return {
				success: true,
				data: { user: sessionData.user, token },
				message: 'Session restored successfully',
			};
		} catch (error) {
			console.error('Restore session error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Get current user from token
	async getCurrentUser(): Promise<User | null> {
		try {
			const sessionResult = await storageUtils.getUserSession();
			if (sessionResult.success && sessionResult.data) {
				const sessionData = sessionResult.data.userData as SessionData;
				return sessionData.user;
			}
			return null;
		} catch {
			return null;
		}
	}

	// Update user profile
	async updateProfile(
		userId: string,
		updates: Partial<Pick<User, 'name' | 'email'>>,
	): Promise<ApiResponse<User>> {
		try {
			// Validate updates
			if (
				updates.name &&
				!validationSchemas.register({
					name: updates.name,
					email: 'temp@temp.com',
					password: 'temp123',
					confirmPassword: 'temp123',
				}).isValid
			) {
				return {
					success: false,
					error: 'Nieprawidłowe dane profilu',
				};
			}

			// Find and update user in mock data
			const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
			if (userIndex === -1) {
				return {
					success: false,
					error: ERROR_MESSAGES.USER_NOT_FOUND,
				};
			}

			if (!updates.email && !updates.name) {
				return {
					success: false,
					error: 'Brak danych do aktualizacji',
				};
			}

			let mockedUser = MOCK_USERS[userIndex];
			if (!mockedUser) {
				return {
					success: false,
					error: ERROR_MESSAGES.USER_NOT_FOUND,
				};
			}

			const updatedUser = { ...mockedUser, ...updates };
			mockedUser = updatedUser;

			// Update session data
			const sessionResult = await storageUtils.getUserSession();
			if (sessionResult.success && sessionResult.data) {
				const sessionData = sessionResult.data.userData as SessionData;
				const updatedSessionData: SessionData = {
					...sessionData,
					user: updatedUser,
					lastActivity: getCurrentTimestamp(),
				};

				await storage.setItem(STORAGE_KEYS.USER_DATA, updatedSessionData);
			}

			return {
				success: true,
				data: updatedUser,
				message: 'Profil został zaktualizowany',
			};
		} catch (error) {
			console.error('Update profile error:', error);
			return {
				success: false,
				error: ERROR_MESSAGES.UNKNOWN_ERROR,
			};
		}
	}

	// Check if email exists
	async checkEmailExists(email: string): Promise<boolean> {
		return MOCK_USERS.some((u) => u.email === email.toLowerCase().trim());
	}

	// Get login attempts for user
	getLoginAttempts(email: string): LoginAttempt[] {
		return this.loginAttempts.get(email) || [];
	}

	// Clear login attempts for user
	clearLoginAttempts(email: string): void {
		this.loginAttempts.delete(email);
	}
}

// Export singleton instance
export const authService = AuthService.getInstance();

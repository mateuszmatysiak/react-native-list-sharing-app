import { describe, expect, it } from 'vitest';
import { ERROR_MESSAGES } from '../constants';
import { validationSchemas, validators } from '../validation';

describe('validators', () => {
	describe('email', () => {
		it('should validate correct email', () => {
			expect(validators.email('test@example.com')).toBeUndefined();
		});

		it('should reject invalid email', () => {
			expect(validators.email('invalid-email')).toBe(ERROR_MESSAGES.INVALID_EMAIL);
		});

		it('should reject empty email', () => {
			expect(validators.email('')).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
		});
	});

	describe('password', () => {
		it('should validate correct password', () => {
			expect(validators.password('password123')).toBeUndefined();
		});

		it('should reject short password', () => {
			expect(validators.password('123')).toBe(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
		});

		it('should reject empty password', () => {
			expect(validators.password('')).toBe(ERROR_MESSAGES.REQUIRED_FIELD);
		});
	});
});

describe('validationSchemas', () => {
	describe('login', () => {
		it('should validate correct login data', () => {
			const result = validationSchemas.login({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result.isValid).toBe(true);
			expect(result.errorList).toHaveLength(0);
		});

		it('should reject invalid login data', () => {
			const result = validationSchemas.login({
				email: 'invalid-email',
				password: '123',
			});

			expect(result.isValid).toBe(false);
			expect(result.errorList).toHaveLength(2);
		});
	});
});

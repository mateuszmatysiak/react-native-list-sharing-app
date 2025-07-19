import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react-native';
import type React from 'react';
import type { ErrorInfo } from 'react';
import { useCallback, useMemo } from 'react';
import { type FallbackProps, ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Alert, Text, View } from 'react-native';
import { useTheme } from '@/styles/theme';
import { Button } from './Button';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error boundary configuration
interface ErrorBoundaryConfig {
	level: ErrorSeverity;
	showDetails?: boolean;
	allowReset?: boolean;
	allowRetry?: boolean;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Custom error fallback component
const ErrorFallback: React.FC<FallbackProps & { config: ErrorBoundaryConfig }> = ({
	error,
	resetErrorBoundary,
	config,
}) => {
	const { theme } = useTheme();

	const getErrorIcon = () => {
		switch (config.level) {
			case 'critical':
				return <Bug size={48} color={theme.colors.error} />;
			case 'high':
				return <AlertTriangle size={48} color={theme.colors.error} />;
			default:
				return <AlertTriangle size={48} color={theme.colors.warning} />;
		}
	};

	const getErrorTitle = () => {
		switch (config.level) {
			case 'critical':
				return 'Krytyczny błąd aplikacji';
			case 'high':
				return 'Wystąpił poważny błąd';
			case 'medium':
				return 'Wystąpił błąd';
			default:
				return 'Coś poszło nie tak';
		}
	};

	const getErrorMessage = () => {
		switch (config.level) {
			case 'critical':
				return 'Aplikacja napotkała krytyczny błąd i musi zostać zrestartowana.';
			case 'high':
				return 'Wystąpił poważny błąd. Spróbuj ponownie lub skontaktuj się z obsługą.';
			case 'medium':
				return 'Wystąpił błąd podczas ładowania tej części aplikacji.';
			default:
				return 'Nie udało się wyświetlić tego elementu.';
		}
	};

	const handleShowDetails = useCallback(() => {
		Alert.alert('Szczegóły błędu', `${error.name}: ${error.message}`, [{ text: 'OK' }], {
			cancelable: true,
		});
	}, [error]);

	const handleReportError = useCallback(() => {
		Alert.alert('Zgłoś błąd', 'Czy chcesz zgłosić ten błąd do zespołu wsparcia?', [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Zgłoś',
				onPress: () => {
					// Here you would integrate with your error reporting service
					// e.g., Sentry, Bugsnag, or custom API
					console.log('Error reported:', error);
					Alert.alert('Dziękujemy', 'Błąd został zgłoszony do zespołu wsparcia.');
				},
			},
		]);
	}, [error]);

	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				padding: theme.spacing.xl,
				backgroundColor: theme.colors.background,
			}}
		>
			<View
				style={{
					alignItems: 'center',
					marginBottom: theme.spacing.xxl,
				}}
			>
				{getErrorIcon()}

				<Text
					style={{
						fontSize: theme.fontSize.xl,
						fontWeight: theme.fontWeight.bold,
						color: theme.colors.textPrimary,
						textAlign: 'center',
						marginTop: theme.spacing.lg,
						marginBottom: theme.spacing.md,
					}}
				>
					{getErrorTitle()}
				</Text>

				<Text
					style={{
						fontSize: theme.fontSize.base,
						color: theme.colors.textSecondary,
						textAlign: 'center',
						lineHeight: 24,
						marginBottom: theme.spacing.xl,
					}}
				>
					{getErrorMessage()}
				</Text>
			</View>

			<View style={{ width: '100%', maxWidth: 300 }}>
				{config.allowReset && (
					<Button
						title="Spróbuj ponownie"
						onPress={resetErrorBoundary}
						leftIcon={<RefreshCw size={20} color="#ffffff" />}
						style={{ marginBottom: theme.spacing.md }}
					/>
				)}

				{config.allowRetry && (
					<Button
						title="Powrót do strony głównej"
						variant="outline"
						leftIcon={<Home size={20} color={theme.colors.primary} />}
						onPress={() => {
							// Navigate to home screen
							resetErrorBoundary();
						}}
						style={{ marginBottom: theme.spacing.md }}
					/>
				)}

				{config.showDetails && (
					<Button
						title="Pokaż szczegóły"
						variant="ghost"
						size="sm"
						leftIcon={<Bug size={16} color={theme.colors.textSecondary} />}
						onPress={handleShowDetails}
						style={{ marginBottom: theme.spacing.sm }}
					/>
				)}

				<Button title="Zgłoś błąd" variant="ghost" size="sm" onPress={handleReportError} />
			</View>
		</View>
	);
};

// Main Error Boundary component
interface ErrorBoundaryProps {
	children: React.ReactNode;
	config?: Partial<ErrorBoundaryConfig>;
	fallback?: React.ComponentType<FallbackProps>;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
	children,
	config = {},
	fallback,
}) => {
	const finalConfig: ErrorBoundaryConfig = useMemo(
		() => ({
			level: 'medium',
			showDetails: __DEV__, // Only show details in development
			allowReset: true,
			allowRetry: true,
			...config,
		}),
		[config],
	);

	const handleError = useCallback(
		(error: Error, errorInfo: ErrorInfo) => {
			// Log error to console in development
			if (__DEV__) {
				console.error('Error Boundary caught an error:', error);
				console.error('Error info:', errorInfo);
			}

			// Call custom error handler if provided
			finalConfig.onError?.(error, errorInfo);

			// Here you would integrate with your error reporting service
			// e.g., Sentry.captureException(error, { extra: errorInfo });
		},
		[finalConfig],
	);

	const FallbackComponent =
		fallback || ((props: FallbackProps) => <ErrorFallback {...props} config={finalConfig} />);

	return (
		<ReactErrorBoundary
			FallbackComponent={FallbackComponent}
			onError={handleError}
			onReset={() => {
				// Additional reset logic if needed
				console.log('Error boundary reset');
			}}
		>
			{children}
		</ReactErrorBoundary>
	);
};

// Pre-configured error boundaries for common use cases
export const CriticalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ErrorBoundary config={{ level: 'critical', allowReset: true, allowRetry: false }}>
		{children}
	</ErrorBoundary>
);

export const ScreenErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ErrorBoundary config={{ level: 'high', allowReset: true, allowRetry: true }}>
		{children}
	</ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ErrorBoundary config={{ level: 'medium', allowReset: true, allowRetry: false }}>
		{children}
	</ErrorBoundary>
);

export const ListErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<ErrorBoundary
		config={{
			level: 'medium',
			allowReset: true,
			allowRetry: true,
			onError: (error) => {
				console.log('List component error:', error);
				// Could integrate with analytics to track list-related errors
			},
		}}
	>
		{children}
	</ErrorBoundary>
);

import type { Theme } from '@/types/ui';

export const lightTheme: Theme = {
	colors: {
		primary: '#2563eb',
		primaryDark: '#1d4ed8',
		primaryLight: '#60a5fa',
		secondary: '#64748b',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
		info: '#06b6d4',
		background: '#f8fafc',
		surface: '#ffffff',
		textPrimary: '#0f172a',
		textSecondary: '#64748b',
		textDisabled: '#94a3b8',
		border: '#e2e8f0',
		borderFocus: '#2563eb',
		shadow: '#00000015',
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
		xl: 32,
		xxl: 48,
	},
	borderRadius: {
		sm: 4,
		md: 8,
		lg: 12,
		xl: 16,
		round: 9999,
	},
	fontSize: {
		xs: 12,
		sm: 14,
		base: 16,
		lg: 18,
		xl: 20,
		xxl: 24,
		xxxl: 32,
	},
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	},
};

export const darkTheme: Theme = {
	...lightTheme,
	colors: {
		...lightTheme.colors,
		background: '#0f172a',
		surface: '#1e293b',
		textPrimary: '#f8fafc',
		textSecondary: '#94a3b8',
		textDisabled: '#64748b',
		border: '#334155',
		shadow: '#00000040',
	},
};

// Theme context
import React, { createContext, type ReactNode, useContext } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

interface ThemeContextType {
	theme: Theme;
	isDark: boolean;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
	initialTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
	children,
	initialTheme = 'light',
}) => {
	const [isDark, setIsDark] = React.useState(initialTheme === 'dark');

	const toggleTheme = React.useCallback(() => {
		setIsDark((prev) => !prev);
	}, []);

	const theme = isDark ? darkTheme : lightTheme;

	const value = React.useMemo(
		() => ({
			theme,
			isDark,
			toggleTheme,
		}),
		[theme, isDark, toggleTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return context;
};

// Helper functions
export const createStyles = <T extends Record<string, ViewStyle | TextStyle>>(
	styleFactory: (theme: Theme) => T,
) => {
	return (theme: Theme): T => styleFactory(theme);
};

export const getSpacing = (theme: Theme, ...values: Array<keyof Theme['spacing']>) => {
	return values.map((value) => theme.spacing[value]);
};

export const getFontSize = (theme: Theme, size: keyof Theme['fontSize']) => {
	return theme.fontSize[size];
};

export const getBorderRadius = (theme: Theme, size: keyof Theme['borderRadius']) => {
	return theme.borderRadius[size];
};

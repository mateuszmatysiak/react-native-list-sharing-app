import { NavigationContainer } from '@react-navigation/native';
import type React from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStatus } from '@/context/AuthContext';
import { useTheme } from '@/styles/theme';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator: React.FC = () => {
	const { isLoading, isAuthenticated } = useAuthStatus();
	const { theme } = useTheme();

	if (isLoading) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.colors.background,
				}}
				edges={['top', 'bottom', 'left', 'right']}
			>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</SafeAreaView>
		);
	}

	return (
		<NavigationContainer>
			{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
		</NavigationContainer>
	);
};

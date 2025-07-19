import type React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/styles/theme';
import type { ScreenProps } from '@/types/ui';

export const Screen: React.FC<ScreenProps> = ({
	children,
	header,
	footer,
	scrollable = true,
	refreshing = false,
	onRefresh,
	style,
	testID,
}) => {
	const { theme } = useTheme();

	const getScreenStyle = () => ({
		flex: 1,
		backgroundColor: theme.colors.background,
	});

	const getContentStyle = () => ({
		flex: 1,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm, // Add some top padding for better spacing
	});

	const renderContent = () => {
		if (scrollable) {
			return (
				<ScrollView
					style={getContentStyle()}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					refreshControl={
						onRefresh ? (
							<RefreshControl
								refreshing={refreshing}
								onRefresh={onRefresh}
								tintColor={theme.colors.primary}
								colors={[theme.colors.primary]}
							/>
						) : undefined
					}
				>
					{children}
				</ScrollView>
			);
		}

		return <View style={getContentStyle()}>{children}</View>;
	};

	return (
		<SafeAreaView
			style={[getScreenStyle(), style]}
			edges={['top', 'left', 'right']}
			testID={testID}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				{header}
				{renderContent()}
				{footer}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

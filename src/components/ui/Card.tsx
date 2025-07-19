import type React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/styles/theme';
import type { CardProps } from '@/types/ui';

export const Card: React.FC<CardProps> = ({
	children,
	padding = 'md',
	shadow = true,
	border = false,
	style,
	testID,
	...props
}) => {
	const { theme } = useTheme();

	const getCardStyle = () => {
		const baseStyle = {
			backgroundColor: theme.colors.surface,
			borderRadius: theme.borderRadius.lg,
			padding: theme.spacing[padding],
		};

		const shadowStyle = shadow
			? {
					shadowColor: theme.colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 1,
					shadowRadius: 8,
					elevation: 3,
				}
			: {};

		const borderStyle = border
			? {
					borderWidth: 1,
					borderColor: theme.colors.border,
				}
			: {};

		return {
			...baseStyle,
			...shadowStyle,
			...borderStyle,
		};
	};

	return (
		<View style={[getCardStyle(), style]} testID={testID} {...props}>
			{children}
		</View>
	);
};

Card.displayName = 'Card';

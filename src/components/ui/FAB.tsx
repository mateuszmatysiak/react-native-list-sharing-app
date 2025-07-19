import type React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/styles/theme';
import type { FABProps } from '@/types/ui';

export const FAB: React.FC<FABProps> = ({
	icon,
	size = 'md',
	position = 'bottom-right',
	style,
	testID,
	...props
}) => {
	const { theme } = useTheme();

	const getSizeStyle = () => {
		const sizes = {
			sm: { width: 48, height: 48 },
			md: { width: 56, height: 56 },
			lg: { width: 64, height: 64 },
		};

		return sizes[size];
	};

	const getPositionStyle = () => {
		const basePositionStyle = {
			position: 'absolute' as const,
			bottom: theme.spacing.lg,
		};

		const positions = {
			'bottom-right': { right: theme.spacing.lg },
			'bottom-left': { left: theme.spacing.lg },
			'bottom-center': { alignSelf: 'center' as const },
		};

		return {
			...basePositionStyle,
			...positions[position],
		};
	};

	const getFABStyle = () => {
		const sizeStyle = getSizeStyle();

		return {
			...sizeStyle,
			borderRadius: sizeStyle.width / 2,
			backgroundColor: theme.colors.primary,
			alignItems: 'center' as const,
			justifyContent: 'center' as const,
			shadowColor: theme.colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 1,
			shadowRadius: 12,
			elevation: 8,
		};
	};

	return (
		<TouchableOpacity
			style={[getPositionStyle(), getFABStyle(), style]}
			testID={testID}
			accessibilityRole="button"
			{...props}
		>
			<View>{icon}</View>
		</TouchableOpacity>
	);
};

FAB.displayName = 'FAB';

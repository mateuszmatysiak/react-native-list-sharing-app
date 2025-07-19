import type React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '@/styles/theme';
import type { AvatarProps } from '@/types/ui';

export const Avatar: React.FC<AvatarProps> = ({
	name,
	size = 40,
	backgroundColor,
	textColor,
	imageUri,
	style,
	testID,
}) => {
	const { theme } = useTheme();

	const getInitials = (fullName: string): string | undefined => {
		const names = fullName.trim().split(' ');
		if (names.length === 1) {
			return names[0]?.charAt(0).toUpperCase();
		}
		return `${names[0]?.charAt(0)}${names[names.length - 1]?.charAt(0)}`.toUpperCase();
	};

	const getBackgroundColor = (): string | undefined => {
		if (backgroundColor) return backgroundColor;

		// Generate consistent color based on name
		const colors = [
			theme.colors.primary,
			theme.colors.secondary,
			theme.colors.success,
			theme.colors.warning,
			theme.colors.info,
		];

		const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
		return colors[charCode % colors.length];
	};

	const getAvatarStyle = () => ({
		width: size,
		height: size,
		borderRadius: size / 2,
		backgroundColor: getBackgroundColor(),
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		overflow: 'hidden' as const,
	});

	const getTextStyle = () => ({
		fontSize: size * 0.4,
		fontWeight: theme.fontWeight.semibold,
		color: textColor || '#ffffff',
	});

	const getImageStyle = () => ({
		width: size,
		height: size,
	});

	return (
		<View style={[getAvatarStyle(), style]} testID={testID}>
			{imageUri ? (
				<Image
					source={{ uri: imageUri }}
					style={getImageStyle()}
					accessibilityLabel={`Avatar of ${name}`}
				/>
			) : (
				<Text style={getTextStyle()}>{getInitials(name)}</Text>
			)}
		</View>
	);
};

Avatar.displayName = 'Avatar';

import type React from 'react';
import type { ViewStyle } from 'react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/styles/theme';
import type { ButtonProps } from '@/types/ui';

export const Button: React.FC<ButtonProps> = ({
	title,
	variant = 'primary',
	size = 'md',
	loading = false,
	disabled = false,
	leftIcon,
	rightIcon,
	fullWidth = false,
	style,
	textStyle,
	onPress,
	testID,
	accessibilityLabel,
	...props
}) => {
	const { theme } = useTheme();

	const isDisabled = disabled || loading;

	const getButtonStyle = () => {
		const baseStyle = {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			justifyContent: 'center' as const,
			borderRadius: theme.borderRadius.md,
			borderWidth: variant === 'outline' ? 1 : 0,
			opacity: isDisabled ? 0.6 : 1,
		};

		const sizeStyles = {
			sm: {
				paddingHorizontal: theme.spacing.md,
				paddingVertical: theme.spacing.sm,
				minHeight: 36,
			},
			md: {
				paddingHorizontal: theme.spacing.lg,
				paddingVertical: theme.spacing.md,
				minHeight: 44,
			},
			lg: {
				paddingHorizontal: theme.spacing.xl,
				paddingVertical: theme.spacing.lg,
				minHeight: 52,
			},
		};

		const variantStyles = {
			primary: {
				backgroundColor: theme.colors.primary,
				borderColor: theme.colors.primary,
			},
			secondary: {
				backgroundColor: theme.colors.secondary,
				borderColor: theme.colors.secondary,
			},
			outline: {
				backgroundColor: 'transparent',
				borderColor: theme.colors.primary,
			},
			ghost: {
				backgroundColor: 'transparent',
				borderColor: 'transparent',
			},
			danger: {
				backgroundColor: theme.colors.error,
				borderColor: theme.colors.error,
			},
		};

		const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

		return {
			...baseStyle,
			...sizeStyles[size],
			...variantStyles[variant],
			...widthStyle,
		};
	};

	const getTextStyle = () => {
		const baseStyle = {
			fontWeight: theme.fontWeight.semibold,
			textAlign: 'center' as const,
		};

		const sizeStyles = {
			sm: { fontSize: theme.fontSize.sm },
			md: { fontSize: theme.fontSize.base },
			lg: { fontSize: theme.fontSize.lg },
		};

		const variantStyles = {
			primary: { color: '#ffffff' },
			secondary: { color: '#ffffff' },
			outline: { color: theme.colors.primary },
			ghost: { color: theme.colors.primary },
			danger: { color: '#ffffff' },
		};

		return {
			...baseStyle,
			...sizeStyles[size],
			...variantStyles[variant],
		};
	};

	return (
		<TouchableOpacity
			style={[getButtonStyle(), style]}
			onPress={onPress}
			disabled={isDisabled}
			testID={testID}
			accessibilityLabel={accessibilityLabel || title}
			accessibilityRole="button"
			{...props}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#ffffff'}
				/>
			) : (
				<>
					{leftIcon && (
						<View style={{ marginRight: title ? theme.spacing.sm : 0 }}>{leftIcon}</View>
					)}

					{title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}

					{rightIcon && (
						<View style={{ marginLeft: title ? theme.spacing.sm : 0 }}>{rightIcon}</View>
					)}
				</>
			)}
		</TouchableOpacity>
	);
};

Button.displayName = 'Button';

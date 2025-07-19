import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import {
	type NativeSyntheticEvent,
	Text,
	TextInput,
	type TextInputFocusEventData,
	type TextInput as TextInputRef,
	TouchableOpacity,
	View,
} from 'react-native';
import { useTheme } from '@/styles/theme';
import type { InputProps } from '@/types/ui';

export const Input = forwardRef<TextInputRef, InputProps>(
	(
		{
			label,
			error,
			helperText,
			variant = 'outline',
			size = 'md',
			leftIcon,
			rightIcon,
			loading = false,
			required = false,
			secureTextEntry = false,
			style,
			inputStyle,
			labelStyle,
			testID,
			accessibilityLabel,
			...props
		},
		ref,
	) => {
		const { theme } = useTheme();
		const [isPasswordVisible, setIsPasswordVisible] = useState(false);
		const [isFocused, setIsFocused] = useState(false);

		const isPassword = secureTextEntry;
		const hasError = !!error;

		const getContainerStyle = () => {
			const baseStyle = {
				marginBottom: theme.spacing.md,
			};

			return baseStyle;
		};

		const getLabelStyle = () => {
			const baseStyle = {
				fontSize: theme.fontSize.sm,
				fontWeight: theme.fontWeight.medium,
				marginBottom: theme.spacing.sm,
				color: theme.colors.textPrimary,
			};

			return baseStyle;
		};

		const getInputContainerStyle = () => {
			const baseStyle = {
				flexDirection: 'row' as const,
				alignItems: 'center' as const,
				borderRadius: theme.borderRadius.md,
				borderWidth: 1,
			};

			const sizeStyles = {
				sm: {
					minHeight: 36,
					paddingHorizontal: theme.spacing.sm,
				},
				md: {
					minHeight: 44,
					paddingHorizontal: theme.spacing.md,
				},
				lg: {
					minHeight: 52,
					paddingHorizontal: theme.spacing.lg,
				},
			};

			const variantStyles = {
				default: {
					backgroundColor: theme.colors.surface,
					borderColor: 'transparent',
				},
				filled: {
					backgroundColor: theme.colors.background,
					borderColor: 'transparent',
				},
				outline: {
					backgroundColor: theme.colors.surface,
					borderColor: hasError
						? theme.colors.error
						: isFocused
							? theme.colors.borderFocus
							: theme.colors.border,
				},
			};

			return {
				...baseStyle,
				...sizeStyles[size],
				...variantStyles[variant],
			};
		};

		const getInputStyle = () => {
			const baseStyle = {
				flex: 1,
				fontSize: theme.fontSize.base,
				color: theme.colors.textPrimary,
				paddingVertical: 0, // Remove default padding
			};

			return baseStyle;
		};

		const getHelperTextStyle = () => {
			const baseStyle = {
				fontSize: theme.fontSize.xs,
				marginTop: theme.spacing.xs,
			};

			const colorStyle = {
				color: hasError ? theme.colors.error : theme.colors.textSecondary,
			};

			return {
				...baseStyle,
				...colorStyle,
			};
		};

		const togglePasswordVisibility = () => {
			setIsPasswordVisible((prev) => !prev);
		};

		const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
			setIsFocused(false);
			props.onBlur?.(e);
		};

		return (
			<View style={[getContainerStyle(), style]}>
				{label && (
					<Text style={[getLabelStyle(), labelStyle]}>
						{label}
						{required && <Text style={{ color: theme.colors.error }}> *</Text>}
					</Text>
				)}

				<View style={getInputContainerStyle()}>
					{leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}

					<TextInput
						ref={ref}
						style={[getInputStyle(), inputStyle]}
						secureTextEntry={isPassword && !isPasswordVisible}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholderTextColor={theme.colors.textDisabled}
						testID={testID}
						accessibilityLabel={accessibilityLabel || label}
						{...props}
					/>

					{isPassword && (
						<TouchableOpacity
							onPress={togglePasswordVisibility}
							style={{ marginLeft: theme.spacing.sm }}
						>
							{isPasswordVisible ? (
								<EyeOff size={20} color={theme.colors.textSecondary} />
							) : (
								<Eye size={20} color={theme.colors.textSecondary} />
							)}
						</TouchableOpacity>
					)}

					{rightIcon && !isPassword && (
						<View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>
					)}
				</View>

				{(error || helperText) && <Text style={getHelperTextStyle()}>{error || helperText}</Text>}
			</View>
		);
	},
);

Input.displayName = 'Input';

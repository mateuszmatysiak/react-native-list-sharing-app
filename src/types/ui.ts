import type { ReactNode } from 'react';
import type {
	DimensionValue,
	TextInputProps,
	TextStyle,
	TouchableOpacityProps,
	ViewProps,
	ViewStyle,
} from 'react-native';

// Base component props
export interface BaseComponentProps {
	testID?: string;
	accessibilityLabel?: string;
	accessibilityHint?: string;
}

// Theme types
export interface Theme {
	colors: {
		primary: string;
		primaryDark: string;
		primaryLight: string;
		secondary: string;
		success: string;
		error: string;
		warning: string;
		info: string;
		background: string;
		surface: string;
		textPrimary: string;
		textSecondary: string;
		textDisabled: string;
		border: string;
		borderFocus: string;
		shadow: string;
	};
	spacing: {
		xs: number;
		sm: number;
		md: number;
		lg: number;
		xl: number;
		xxl: number;
	};
	borderRadius: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
		round: number;
	};
	fontSize: {
		xs: number;
		sm: number;
		base: number;
		lg: number;
		xl: number;
		xxl: number;
		xxxl: number;
	};
	fontWeight: {
		normal: '400';
		medium: '500';
		semibold: '600';
		bold: '700';
	};
}

// Button component types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'>, BaseComponentProps {
	title: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	fullWidth?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
}

// Input component types
export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'>, BaseComponentProps {
	label?: string;
	error?: string;
	helperText?: string;
	variant?: InputVariant;
	size?: InputSize;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	loading?: boolean;
	required?: boolean;
	style?: ViewStyle;
	inputStyle?: TextStyle;
	labelStyle?: TextStyle;
}

// Card component types
export interface CardProps extends ViewProps, BaseComponentProps {
	children: ReactNode;
	padding?: keyof Theme['spacing'];
	shadow?: boolean;
	border?: boolean;
	style?: ViewStyle;
}

// Modal component types
export interface ModalProps extends BaseComponentProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	maxHeight?: DimensionValue;
	closeOnBackdrop?: boolean;
	showCloseButton?: boolean;
}

// Progress bar types
export interface ProgressBarProps extends BaseComponentProps {
	progress: number; // 0-100
	color?: string;
	backgroundColor?: string;
	height?: number;
	showPercentage?: boolean;
	animated?: boolean;
	style?: ViewStyle;
}

// Avatar types
export interface AvatarProps extends BaseComponentProps {
	name: string;
	size?: number;
	backgroundColor?: string;
	textColor?: string;
	imageUri?: string;
	style?: ViewStyle;
}

// Chip types
export interface ChipProps extends BaseComponentProps {
	label: string;
	variant?: 'filled' | 'outline';
	color?: string;
	onPress?: () => void;
	onDelete?: () => void;
	icon?: ReactNode;
	style?: ViewStyle;
}

// List item types
export interface ListItemProps extends TouchableOpacityProps, BaseComponentProps {
	title: string;
	subtitle?: string;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	onPress?: () => void;
	style?: ViewStyle;
}

// Floating Action Button types
export interface FABProps extends TouchableOpacityProps, BaseComponentProps {
	icon: ReactNode;
	size?: 'sm' | 'md' | 'lg';
	position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
	style?: ViewStyle;
}

// Loading component types
export interface LoadingProps extends BaseComponentProps {
	size?: 'small' | 'large';
	color?: string;
	text?: string;
	overlay?: boolean;
}

// Alert component types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends BaseComponentProps {
	type: AlertType;
	title?: string;
	message: string;
	visible: boolean;
	onClose?: () => void;
	actions?: Array<{
		text: string;
		onPress: () => void;
		style?: 'default' | 'cancel' | 'destructive';
	}>;
}

// Screen layout types
export interface ScreenProps extends BaseComponentProps {
	children: ReactNode;
	header?: ReactNode;
	footer?: ReactNode;
	scrollable?: boolean;
	refreshing?: boolean;
	onRefresh?: () => void;
	style?: ViewStyle;
}

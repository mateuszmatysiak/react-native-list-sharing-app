import { X } from 'lucide-react-native';
import type React from 'react';
import { useEffect } from 'react';
import {
	Dimensions,
	KeyboardAvoidingView,
	Platform,
	Modal as RNModal,
	ScrollView,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { useTheme } from '@/styles/theme';
import type { ModalProps } from '@/types/ui';

const { height: screenHeight } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
	visible,
	onClose,
	title,
	children,
	maxHeight,
	closeOnBackdrop = true,
	showCloseButton = true,
	testID,
}) => {
	const { theme } = useTheme();

	useEffect(() => {
		// Handle Android back button
		if (Platform.OS === 'android' && visible) {
			const _backHandler = () => {
				onClose();
				return true;
			};

			// In a real React Native app, you'd use BackHandler here
			// BackHandler.addEventListener('hardwareBackPress', backHandler);
			// return () => BackHandler.removeEventListener('hardwareBackPress', backHandler);
		}
	}, [visible, onClose]);

	const getOverlayStyle = () => ({
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end' as const,
	});

	const getModalContainerStyle = () => {
		const baseStyle = {
			backgroundColor: theme.colors.surface,
			borderTopLeftRadius: theme.borderRadius.xl,
			borderTopRightRadius: theme.borderRadius.xl,
			maxHeight: maxHeight || screenHeight * 0.9,
		};

		return baseStyle;
	};

	const getHeaderStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		justifyContent: 'space-between' as const,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	});

	const getTitleStyle = () => ({
		fontSize: theme.fontSize.lg,
		fontWeight: theme.fontWeight.semibold,
		color: theme.colors.textPrimary,
		flex: 1,
	});

	const handleBackdropPress = () => {
		if (closeOnBackdrop) {
			onClose();
		}
	};

	const handleModalPress = () => {
		// Prevent backdrop close when modal content is pressed
	};

	return (
		<RNModal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
			testID={testID}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<TouchableWithoutFeedback onPress={handleBackdropPress}>
					<View style={getOverlayStyle()}>
						<TouchableWithoutFeedback onPress={handleModalPress}>
							<View style={getModalContainerStyle()}>
								{(title || showCloseButton) && (
									<View style={getHeaderStyle()}>
										{title && <Text style={getTitleStyle()}>{title}</Text>}

										{showCloseButton && (
											<TouchableOpacity
												onPress={onClose}
												style={{
													padding: theme.spacing.sm,
													marginRight: -theme.spacing.sm,
												}}
												accessibilityLabel="Close modal"
												accessibilityRole="button"
											>
												<X size={24} color={theme.colors.textSecondary} />
											</TouchableOpacity>
										)}
									</View>
								)}

								<ScrollView
									showsVerticalScrollIndicator={false}
									keyboardShouldPersistTaps="handled"
								>
									{children}
								</ScrollView>
							</View>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</RNModal>
	);
};

Modal.displayName = 'Modal';

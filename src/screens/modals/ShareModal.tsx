import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Share, X } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useList } from '@/context/ListContext';
import { useTheme } from '@/styles/theme';
import type { AppStackParamList } from '@/types';

type ShareModalProps = NativeStackScreenProps<AppStackParamList, 'ShareModal'>;

export const ShareModal: React.FC<ShareModalProps> = ({ navigation, route }) => {
	const { list } = route.params;
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState('');

	const { shareList } = useList();
	const { theme } = useTheme();

	const handleClose = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const validateEmail = useCallback((email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}, []);

	const handleShare = useCallback(async () => {
		if (!email.trim()) {
			setEmailError('Email jest wymagany');
			return;
		}

		if (!validateEmail(email.trim())) {
			setEmailError('Wprowadź poprawny adres email');
			return;
		}

		setEmailError('');
		setLoading(true);

		try {
			const result = await shareList({
				listId: list.id,
				userEmail: email.trim(),
			});

			if (result.success) {
				Alert.alert('Sukces', 'Lista została udostępniona!', [
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]);
			} else {
				Alert.alert('Błąd', result.error || 'Nie udało się udostępnić listy');
			}
		} catch (_error) {
			Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
		} finally {
			setLoading(false);
		}
	}, [email, list.id, shareList, navigation, validateEmail]);

	const canSubmit = email.trim() && !loading;

	return (
		<Modal visible={true} onClose={handleClose} showCloseButton={false}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: theme.colors.background,
						borderTopLeftRadius: theme.borderRadius.lg,
						borderTopRightRadius: theme.borderRadius.lg,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: theme.spacing.lg,
							borderBottomWidth: 1,
							borderBottomColor: theme.colors.border,
						}}
					>
						<Text
							style={{
								fontSize: theme.fontSize.xl,
								fontWeight: theme.fontWeight.bold,
								color: theme.colors.textPrimary,
							}}
						>
							Udostępnij listę
						</Text>
						<Button
							title=""
							variant="ghost"
							size="sm"
							leftIcon={<X size={20} color={theme.colors.textSecondary} />}
							onPress={handleClose}
						/>
					</View>

					<View style={{ flex: 1, padding: theme.spacing.lg }}>
						<View
							style={{
								backgroundColor: theme.colors.surface,
								padding: theme.spacing.md,
								borderRadius: theme.borderRadius.md,
								marginBottom: theme.spacing.lg,
							}}
						>
							<Text
								style={{
									fontSize: theme.fontSize.base,
									fontWeight: theme.fontWeight.medium,
									color: theme.colors.textPrimary,
									marginBottom: theme.spacing.xs,
								}}
							>
								{list.title}
							</Text>
							<Text
								style={{
									fontSize: theme.fontSize.sm,
									color: theme.colors.textSecondary,
								}}
							>
								{list.tasks.length} zadań
							</Text>
						</View>

						<Text
							style={{
								fontSize: theme.fontSize.base,
								fontWeight: theme.fontWeight.medium,
								color: theme.colors.textPrimary,
								marginBottom: theme.spacing.sm,
							}}
						>
							Udostępnij użytkownikowi
						</Text>

						<Text
							style={{
								fontSize: theme.fontSize.sm,
								color: theme.colors.textSecondary,
								marginBottom: theme.spacing.md,
							}}
						>
							Wprowadź adres email użytkownika, z którym chcesz udostępnić tę listę
						</Text>

						<Input
							label="Email użytkownika"
							value={email}
							onChangeText={setEmail}
							placeholder="user@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							error={emailError}
							required
						/>

						{list.sharedWith.length > 0 && (
							<View style={{ marginTop: theme.spacing.lg }}>
								<Text
									style={{
										fontSize: theme.fontSize.sm,
										fontWeight: theme.fontWeight.medium,
										color: theme.colors.textPrimary,
										marginBottom: theme.spacing.sm,
									}}
								>
									Już udostępniono dla:
								</Text>
								{list.sharedWith.map((userEmail, index) => {
									const key = `shared-${userEmail}-${index}`;
									return (
										<Text
											key={key}
											style={{
												fontSize: theme.fontSize.sm,
												color: theme.colors.textSecondary,
												marginBottom: theme.spacing.xs,
											}}
										>
											• {userEmail}
										</Text>
									);
								})}
							</View>
						)}
					</View>

					<View
						style={{
							flexDirection: 'row',
							gap: theme.spacing.sm,
							padding: theme.spacing.lg,
							borderTopWidth: 1,
							borderTopColor: theme.colors.border,
						}}
					>
						<Button title="Anuluj" variant="outline" onPress={handleClose} style={{ flex: 1 }} />
						<Button
							title="Udostępnij"
							variant="primary"
							leftIcon={<Share size={16} color="#ffffff" />}
							onPress={handleShare}
							loading={loading}
							disabled={!canSubmit}
							style={{ flex: 1 }}
						/>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

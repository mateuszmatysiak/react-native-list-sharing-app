import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useList } from '@/context/ListContext';
import { useTheme } from '@/styles/theme';
import type { AppStackParamList } from '@/types';

type EditListModalProps = NativeStackScreenProps<AppStackParamList, 'EditListModal'>;

export const EditListModal: React.FC<EditListModalProps> = ({ navigation, route }) => {
	const { list } = route.params;
	const [title, setTitle] = useState(list.title);
	const [loading, setLoading] = useState(false);
	const [titleError, setTitleError] = useState('');

	const { updateList } = useList();
	const { theme } = useTheme();

	const handleClose = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const validateTitle = useCallback((value: string) => {
		if (!value.trim()) {
			return 'Nazwa listy jest wymagana';
		}
		if (value.length > 50) {
			return 'Nazwa listy nie może być dłuższa niż 50 znaków';
		}
		return '';
	}, []);

	const handleTitleChange = useCallback(
		(value: string) => {
			setTitle(value);
			setTitleError(validateTitle(value));
		},
		[validateTitle],
	);

	const handleSubmit = useCallback(async () => {
		const error = validateTitle(title);
		if (error) {
			setTitleError(error);
			return;
		}

		if (title.trim() === list.title) {
			navigation.goBack();
			return;
		}

		setLoading(true);
		setTitleError('');

		try {
			const result = await updateList(list.id, { title: title.trim() });

			if (result.success) {
				navigation.goBack();
			} else {
				Alert.alert('Błąd', result.error || 'Nie udało się zaktualizować listy');
			}
		} catch (_error) {
			Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
		} finally {
			setLoading(false);
		}
	}, [title, list.title, list.id, updateList, navigation, validateTitle]);

	const canSubmit = title.trim() && !titleError && !loading;

	return (
		<Modal visible={true} onClose={handleClose} title="Edytuj listę" showCloseButton={true}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					padding: theme.spacing.lg,
				}}
				showsVerticalScrollIndicator={false}
			>
				<Input
					label="Nazwa listy"
					value={title}
					onChangeText={handleTitleChange}
					placeholder="Wprowadź nazwę listy"
					error={titleError}
					required
					maxLength={50}
					style={{ marginBottom: theme.spacing.xl }}
				/>

				<View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
					<Button
						title="Anuluj"
						variant="outline"
						onPress={handleClose}
						style={{ flex: 1 }}
						disabled={loading}
					/>
					<Button
						title="Zapisz"
						onPress={handleSubmit}
						loading={loading}
						disabled={!canSubmit}
						style={{ flex: 1 }}
					/>
				</View>
			</ScrollView>
		</Modal>
	);
};

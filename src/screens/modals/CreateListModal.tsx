import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, X } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useList } from '@/context/ListContext';
import { useTheme } from '@/styles/theme';
import type { AppStackParamList } from '@/types';

type CreateListModalProps = NativeStackScreenProps<AppStackParamList, 'CreateListModal'>;

export const CreateListModal: React.FC<CreateListModalProps> = ({ navigation }) => {
	const [title, setTitle] = useState('');
	const [initialTasks, setInitialTasks] = useState<string[]>(['']);
	const [loading, setLoading] = useState(false);
	const [titleError, setTitleError] = useState('');

	const { createList } = useList();
	const { theme } = useTheme();

	const handleClose = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleAddTask = useCallback(() => {
		setInitialTasks([...initialTasks, '']);
	}, [initialTasks]);

	const handleTaskChange = useCallback(
		(index: number, value: string) => {
			const newTasks = [...initialTasks];
			newTasks[index] = value;
			setInitialTasks(newTasks);
		},
		[initialTasks],
	);

	const handleRemoveTask = useCallback(
		(index: number) => {
			if (initialTasks.length > 1) {
				setInitialTasks(initialTasks.filter((_, i) => i !== index));
			}
		},
		[initialTasks],
	);

	const handleSubmit = useCallback(async () => {
		if (!title.trim()) {
			setTitleError('Nazwa listy jest wymagana');
			return;
		}

		if (title.length > 50) {
			setTitleError('Nazwa listy nie może być dłuższa niż 50 znaków');
			return;
		}

		setTitleError('');
		setLoading(true);

		try {
			const nonEmptyTasks = initialTasks.filter((task) => task.trim());
			const result = await createList({
				title: title.trim(),
				initialTasks: nonEmptyTasks.length > 0 ? nonEmptyTasks : undefined,
			});

			if (result.success) {
				navigation.goBack();
			} else {
				Alert.alert('Błąd', result.error || 'Nie udało się utworzyć listy');
			}
		} catch (_error) {
			Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
		} finally {
			setLoading(false);
		}
	}, [title, initialTasks, createList, navigation]);

	const canSubmit = title.trim() && !loading;

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
							Utwórz nową listę
						</Text>
						<Button
							title=""
							variant="ghost"
							size="sm"
							leftIcon={<X size={20} color={theme.colors.textSecondary} />}
							onPress={handleClose}
						/>
					</View>

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
							onChangeText={setTitle}
							placeholder="Wprowadź nazwę listy"
							error={titleError}
							required
							style={{ marginBottom: theme.spacing.lg }}
						/>

						<Text
							style={{
								fontSize: theme.fontSize.base,
								fontWeight: theme.fontWeight.medium,
								color: theme.colors.textPrimary,
								marginBottom: theme.spacing.sm,
							}}
						>
							Początkowe zadania (opcjonalne)
						</Text>

						{initialTasks.map((task, index) => {
							const key = `task-${index}`;
							return (
								<View
									key={key}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: theme.spacing.sm,
										gap: theme.spacing.sm,
									}}
								>
									<Input
										value={task}
										onChangeText={(value) => handleTaskChange(index, value)}
										placeholder={`Zadanie ${index + 1}`}
										style={{ flex: 1 }}
									/>
									{initialTasks.length > 1 && (
										<Button
											title=""
											variant="ghost"
											size="sm"
											leftIcon={<X size={16} color={theme.colors.error} />}
											onPress={() => handleRemoveTask(index)}
										/>
									)}
								</View>
							);
						})}

						<Button
							title="Dodaj zadanie"
							variant="outline"
							leftIcon={<Plus size={16} color={theme.colors.primary} />}
							onPress={handleAddTask}
							style={{ marginTop: theme.spacing.sm }}
						/>
					</ScrollView>

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
							title="Utwórz listę"
							variant="primary"
							onPress={handleSubmit}
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

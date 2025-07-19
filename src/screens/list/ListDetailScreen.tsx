import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Share2, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Text, type TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/layout/Screen';
import { TaskItem } from '@/components/ui/lists/TaskItem';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useList } from '@/context/ListContext';
import { useTheme } from '@/styles/theme';
import type { AppStackParamList, Task } from '@/types';
import { ScreenErrorBoundary } from '../../components/ui';

type ListDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'ListDetail'>;

// Separate memoized component for the add task input
const AddTaskInput: React.FC<{
	value: string;
	onChangeText: (text: string) => void;
	onSubmit: () => void;
	loading: boolean;
	disabled: boolean;
}> = React.memo(({ value, onChangeText, onSubmit, loading, disabled }) => {
	const { theme } = useTheme();
	const inputRef = useRef<TextInput>(null);

	const handleSubmit = useCallback(() => {
		onSubmit();
		inputRef.current?.focus();
	}, [onSubmit]);

	return (
		<View
			style={{
				flexDirection: 'row',
				gap: theme.spacing.sm,
				height: 52,
			}}
		>
			<Input
				ref={inputRef}
				placeholder="Dodaj nowe zadanie..."
				value={value}
				onChangeText={onChangeText}
				style={{ flex: 1 }}
				size="lg"
				onSubmitEditing={handleSubmit}
				returnKeyType="done"
				blurOnSubmit={false}
			/>
			<Button
				title=""
				variant="primary"
				leftIcon={<Plus size={20} color="#ffffff" />}
				size="lg"
				onPress={handleSubmit}
				loading={loading}
				disabled={disabled}
			/>
		</View>
	);
});

AddTaskInput.displayName = 'AddTaskInput';

export const ListDetailScreenContent: React.FC<ListDetailScreenProps> = ({ navigation, route }) => {
	const { list: initialList } = route.params;
	const [newTaskText, setNewTaskText] = useState('');
	const [isAddingTask, setIsAddingTask] = useState(false);

	const { lists, addTask, updateTask, deleteTask, toggleTask, deleteList } = useList();
	const { theme } = useTheme();

	// Use stable reference to current list to prevent unnecessary re-renders
	const currentList = useMemo(() => {
		const listFromState = lists.find((l) => l.id === initialList.id);
		if (listFromState) {
			return listFromState;
		}

		// Fallback to initial list with calculated statistics
		return {
			...initialList,
			statistics: {
				totalTasks: initialList.tasks.length,
				completedTasks: initialList.tasks.filter((t) => t.completed).length,
				pendingTasks: initialList.tasks.filter((t) => !t.completed).length,
				completionPercentage:
					initialList.tasks.length > 0
						? (initialList.tasks.filter((t) => t.completed).length / initialList.tasks.length) * 100
						: 0,
				lastActivity: initialList.updatedAt || initialList.createdAt,
			},
			isOwner: true,
			isShared: initialList.sharedWith.length > 0,
			canEdit: true,
			canDelete: true,
			canShare: true,
		};
	}, [lists, initialList]);

	const handleGoBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleAddTask = useCallback(async () => {
		if (!newTaskText.trim()) return;

		setIsAddingTask(true);
		try {
			const result = await addTask({
				listId: currentList.id,
				text: newTaskText.trim(),
			});

			if (result.success) {
				setNewTaskText('');
			} else {
				Alert.alert('Błąd', result.error || 'Nie udało się dodać zadania');
			}
		} catch (_error) {
			Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
		} finally {
			setIsAddingTask(false);
		}
	}, [newTaskText, currentList.id, addTask]);

	const handleToggleTask = useCallback(
		async (listId: string, taskId: string) => {
			try {
				const result = await toggleTask(listId, taskId);
				if (!result.success) {
					Alert.alert('Błąd', result.error || 'Nie udało się zmienić statusu zadania');
				}
			} catch (_error) {
				Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
			}
		},
		[toggleTask],
	);

	const handleEditTask = useCallback(
		async (listId: string, taskId: string, newText: string) => {
			if (!newText.trim()) {
				Alert.alert('Błąd', 'Tekst zadania nie może być pusty');
				return;
			}

			try {
				const result = await updateTask(listId, taskId, { text: newText.trim() });
				if (!result.success) {
					Alert.alert('Błąd', result.error || 'Nie udało się zaktualizować zadania');
				}
			} catch (_error) {
				Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
			}
		},
		[updateTask],
	);

	const handleDeleteTask = useCallback(
		async (listId: string, taskId: string) => {
			try {
				const result = await deleteTask(listId, taskId);
				if (!result.success) {
					Alert.alert('Błąd', result.error || 'Nie udało się usunąć zadania');
				}
			} catch (_error) {
				Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
			}
		},
		[deleteTask],
	);

	const handleDeleteList = useCallback(() => {
		Alert.alert(
			'Usuń listę',
			'Czy na pewno chcesz usunąć tę listę? Wszystkie zadania zostaną utracone.',
			[
				{ text: 'Anuluj', style: 'cancel' },
				{
					text: 'Usuń',
					style: 'destructive',
					onPress: async () => {
						try {
							const result = await deleteList(currentList.id);
							if (result.success) {
								navigation.goBack();
							} else {
								Alert.alert('Błąd', result.error || 'Nie udało się usunąć listy');
							}
						} catch (_error) {
							Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
						}
					},
				},
			],
		);
	}, [currentList.id, deleteList, navigation]);

	const handleShareList = useCallback(() => {
		navigation.navigate('ShareModal', { list: currentList });
	}, [navigation, currentList]);

	const renderTaskItem = useCallback(
		({ item }: { item: Task }) => (
			<TaskItem
				task={item}
				listId={currentList.id}
				onToggle={handleToggleTask}
				onEdit={handleEditTask}
				onDelete={handleDeleteTask}
				canEdit={currentList.canEdit}
			/>
		),
		[handleToggleTask, handleEditTask, handleDeleteTask, currentList.canEdit, currentList.id],
	);

	// Memoize the header component to prevent re-renders
	const headerComponent = useMemo(
		() => (
			<View style={{ marginBottom: theme.spacing.lg }}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: theme.spacing.lg,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
						<Button
							title=""
							variant="ghost"
							size="sm"
							leftIcon={<ArrowLeft size={20} color={theme.colors.textPrimary} />}
							onPress={handleGoBack}
							style={{ marginRight: theme.spacing.sm }}
						/>
						<Text
							style={{
								fontSize: theme.fontSize.xl,
								fontWeight: theme.fontWeight.bold,
								color: theme.colors.textPrimary,
								flex: 1,
							}}
							numberOfLines={1}
						>
							{currentList.title}
						</Text>
					</View>

					<View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
						{currentList.canShare && (
							<Button
								title=""
								variant="ghost"
								size="sm"
								leftIcon={<Share2 size={18} color={theme.colors.primary} />}
								onPress={handleShareList}
							/>
						)}
						{currentList.canDelete && (
							<Button
								title=""
								variant="ghost"
								size="sm"
								leftIcon={<Trash2 size={18} color={theme.colors.error} />}
								onPress={handleDeleteList}
							/>
						)}
					</View>
				</View>

				<ProgressBar
					progress={currentList.statistics.completionPercentage}
					color={theme.colors.primary}
					backgroundColor={theme.colors.border}
					height={8}
					style={{ marginBottom: theme.spacing.md }}
				/>

				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						marginBottom: theme.spacing.lg,
					}}
				>
					<Text
						style={{
							fontSize: theme.fontSize.sm,
							color: theme.colors.textSecondary,
						}}
					>
						{currentList.statistics.completedTasks} z {currentList.statistics.totalTasks}{' '}
						ukończonych
					</Text>
					<Text
						style={{
							fontSize: theme.fontSize.sm,
							color: theme.colors.textSecondary,
						}}
					>
						{Math.round(currentList.statistics.completionPercentage)}%
					</Text>
				</View>

				{currentList.canEdit && (
					<AddTaskInput
						value={newTaskText}
						onChangeText={setNewTaskText}
						onSubmit={handleAddTask}
						loading={isAddingTask}
						disabled={!newTaskText.trim() || isAddingTask}
					/>
				)}
			</View>
		),
		[
			theme,
			currentList,
			handleGoBack,
			handleShareList,
			handleDeleteList,
			newTaskText,
			handleAddTask,
			isAddingTask,
		],
	);

	const renderEmptyState = useCallback(
		() => (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					paddingVertical: theme.spacing.xxl,
				}}
			>
				<Text
					style={{
						fontSize: theme.fontSize.lg,
						fontWeight: theme.fontWeight.medium,
						color: theme.colors.textSecondary,
						textAlign: 'center',
						marginBottom: theme.spacing.md,
					}}
				>
					Brak zadań w tej liście
				</Text>
				<Text
					style={{
						fontSize: theme.fontSize.sm,
						color: theme.colors.textSecondary,
						textAlign: 'center',
					}}
				>
					{currentList.canEdit
						? 'Dodaj swoje pierwsze zadanie, aby rozpocząć'
						: 'Właściciel nie dodał jeszcze żadnych zadań'}
				</Text>
			</View>
		),
		[theme, currentList.canEdit],
	);

	return (
		<Screen scrollable={false}>
			<FlatList
				data={currentList.tasks}
				renderItem={renderTaskItem}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={headerComponent}
				ListEmptyComponent={renderEmptyState}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: theme.spacing.xxl,
				}}
			/>
		</Screen>
	);
};

export const ListDetailScreen: React.FC<ListDetailScreenProps> = (props) => {
	return (
		<ScreenErrorBoundary>
			<ListDetailScreenContent {...props} />
		</ScreenErrorBoundary>
	);
};

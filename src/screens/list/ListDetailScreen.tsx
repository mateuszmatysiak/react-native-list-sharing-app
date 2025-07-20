import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Edit3, MoreVertical, Plus, Share, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Text, type TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/layout/Screen';
import { TaskItem } from '@/components/ui/lists/TaskItem';
import { Modal } from '@/components/ui/Modal';
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

// Separate memoized component for list title with context menu
const ListTitleWithMenu: React.FC<{
	title: string;
	canEdit: boolean;
	canShare: boolean;
	canDelete: boolean;
	onContextMenuToggle: (show: boolean, position?: { x: number; y: number }) => void;
}> = React.memo(({ title, canEdit, canShare, canDelete, onContextMenuToggle }) => {
	const { theme } = useTheme();

	const handleToggleContextMenu = useCallback(() => {
		onContextMenuToggle(true, { x: 24, y: 12 });
	}, [onContextMenuToggle]);

	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
			<Text
				style={{
					fontSize: theme.fontSize.xl,
					fontWeight: theme.fontWeight.bold,
					color: theme.colors.textPrimary,
					flex: 1,
				}}
				numberOfLines={1}
			>
				{title}
			</Text>
			{(canEdit || canShare || canDelete) && (
				<View>
					<Button
						title=""
						variant="ghost"
						size="sm"
						leftIcon={<MoreVertical size={16} color={theme.colors.textSecondary} />}
						onPress={handleToggleContextMenu}
						style={{ marginLeft: theme.spacing.sm }}
					/>
				</View>
			)}
		</View>
	);
});

ListTitleWithMenu.displayName = 'ListTitleWithMenu';

// Floating context menu component
const FloatingContextMenu: React.FC<{
	visible: boolean;
	position: { x: number; y: number } | null;
	canEdit: boolean;
	canShare: boolean;
	canDelete: boolean;
	onShare: () => void;
	onDelete: () => void;
	onEdit: () => void;
	onClose: () => void;
}> = React.memo(
	({ visible, position, canEdit, canShare, canDelete, onShare, onDelete, onEdit, onClose }) => {
		const { theme } = useTheme();

		if (!visible || !position) return null;

		return (
			<>
				{/* Backdrop to close menu when tapping outside */}
				<TouchableOpacity
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 9998,
					}}
					onPress={onClose}
					activeOpacity={0}
				/>
				{/* Context menu */}
				<View
					style={{
						position: 'absolute',
						top: position.y,
						right: position.x,
						backgroundColor: theme.colors.surface,
						borderRadius: theme.borderRadius.md,
						borderWidth: 1,
						borderColor: theme.colors.border,
						shadowColor: theme.colors.shadow,
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 4,
						elevation: 3,
						zIndex: 9999,
						minWidth: 160,
						paddingVertical: theme.spacing.xs,
					}}
				>
					{canEdit && (
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: theme.spacing.lg,
								paddingVertical: theme.spacing.md,
								borderBottomWidth: canShare || canDelete ? 1 : 0,
								borderBottomColor: theme.colors.border,
							}}
							onPress={onEdit}
						>
							<Edit3 size={16} color={theme.colors.textSecondary} />
							<Text
								style={{
									marginLeft: theme.spacing.md,
									fontSize: theme.fontSize.base,
									color: theme.colors.textSecondary,
									fontWeight: theme.fontWeight.medium,
								}}
							>
								Edytuj nazwę
							</Text>
						</TouchableOpacity>
					)}
					{canShare && (
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: theme.spacing.lg,
								paddingVertical: theme.spacing.md,
								borderBottomWidth: canDelete ? 1 : 0,
								borderBottomColor: theme.colors.border,
							}}
							onPress={onShare}
						>
							<Share size={16} color={theme.colors.primary} />
							<Text
								style={{
									marginLeft: theme.spacing.md,
									fontSize: theme.fontSize.base,
									color: theme.colors.primary,
									fontWeight: theme.fontWeight.medium,
								}}
							>
								Udostępnij
							</Text>
						</TouchableOpacity>
					)}
					{canDelete && (
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: theme.spacing.lg,
								paddingVertical: theme.spacing.md,
							}}
							onPress={onDelete}
						>
							<Trash2 size={16} color={theme.colors.error} />
							<Text
								style={{
									marginLeft: theme.spacing.md,
									fontSize: theme.fontSize.base,
									color: theme.colors.error,
									fontWeight: theme.fontWeight.medium,
								}}
							>
								Usuń listę
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</>
		);
	},
);

FloatingContextMenu.displayName = 'FloatingContextMenu';

// Inline edit modal component
const EditTitleModal: React.FC<{
	visible: boolean;
	title: string;
	onClose: () => void;
	onSave: (newTitle: string) => Promise<void>;
}> = React.memo(({ visible, title, onClose, onSave }) => {
	const { theme } = useTheme();
	const [editTitle, setEditTitle] = useState(title);
	const [loading, setLoading] = useState(false);
	const [titleError, setTitleError] = useState('');

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
			setEditTitle(value);
			setTitleError(validateTitle(value));
		},
		[validateTitle],
	);

	const handleSubmit = useCallback(async () => {
		const error = validateTitle(editTitle);
		if (error) {
			setTitleError(error);
			return;
		}

		if (editTitle.trim() === title) {
			onClose();
			return;
		}

		setLoading(true);
		setTitleError('');

		try {
			await onSave(editTitle.trim());
			onClose();
		} catch (_error) {
			// Error is handled by the parent component
		} finally {
			setLoading(false);
		}
	}, [editTitle, title, onSave, onClose, validateTitle]);

	const canSubmit = editTitle.trim() && !titleError && !loading;

	// Reset form when modal opens/closes
	React.useEffect(() => {
		if (visible) {
			setEditTitle(title);
			setTitleError('');
			setLoading(false);
		}
	}, [visible, title]);

	return (
		<Modal visible={visible} onClose={onClose} title="Edytuj nazwę listy" showCloseButton={true}>
			<View style={{ padding: theme.spacing.lg }}>
				<Input
					label="Nazwa listy"
					value={editTitle}
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
						onPress={onClose}
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
			</View>
		</Modal>
	);
});

EditTitleModal.displayName = 'EditTitleModal';

export const ListDetailScreenContent: React.FC<ListDetailScreenProps> = ({ navigation, route }) => {
	const { list: initialList } = route.params;
	const [newTaskText, setNewTaskText] = useState('');
	const [isAddingTask, setIsAddingTask] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showContextMenu, setShowContextMenu] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
		null,
	);

	const { lists, addTask, updateTask, deleteTask, toggleTask, deleteList, updateList } = useList();
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
			canEditTitle: true,
		};
	}, [lists, initialList]);

	const handleGoBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleTitleChange = useCallback(
		async (newTitle: string) => {
			try {
				const result = await updateList(currentList.id, { title: newTitle });
				if (!result.success) {
					Alert.alert('Błąd', result.error || 'Nie udało się zaktualizować nazwy listy');
					throw new Error(result.error);
				}
			} catch (_error) {
				Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
				throw _error;
			}
		},
		[currentList.id, updateList],
	);

	const handleEditTitle = useCallback(() => {
		setShowEditModal(true);
	}, []);

	const handleCloseEditModal = useCallback(() => {
		setShowEditModal(false);
	}, []);

	const handleContextMenuToggle = useCallback(
		(show: boolean, position?: { x: number; y: number }) => {
			setShowContextMenu(show);
			if (show && position) {
				setContextMenuPosition(position);
			} else {
				setContextMenuPosition(null);
			}
		},
		[],
	);

	const handleCloseContextMenu = useCallback(() => {
		setShowContextMenu(false);
		setContextMenuPosition(null);
	}, []);

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
						<ListTitleWithMenu
							title={currentList.title}
							canEdit={currentList.canEditTitle}
							canShare={currentList.canShare}
							canDelete={currentList.canDelete}
							onContextMenuToggle={handleContextMenuToggle}
						/>
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
			handleContextMenuToggle,
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
			<EditTitleModal
				visible={showEditModal}
				title={currentList.title}
				onClose={handleCloseEditModal}
				onSave={handleTitleChange}
			/>
			<FloatingContextMenu
				visible={showContextMenu}
				position={contextMenuPosition}
				canEdit={currentList.canEditTitle}
				canShare={currentList.canShare}
				canDelete={currentList.canDelete}
				onShare={handleShareList}
				onDelete={handleDeleteList}
				onEdit={handleEditTitle}
				onClose={handleCloseContextMenu}
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

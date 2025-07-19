import { Check, Edit3, MoreVertical, Trash2 } from 'lucide-react-native';
import type React from 'react';
import { useRef, useState } from 'react';
import {
	Alert,
	type NativeSyntheticEvent,
	Text,
	TextInput,
	type TextInputKeyPressEventData,
	TouchableOpacity,
	View,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/styles/theme';
import type { Task } from '@/types';

export interface TaskItemProps {
	task: Task;
	listId: string;
	onToggle: (listId: string, taskId: string) => void;
	onDelete?: (listId: string, taskId: string) => void;
	onEdit?: (listId: string, taskId: string, newText: string) => void;
	canEdit?: boolean;
	testID?: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
	task,
	listId,
	onToggle,
	onDelete,
	onEdit,
	canEdit = true,
	testID,
}) => {
	const { theme } = useTheme();
	const [showActions, setShowActions] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(task.text);
	const inputRef = useRef<TextInput>(null);

	const handleToggle = () => {
		onToggle(listId, task.id);
	};

	const handleDelete = () => {
		Alert.alert('Usuń zadanie', 'Czy na pewno chcesz usunąć to zadanie?', [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Usuń',
				style: 'destructive',
				onPress: () => onDelete?.(listId, task.id),
			},
		]);
	};

	const handleStartEdit = () => {
		setIsEditing(true);
		setEditText(task.text);
		setShowActions(false);
		// Focus the input after the state update
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const handleSaveEdit = () => {
		if (editText.trim() && editText.trim() !== task.text) {
			onEdit?.(listId, task.id, editText.trim());
		}
		setIsEditing(false);
		setEditText(task.text);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditText(task.text);
	};

	const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
		if (e.nativeEvent.key === 'Enter') {
			handleSaveEdit();
		}
	};

	const getTaskStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		paddingVertical: theme.spacing.sm,
		opacity: task.completed ? 0.7 : 1,
	});

	const getCheckboxStyle = () => ({
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: task.completed ? theme.colors.success : theme.colors.border,
		backgroundColor: task.completed ? theme.colors.success : 'transparent',
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		marginRight: theme.spacing.md,
	});

	const getTextStyle = () => ({
		flex: 1,
		fontSize: theme.fontSize.base,
		color: task.completed ? theme.colors.textSecondary : theme.colors.textPrimary,
		textDecorationLine: task.completed ? ('line-through' as const) : ('none' as const),
	});

	const getEditInputStyle = () => ({
		flex: 1,
		fontSize: theme.fontSize.base,
		color: theme.colors.textPrimary,
		borderWidth: 1,
		borderColor: theme.colors.primary,
		borderRadius: theme.borderRadius.sm,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
		backgroundColor: theme.colors.surface,
	});

	const getTimestampStyle = () => ({
		fontSize: theme.fontSize.xs,
		color: theme.colors.textDisabled,
		marginTop: theme.spacing.xs,
	});

	const formatTimestamp = (timestamp: string | undefined) => {
		if (!timestamp) return '';

		const date = new Date(timestamp);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Teraz';
		if (diffInMinutes < 60) return `${diffInMinutes} min temu`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} godz. temu`;

		return date.toLocaleDateString('pl-PL', {
			day: 'numeric',
			month: 'short',
		});
	};

	return (
		<Card padding="md" style={{ marginBottom: theme.spacing.sm }} testID={testID}>
			<View style={getTaskStyle()}>
				<TouchableOpacity
					style={getCheckboxStyle()}
					onPress={handleToggle}
					accessibilityLabel={task.completed ? 'Oznacz jako nieukończone' : 'Oznacz jako ukończone'}
					accessibilityRole="checkbox"
					accessibilityState={{ checked: task.completed }}
				>
					{task.completed && <Check size={14} color="#ffffff" />}
				</TouchableOpacity>

				<View style={{ flex: 1 }}>
					{isEditing ? (
						<TextInput
							ref={inputRef}
							style={getEditInputStyle()}
							value={editText}
							onChangeText={setEditText}
							onBlur={handleSaveEdit}
							onKeyPress={handleKeyPress}
							multiline
							autoFocus
							selectTextOnFocus
							blurOnSubmit
							returnKeyType="done"
						/>
					) : (
						<Text style={getTextStyle()}>{task.text}</Text>
					)}

					{task.completedAt && (
						<Text style={getTimestampStyle()}>Ukończono: {formatTimestamp(task.completedAt)}</Text>
					)}
				</View>

				{canEdit && (onEdit || onDelete) && !isEditing && (
					<TouchableOpacity
						style={{
							padding: theme.spacing.sm,
							marginLeft: theme.spacing.sm,
						}}
						onPress={() => setShowActions(!showActions)}
						accessibilityLabel="Opcje zadania"
					>
						<MoreVertical size={16} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				)}

				{isEditing && (
					<View style={{ flexDirection: 'row', marginLeft: theme.spacing.sm }}>
						<TouchableOpacity
							style={{
								paddingHorizontal: theme.spacing.sm,
								paddingVertical: theme.spacing.xs,
								marginRight: theme.spacing.xs,
							}}
							onPress={handleSaveEdit}
						>
							<Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.sm }}>
								Zapisz
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={{
								paddingHorizontal: theme.spacing.sm,
								paddingVertical: theme.spacing.xs,
							}}
							onPress={handleCancelEdit}
						>
							<Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
								Anuluj
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{showActions && canEdit && !isEditing && (
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'flex-end',
						paddingTop: theme.spacing.sm,
						borderTopWidth: 1,
						borderTopColor: theme.colors.border,
						marginTop: theme.spacing.sm,
					}}
				>
					{onEdit && (
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: theme.spacing.md,
								paddingVertical: theme.spacing.sm,
								marginRight: theme.spacing.sm,
							}}
							onPress={handleStartEdit}
						>
							<Edit3 size={14} color={theme.colors.textSecondary} />
							<Text
								style={{
									marginLeft: theme.spacing.xs,
									fontSize: theme.fontSize.sm,
									color: theme.colors.textSecondary,
								}}
							>
								Edytuj
							</Text>
						</TouchableOpacity>
					)}

					{onDelete && (
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: theme.spacing.md,
								paddingVertical: theme.spacing.sm,
							}}
							onPress={handleDelete}
						>
							<Trash2 size={14} color={theme.colors.error} />
							<Text
								style={{
									marginLeft: theme.spacing.xs,
									fontSize: theme.fontSize.sm,
									color: theme.colors.error,
								}}
							>
								Usuń
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
		</Card>
	);
};

TaskItem.displayName = 'TaskItem';

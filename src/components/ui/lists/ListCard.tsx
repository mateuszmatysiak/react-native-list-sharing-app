import { Clock, Share, Trash2, Users } from 'lucide-react-native';
import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/styles/theme';
import type { ListWithStats } from '@/types/lists';

export interface ListCardProps {
	list: ListWithStats;
	onPress: (list: ListWithStats) => void;
	onShare?: (list: ListWithStats) => void;
	onDelete?: (listId: string) => void;
	testID?: string;
}

export const ListCard: React.FC<ListCardProps> = ({ list, onPress, onShare, onDelete, testID }) => {
	const { theme } = useTheme();

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) return 'Dziś';
		if (diffInDays === 1) return 'Wczoraj';
		if (diffInDays < 7) return `${diffInDays} dni temu`;

		return date.toLocaleDateString('pl-PL', {
			day: 'numeric',
			month: 'short',
		});
	};

	const getHeaderStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'flex-start' as const,
		justifyContent: 'space-between' as const,
		marginBottom: theme.spacing.md,
	});

	const getTitleStyle = () => ({
		fontSize: theme.fontSize.lg,
		fontWeight: theme.fontWeight.semibold,
		color: theme.colors.textPrimary,
		flex: 1,
		marginRight: theme.spacing.sm,
	});

	const getMetadataStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		marginBottom: theme.spacing.sm,
	});

	const getMetadataTextStyle = () => ({
		fontSize: theme.fontSize.sm,
		color: theme.colors.textSecondary,
		marginLeft: theme.spacing.xs,
	});

	const getStatsStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		justifyContent: 'space-between' as const,
		marginBottom: theme.spacing.sm,
	});

	const getStatsTextStyle = () => ({
		fontSize: theme.fontSize.sm,
		color: theme.colors.textSecondary,
	});

	const getActionsStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: theme.spacing.sm,
	});

	const getActionButtonStyle = () => ({
		padding: theme.spacing.sm,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.background,
	});

	const getBadgeStyle = () => ({
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
		borderRadius: theme.borderRadius.md,
		backgroundColor: list.isOwner ? `${theme.colors.primary}20` : `${theme.colors.secondary}20`,
	});

	const getBadgeTextStyle = () => ({
		fontSize: theme.fontSize.xs,
		color: list.isOwner ? theme.colors.primary : theme.colors.secondary,
		fontWeight: theme.fontWeight.medium,
	});

	return (
		<Card padding="lg" style={{ marginBottom: theme.spacing.md }} testID={testID}>
			<TouchableOpacity
				onPress={() => onPress(list)}
				accessibilityLabel={`Otwórz listę ${list.title}`}
				accessibilityRole="button"
			>
				<View style={getHeaderStyle()}>
					<Text style={getTitleStyle()}>{list.title}</Text>

					<View style={getBadgeStyle()}>
						<Text style={getBadgeTextStyle()}>{list.isOwner ? 'Właściciel' : 'Udostępniona'}</Text>
					</View>
				</View>

				<View style={getMetadataStyle()}>
					<Clock size={14} color={theme.colors.textSecondary} />
					<Text style={getMetadataTextStyle()}>{formatDate(list.statistics.lastActivity)}</Text>

					{list.isShared && (
						<>
							<Users
								size={14}
								color={theme.colors.textSecondary}
								style={{ marginLeft: theme.spacing.md }}
							/>
							<Text style={getMetadataTextStyle()}>{list.sharedWith.length + 1} osób</Text>
						</>
					)}
				</View>

				<View style={getStatsStyle()}>
					<Text style={getStatsTextStyle()}>
						{list.statistics.completedTasks}/{list.statistics.totalTasks} ukończone
					</Text>
					<Text style={[getStatsTextStyle(), { fontWeight: theme.fontWeight.semibold }]}>
						{Math.round(list.statistics.completionPercentage)}%
					</Text>
				</View>

				<ProgressBar
					progress={list.statistics.completionPercentage}
					height={6}
					style={{ marginBottom: theme.spacing.md }}
				/>
			</TouchableOpacity>

			<View style={getActionsStyle()}>
				{list.canShare && onShare && (
					<TouchableOpacity
						style={getActionButtonStyle()}
						onPress={() => onShare(list)}
						accessibilityLabel="Udostępnij listę"
					>
						<Share size={16} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				)}

				{list.canDelete && onDelete && (
					<TouchableOpacity
						style={getActionButtonStyle()}
						onPress={() => onDelete(list.id)}
						accessibilityLabel="Usuń listę"
					>
						<Trash2 size={16} color={theme.colors.error} />
					</TouchableOpacity>
				)}
			</View>
		</Card>
	);
};

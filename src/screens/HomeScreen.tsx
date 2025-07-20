import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut, Plus, Search } from 'lucide-react-native';
import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { ScreenErrorBoundary } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { FAB } from '@/components/ui/FAB';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/layout/Screen';
import { ListCard } from '@/components/ui/lists/ListCard';
import { useAuth } from '@/context/AuthContext';
import { useList } from '@/context/ListContext';
import { useTheme } from '@/styles/theme';
import type { AppStackParamList } from '@/types';
import type { ListWithStats } from '@/types/lists';

type HomeScreenProps = NativeStackScreenProps<AppStackParamList, 'Home'>;

// Fully isolated search component with internal state management
const SearchHeader = memo(
	({
		onSearch,
		onLogout,
		userName,
	}: {
		onSearch: (term: string) => void;
		onLogout: () => void;
		userName: string | undefined;
	}) => {
		const { theme } = useTheme();
		const [localSearchTerm, setLocalSearchTerm] = useState('');
		const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		// Handle local search term changes with debouncing
		const handleLocalSearch = useCallback(
			(term: string) => {
				setLocalSearchTerm(term);

				// Clear existing timeout
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
				}

				// Set new timeout for debounced search
				debounceRef.current = setTimeout(() => {
					onSearch(term);
				}, 300);
			},
			[onSearch],
		);

		// Cleanup timeout on unmount
		useEffect(() => {
			return () => {
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
				}
			};
		}, []);

		return (
			<View style={{ marginBottom: theme.spacing.lg }}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: theme.spacing.lg,
					}}
				>
					<View>
						<Text
							style={{
								fontSize: theme.fontSize.xxxl,
								fontWeight: theme.fontWeight.bold,
								color: theme.colors.textPrimary,
							}}
						>
							Moje Listy
						</Text>
						<Text
							style={{
								fontSize: theme.fontSize.sm,
								color: theme.colors.textSecondary,
								marginTop: theme.spacing.xs,
							}}
						>
							Witaj, {userName}!
						</Text>
					</View>

					<Button
						title=""
						variant="ghost"
						size="sm"
						leftIcon={<LogOut size={20} color={theme.colors.error} />}
						onPress={onLogout}
					/>
				</View>

				<Input
					placeholder="Szukaj list..."
					value={localSearchTerm}
					onChangeText={handleLocalSearch}
					leftIcon={<Search size={20} color={theme.colors.textSecondary} />}
				/>
			</View>
		);
	},
);

SearchHeader.displayName = 'SearchHeader';

const HomeScreenContent: React.FC<HomeScreenProps> = ({ navigation }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const { signOut, user } = useAuth();
	const { lists, loading, error, refreshLists, setFilter } = useList();
	const { theme } = useTheme();

	const handleLogout = useCallback(() => {
		Alert.alert('Wyloguj się', 'Czy na pewno chcesz się wylogować?', [
			{ text: 'Anuluj', style: 'cancel' },
			{ text: 'Wyloguj', style: 'destructive', onPress: signOut },
		]);
	}, [signOut]);

	const handleSearch = useCallback(
		(term: string) => {
			setSearchTerm(term);
			setFilter({ searchTerm: term });
		},
		[setFilter],
	);

	const handleListPress = useCallback(
		(list: ListWithStats) => {
			navigation.navigate('ListDetail', { list });
		},
		[navigation],
	);

	const handleCreateList = useCallback(() => {
		navigation.navigate('CreateListModal');
	}, [navigation]);

	const handleShareList = useCallback(
		(list: ListWithStats) => {
			navigation.navigate('ShareModal', { list });
		},
		[navigation],
	);

	const handleEditList = useCallback(
		(list: ListWithStats) => {
			navigation.navigate('EditListModal', { list });
		},
		[navigation],
	);

	const renderListItem = useCallback(
		({ item }: { item: ListWithStats }) => (
			<ListCard
				list={item}
				onPress={() => handleListPress(item)}
				onShare={() => handleShareList(item)}
				onEdit={() => handleEditList(item)}
			/>
		),
		[handleListPress, handleShareList, handleEditList],
	);

	const renderHeader = useCallback(
		() => <SearchHeader onSearch={handleSearch} onLogout={handleLogout} userName={user?.name} />,
		[handleSearch, handleLogout, user?.name],
	);

	const renderEmptyState = () => (
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
				{searchTerm ? 'Nie znaleziono list' : 'Brak list do wyświetlenia'}
			</Text>
			<Text
				style={{
					fontSize: theme.fontSize.sm,
					color: theme.colors.textSecondary,
					textAlign: 'center',
					marginBottom: theme.spacing.xl,
				}}
			>
				{searchTerm
					? 'Spróbuj zmienić wyszukiwane hasło'
					: 'Utwórz swoją pierwszą listę, aby rozpocząć'}
			</Text>
			{!searchTerm && (
				<Button
					title="Utwórz listę"
					onPress={handleCreateList}
					leftIcon={<Plus size={20} color="#ffffff" />}
				/>
			)}
		</View>
	);

	if (error) {
		return (
			<Screen>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Text
						style={{
							fontSize: theme.fontSize.lg,
							color: theme.colors.error,
							textAlign: 'center',
							marginBottom: theme.spacing.lg,
						}}
					>
						{error}
					</Text>
					<Button title="Spróbuj ponownie" onPress={refreshLists} />
				</View>
			</Screen>
		);
	}

	return (
		<Screen scrollable={false}>
			<FlatList
				data={lists}
				renderItem={renderListItem}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={renderEmptyState}
				refreshing={loading}
				onRefresh={refreshLists}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: theme.spacing.xxl,
				}}
			/>

			<FAB
				icon={<Plus size={24} color="#ffffff" />}
				onPress={handleCreateList}
				position="bottom-right"
			/>
		</Screen>
	);
};

export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
	return (
		<ScreenErrorBoundary>
			<HomeScreenContent {...props} />
		</ScreenErrorBoundary>
	);
};

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CriticalErrorBoundary } from '@/components/ui';
import { AuthProvider } from '@/context/AuthContext';
import { ListProvider } from '@/context/ListContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/styles/theme';

export default function App() {
	return (
		<CriticalErrorBoundary>
			<SafeAreaProvider>
				<ThemeProvider>
					<AuthProvider>
						<ListProvider>
							<View style={styles.container}>
								<StatusBar style="auto" />
								<RootNavigator />
							</View>
						</ListProvider>
					</AuthProvider>
				</ThemeProvider>
			</SafeAreaProvider>
		</CriticalErrorBoundary>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

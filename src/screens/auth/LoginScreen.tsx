import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogIn } from 'lucide-react-native';
import type React from 'react';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/layout/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/styles/theme';
import type { AuthStackParamList } from '@/types';
import { validationSchemas } from '@/utils/validation';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	const { signIn } = useAuth();
	const { theme } = useTheme();

	const validateAndSubmit = async () => {
		const validation = validationSchemas.login({ email, password });

		if (!validation.isValid) {
			setErrors(validation.errors as Record<string, string>);
			return;
		}

		setErrors({});
		setLoading(true);

		try {
			const result = await signIn(email, password);
			if (!result.success) {
				Alert.alert('Błąd logowania', result.error || 'Nieznany błąd');
			}
		} catch (_error) {
			Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd');
		} finally {
			setLoading(false);
		}
	};

	const getTitleStyle = () => ({
		fontSize: theme.fontSize.xxxl,
		fontWeight: theme.fontWeight.bold,
		color: theme.colors.textPrimary,
		textAlign: 'center' as const,
		marginBottom: theme.spacing.xl,
	});

	return (
		<Screen scrollable>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					paddingVertical: theme.spacing.xl,
				}}
			>
				<Card padding="xl">
					<Text style={getTitleStyle()}>Zaloguj się</Text>

					<Input
						label="Email"
						value={email}
						onChangeText={setEmail}
						placeholder="wprowadź email"
						keyboardType="email-address"
						autoCapitalize="none"
						error={errors.email}
						required
					/>

					<Input
						label="Hasło"
						value={password}
						onChangeText={setPassword}
						placeholder="wprowadź hasło"
						secureTextEntry
						error={errors.password}
						required
					/>

					<Button
						title="Zaloguj się"
						onPress={validateAndSubmit}
						loading={loading}
						disabled={loading}
						fullWidth
						leftIcon={<LogIn size={20} color="#ffffff" />}
						style={{ marginBottom: theme.spacing.md }}
					/>

					<Button
						title="Nie masz konta? Zarejestruj się"
						onPress={() => navigation.navigate('Register')}
						variant="ghost"
						fullWidth
					/>
				</Card>
			</View>
		</Screen>
	);
};

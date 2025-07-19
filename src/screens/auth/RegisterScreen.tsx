import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserPlus } from 'lucide-react-native';
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

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	const { signUp } = useAuth();
	const { theme } = useTheme();

	const validateAndSubmit = async () => {
		const validation = validationSchemas.register({ name, email, password, confirmPassword });

		if (!validation.isValid) {
			setErrors(validation.errors as Record<string, string>);
			return;
		}

		setErrors({});
		setLoading(true);

		try {
			const result = await signUp(name, email, password);
			if (!result.success) {
				Alert.alert('Błąd rejestracji', result.error || 'Nieznany błąd');
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
					<Text style={getTitleStyle()}>Zarejestruj się</Text>

					<Input
						label="Imię"
						value={name}
						onChangeText={setName}
						placeholder="wprowadź imię"
						autoCapitalize="words"
						error={errors.name}
						required
					/>

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

					<Input
						label="Potwierdź hasło"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						placeholder="powtórz hasło"
						secureTextEntry
						error={errors.confirmPassword}
						required
					/>

					<Button
						title="Zarejestruj się"
						onPress={validateAndSubmit}
						loading={loading}
						disabled={loading}
						fullWidth
						leftIcon={<UserPlus size={20} color="#ffffff" />}
						style={{ marginBottom: theme.spacing.md }}
					/>

					<Button
						title="Masz już konto? Zaloguj się"
						onPress={() => navigation.navigate('Login')}
						variant="ghost"
						fullWidth
					/>
				</Card>
			</View>
		</Screen>
	);
};

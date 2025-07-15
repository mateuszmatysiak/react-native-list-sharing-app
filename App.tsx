import type React from 'react';
import { Text, View } from 'react-native';

const App: React.FC = () => {
	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
			<Text style={{ fontSize: 24, fontWeight: 'bold' }}>Lista App</Text>
		</View>
	);
};

export default App;

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type React from 'react';
import { HomeScreen } from '@/screens/HomeScreen';
import { ListDetailScreen } from '@/screens/list/ListDetailScreen';
import { CreateListModal } from '@/screens/modals/CreateListModal';
import { EditListModal } from '@/screens/modals/EditListModal';
import { ShareModal } from '@/screens/modals/ShareModal';
import type { AppStackParamList } from '@/types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
	return (
		<Stack.Navigator
			initialRouteName="Home"
			screenOptions={{
				headerShown: false,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen name="Home" component={HomeScreen} />
			<Stack.Screen name="ListDetail" component={ListDetailScreen} />
			<Stack.Screen
				name="CreateListModal"
				component={CreateListModal}
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="EditListModal"
				component={EditListModal}
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="ShareModal"
				component={ShareModal}
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
		</Stack.Navigator>
	);
};

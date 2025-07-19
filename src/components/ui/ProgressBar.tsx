import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '@/styles/theme';
import type { ProgressBarProps } from '@/types/ui';

export const ProgressBar: React.FC<ProgressBarProps> = ({
	progress,
	color,
	backgroundColor,
	height = 8,
	showPercentage = false,
	animated = true,
	style,
	testID,
}) => {
	const { theme } = useTheme();
	const animatedWidth = useRef(new Animated.Value(0)).current;

	const clampedProgress = Math.max(0, Math.min(100, progress));
	const progressColor = color || theme.colors.primary;
	const bgColor = backgroundColor || theme.colors.border;

	useEffect(() => {
		if (animated) {
			Animated.timing(animatedWidth, {
				toValue: clampedProgress,
				duration: 300,
				useNativeDriver: false,
			}).start();
		} else {
			animatedWidth.setValue(clampedProgress);
		}
	}, [clampedProgress, animated, animatedWidth]);

	const getContainerStyle = () => ({
		marginBottom: showPercentage ? theme.spacing.sm : 0,
	});

	const getTrackStyle = () => ({
		height,
		backgroundColor: bgColor,
		borderRadius: height / 2,
		overflow: 'hidden' as const,
	});

	const getProgressStyle = () => ({
		height: height,
		backgroundColor: progressColor,
		borderRadius: height / 2,
	});

	const getPercentageStyle = () => ({
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.medium,
		color: theme.colors.textSecondary,
		textAlign: 'right' as const,
		marginTop: theme.spacing.xs,
	});

	return (
		<View style={[getContainerStyle(), style]} testID={testID}>
			<View style={getTrackStyle()}>
				<Animated.View
					style={[
						getProgressStyle(),
						{
							width: animatedWidth.interpolate({
								inputRange: [0, 100],
								outputRange: ['0%', '100%'],
								extrapolate: 'clamp',
							}),
						},
					]}
				/>
			</View>

			{showPercentage && <Text style={getPercentageStyle()}>{Math.round(clampedProgress)}%</Text>}
		</View>
	);
};

ProgressBar.displayName = 'ProgressBar';

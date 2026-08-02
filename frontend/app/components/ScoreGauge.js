import React from "react";
import { useEffect } from "react";
import { Dimensions, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { colors } from "../theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getGaugeColor(score) {
  if (score < 40) {
    return colors.critical;
  }

  if (score < 70) {
    return colors.caution;
  }

  return colors.positive;
}

export default function ScoreGauge({ label, score }) {
  const progress = useSharedValue(0);
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const color = getGaugeColor(normalizedScore);

  useEffect(() => {
    progress.value = withTiming(normalizedScore / 100, { duration: 900 });
  }, [normalizedScore, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value)
  }));

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 }}>
      <Text style={{ color: colors.heading, fontSize: 16, fontFamily: "Inter_500Medium" }}>{label}</Text>
      <View style={{ marginTop: 14, alignItems: "center", justifyContent: "center" }}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle cx="70" cy="70" r={radius} stroke={colors.border} strokeWidth="12" fill="none" />
          <AnimatedCircle
            cx="70"
            cy="70"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </Svg>
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text style={{ color: colors.heading, fontSize: 34, fontFamily: "Inter_500Medium" }}>{normalizedScore}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>out of 100</Text>
        </View>
      </View>
    </View>
  );
}

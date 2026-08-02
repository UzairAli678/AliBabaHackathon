import React from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { colors } from "../../theme/colors";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const features = [
  {
    title: "Smart Care Navigator",
    subtitle: "Find the right next step with confidence.",
    icon: Feather,
    iconName: "navigation",
    tint: colors.tealSoft
  },
  {
    title: "Cost Intelligence",
    subtitle: "See price clarity before you decide.",
    icon: Feather,
    iconName: "dollar-sign",
    tint: colors.amberSoft
  },
  {
    title: "Appointments",
    subtitle: "Keep every visit organized in one place.",
    icon: Feather,
    iconName: "calendar",
    tint: colors.mintSoft
  },
  {
    title: "Health Roadmap",
    subtitle: "Track your care plan over time.",
    icon: Feather,
    iconName: "map",
    tint: colors.slateSoft
  }
];

function FeatureCard({ item, delay }) {
  const Icon = item.icon;

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)} style={{ flex: 1 }}>
      <Pressable style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: item.tint,
            borderRadius: 20,
            padding: 18,
            minHeight: 138,
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: colors.border
          }}
        >
          <View style={{ alignSelf: "flex-start", backgroundColor: colors.card, borderRadius: 14, padding: 10 }}>
            <Icon name={item.iconName} size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.heading, fontSize: 15, fontFamily: "Inter_500Medium" }}>{item.title}</Text>
            <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}>{item.subtitle}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AssessmentScreen() {
  const scrollY = useSharedValue(0);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1, false);
  }, [pulse]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  const headerStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 16], [0, 0.1]),
    elevation: interpolate(scrollY.value, [0, 16], [0, 5])
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 1])
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 110,
            backgroundColor: colors.background,
            zIndex: 10,
            shadowColor: "#0f172a",
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 }
          },
          headerStyle
        ]}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.primary, fontSize: 16, fontFamily: "Inter_500Medium", letterSpacing: 0.3 }}>CareLedger AI</Text>
            <Text style={{ color: colors.heading, fontSize: 28, marginTop: 4, fontFamily: "Inter_500Medium", letterSpacing: -0.3 }}>Good morning, Maya</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="medical-outline" size={22} color={colors.primary} />
          </View>
        </View>
      </Animated.View>

      <AnimatedScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 126, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <Card accentColor={colors.primary} style={{ padding: 0 }}>
            <View style={{ padding: 24, gap: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 13, letterSpacing: 0.2 }}>Your care starts here</Text>
              <Text style={{ color: colors.heading, fontSize: 28, lineHeight: 36, fontFamily: "Inter_500Medium", letterSpacing: -0.4 }}>
                How are you feeling today?
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 24 }}>
                Share symptoms, worries, or a simple update. We’ll guide you gently to the next best step.
              </Text>
              <Button label="Start symptom check" onPress={() => {}} />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 20 }} />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {features.map((item, index) => (
            <View key={item.title} style={{ width: "48%" }}>
              <FeatureCard item={item} delay={index * 90} />
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />

        <Animated.View entering={FadeInUp.delay(240).duration(500)}>
          <Card accentColor={colors.caution}>
            <Text style={{ color: colors.heading, fontSize: 17, fontFamily: "Inter_500Medium" }}>Daily guidance</Text>
            <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 24 }}>
              Stay hydrated, rest if symptoms worsen, and use the navigator when you need a clearer care path.
            </Text>
          </Card>
        </Animated.View>
      </AnimatedScrollView>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ position: "absolute", right: 20, bottom: 24 }}>
        <Animated.View style={pulseStyle}>
          <Pressable style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.critical, alignItems: "center", justifyContent: "center", shadowColor: colors.critical, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}>
            <Ionicons name="alert-circle-outline" size={28} color="#ffffff" />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

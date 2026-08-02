import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AssessmentScreen from "../screens/assessment";
import NavigatorScreen from "../screens/navigator";
import CostScreen from "../screens/cost";
import AffordabilityScreen from "../screens/affordability";
import AppointmentsScreen from "../screens/appointments";
import ChatScreen from "../screens/chat";
import RoadmapScreen from "../screens/roadmap";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium"
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Assessment: "pulse-outline",
            Navigator: "compass-outline",
            Cost: "receipt-outline",
            Affordability: "shield-checkmark-outline",
            Appointments: "calendar-outline",
            Roadmap: "map-outline"
          };

          return <Ionicons name={iconMap[route.name] || "ellipse-outline"} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Assessment" component={AssessmentScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Navigator" component={NavigatorScreen} options={{ title: "Navigator" }} />
      <Tab.Screen name="Cost" component={CostScreen} options={{ title: "Cost" }} />
      <Tab.Screen name="Affordability" component={AffordabilityScreen} options={{ title: "Score" }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: "Visits" }} />
      <Tab.Screen name="Roadmap" component={RoadmapScreen} options={{ title: "Roadmap" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: "Inter_500Medium", color: colors.heading }
        }}
      >
        <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Chat" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

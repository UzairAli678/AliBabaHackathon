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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Assessment" component={AssessmentScreen} />
      <Tab.Screen name="Navigator" component={NavigatorScreen} />
      <Tab.Screen name="Cost" component={CostScreen} />
      <Tab.Screen name="Affordability" component={AffordabilityScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Roadmap" component={RoadmapScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

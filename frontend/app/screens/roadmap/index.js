import React from "react";
import { Text, View } from "react-native";

export default function RoadmapScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: 24 }}>
      <Text style={{ color: "#0f172a", fontSize: 20, fontFamily: "Inter_500Medium" }}>Feature removed</Text>
      <Text style={{ color: "#64748b", marginTop: 8, lineHeight: 22, textAlign: "center" }}>
        This feature is no longer part of the app experience.
      </Text>
    </View>
  );
}

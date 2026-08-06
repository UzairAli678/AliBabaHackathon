import React from "react";
import { Text, View } from "react-native";

export default function AffordabilityScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: 24 }}>
      <Text style={{ color: "#0f172a", fontSize: 20, fontFamily: "Inter_500Medium" }}>Cost Intelligence</Text>
      <Text style={{ color: "#64748b", marginTop: 8, lineHeight: 22, textAlign: "center" }}>
        Review care cost options and affordability insights in one place.
      </Text>
    </View>
  );
}

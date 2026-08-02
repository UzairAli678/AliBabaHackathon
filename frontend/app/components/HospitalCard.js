import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function HospitalCard({ name, rating, distance, estimatedCost, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 18, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.heading, fontSize: 16, fontFamily: "Inter_500Medium" }}>{name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{distance}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.heading, fontFamily: "Inter_500Medium" }}>{rating}</Text>
          <View style={{ height: 1, width: 32, backgroundColor: colors.border, marginVertical: 6 }} />
          <Text style={{ color: colors.primary }}>{estimatedCost}</Text>
        </View>
      </View>
    </Pressable>
  );
}

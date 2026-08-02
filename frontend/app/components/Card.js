import React from "react";
import { View } from "react-native";
import { colors } from "../theme/colors";

export default function Card({ children, style, accentColor }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 22,
          shadowColor: "#0f172a",
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
          borderLeftWidth: accentColor ? 4 : 0,
          borderLeftColor: accentColor || colors.card
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function Button({ label, onPress, icon: Icon, variant = "primary" }) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: isPrimary ? colors.primary : colors.card,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center"
        }
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {Icon ? <Icon size={18} color={isPrimary ? "#ffffff" : colors.primary} /> : null}
        <Text style={{ color: isPrimary ? "#ffffff" : colors.heading, fontFamily: "Inter_500Medium" }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

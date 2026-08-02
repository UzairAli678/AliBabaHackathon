import React from "react";
import { Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function ChatBubble({ message, isUser, timestamp }) {
  return (
    <View style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "82%", marginVertical: 6 }}>
      <View
        style={{
          borderRadius: 22,
          borderTopLeftRadius: isUser ? 22 : 8,
          borderTopRightRadius: isUser ? 8 : 22,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isUser ? colors.primary : colors.card,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
          shadowColor: "#0f172a",
          shadowOpacity: 0.04,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1
        }}
      >
        <Text style={{ color: isUser ? "#ffffff" : colors.heading, lineHeight: 22 }}>{message}</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, textAlign: isUser ? "right" : "left" }}>
        {timestamp}
      </Text>
    </View>
  );
}

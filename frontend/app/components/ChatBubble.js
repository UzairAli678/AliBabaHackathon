import React from "react";
import { Text, View } from "react-native";

export default function ChatBubble({ message, isUser }) {
  return (
    <View className={`rounded-2xl px-4 py-2 my-1 ${isUser ? "bg-blue-600 self-end" : "bg-slate-200 self-start"}`}>
      <Text className={isUser ? "text-white" : "text-slate-900"}>{message}</Text>
    </View>
  );
}

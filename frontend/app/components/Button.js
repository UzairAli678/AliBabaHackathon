import React from "react";
import { Pressable, Text } from "react-native";

export default function Button({ label, onPress }) {
  return (
    <Pressable onPress={onPress} className="bg-blue-600 rounded-lg px-4 py-2">
      <Text className="text-white text-center font-semibold">{label}</Text>
    </Pressable>
  );
}

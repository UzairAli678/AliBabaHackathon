import React from "react";
import { View } from "react-native";

export default function Card({ children }) {
  return <View className="bg-white rounded-xl p-4 shadow-sm">{children}</View>;
}

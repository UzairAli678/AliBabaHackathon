import React from "react";
import { Text, View } from "react-native";

export default function ScoreGauge({ label, score }) {
  return (
    <View className="bg-teal-50 rounded-xl p-4">
      <Text className="text-slate-800 font-semibold">{label}</Text>
      <Text className="text-2xl text-teal-700 mt-1">{score}</Text>
    </View>
  );
}

import React from "react";
import { Text, View } from "react-native";

export default function HospitalCard({ name, distance, estimatedCost }) {
  return (
    <View className="bg-white rounded-xl p-4 border border-slate-200">
      <Text className="text-slate-900 font-semibold">{name}</Text>
      <Text className="text-slate-600 mt-1">{distance}</Text>
      <Text className="text-slate-800 mt-1">Estimated cost: {estimatedCost}</Text>
    </View>
  );
}

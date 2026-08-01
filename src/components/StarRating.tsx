import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
export function StarRating({ value }: { value?: number | null }) {
  const C = useColors();
  if (value == null) return <Text style={{ fontSize:12, color:C.textMuted }}>No rating</Text>;
  const full = Math.round(value);
  return (
    <View style={{ flexDirection:'row' }}>
      <Text style={{ color:C.warning, fontSize:13 }}>{'★'.repeat(full)}{'☆'.repeat(5-full)}</Text>
      <Text style={{ color:C.textMuted, fontSize:12 }}> {value.toFixed(1)}</Text>
    </View>
  );
}

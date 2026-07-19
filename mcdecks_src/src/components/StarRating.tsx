import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/styles/theme';
export function StarRating({ value }: { value?: number | null }) {
  if (value==null) return <Text style={{fontSize:12,color:Colors.textMuted}}>No rating</Text>;
  const full = Math.round(value);
  return <View style={{flexDirection:'row'}}><Text style={{color:Colors.warning,fontSize:13}}>{'★'.repeat(full)}{'☆'.repeat(5-full)}</Text><Text style={{color:Colors.textMuted,fontSize:12}}> {value.toFixed(1)}</Text></View>;
}

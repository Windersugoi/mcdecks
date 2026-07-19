import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
export function Pill({ children, color, onPress, active=false, locked=false }: {children:string;color:string;onPress?:()=>void;active?:boolean;locked?:boolean}) {
  return (
    <Pressable onPress={locked?undefined:onPress} style={[s.pill,{borderColor:locked&&!active?'#3a3a36':color},active&&{backgroundColor:color},locked&&!active&&s.locked]}>
      <Text style={[s.text,{color:active?'#10100e':locked?'#3a3a36':color}]}>{children}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  pill:{paddingVertical:4,paddingHorizontal:10,borderRadius:999,borderWidth:1},
  text:{fontSize:12,fontWeight:'500'},locked:{opacity:0.4},
});

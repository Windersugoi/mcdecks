import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Card } from '@/data/types';
import { Colors, Radius, Spacing } from '@/styles/theme';

interface Props { card: Card | null; onClose: () => void; }

// Headers para evitar bloqueos de marvelcdb en Android
const IMG_HEADERS = Platform.OS !== 'web' ? {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  'Referer': 'https://marvelcdb.com/',
  'Accept': 'image/png,image/jpeg,image/*',
} : undefined;

export function CardPreviewModal({ card, onClose }: Props) {
  const [error, setError] = useState(false);

  useEffect(() => { setError(false); }, [card?.id]);

  // Usar siempre card.imgsrc — es la URL específica para esa carta exacta.
  // Evita conflictos de nombres: Daredevil Core ≠ Daredevil SP//dr,
  // Spider-Woman aliada ≠ Spider-Woman héroe, etc.
  const imageUrl = card?.imgsrc ?? null;

  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.inner} onPress={() => {}}>

          <View style={s.imgContainer}>
            {imageUrl && !error ? (
              <Image
                source={{ uri: imageUrl, headers: IMG_HEADERS } as any}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
                onError={() => setError(true)}
              />
            ) : (
              <View style={s.noImg}>
                <Text style={s.noImgName}>{card?.name}</Text>
                <Text style={s.noImgSub}>
                  {!imageUrl ? 'No image URL' : 'Could not load image'}
                </Text>
                {imageUrl && (
                  <Text style={s.noImgUrl} numberOfLines={2}>{imageUrl}</Text>
                )}
              </View>
            )}
          </View>

          {card && (
            <>
              <Text style={s.name}>{card.name}</Text>
              <Text style={s.type}>
                {card.type?.replace(/\([A-Z]+\)/g, '').trim()}
                {card.cost != null ? ` · Cost ${card.cost}` : ''}
                {card.aspect && card.aspect !== 'Hero' && card.aspect !== 'Basic'
                  ? ` · ${card.aspect}` : ''}
              </Text>
            </>
          )}

          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center', padding:Spacing.xl },
  inner: { alignItems:'center', gap:10, width:'100%', maxWidth:300 },
  imgContainer: { width:260, height:374, borderRadius:Radius.lg, borderWidth:2, borderColor:Colors.borderStrong, overflow:'hidden', backgroundColor:Colors.surface2 },
  noImg: { flex:1, justifyContent:'center', alignItems:'center', gap:6, padding:16 },
  noImgName: { color:Colors.text, fontSize:16, fontWeight:'700', textAlign:'center' },
  noImgSub: { color:Colors.textMuted, fontSize:12 },
  noImgUrl: { color:Colors.borderStrong, fontSize:9, textAlign:'center' },
  name: { color:Colors.text, fontSize:15, fontWeight:'600', textAlign:'center' },
  type: { color:Colors.textMuted, fontSize:12 },
  closeBtn: { marginTop:4, paddingVertical:8, paddingHorizontal:24, borderWidth:1, borderColor:Colors.borderStrong, borderRadius:Radius.md },
  closeTxt: { color:Colors.text, fontSize:13 },
});

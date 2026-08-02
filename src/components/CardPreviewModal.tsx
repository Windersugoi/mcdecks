import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Card } from '@/data/types';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

interface Props { card: Card | null; onClose: () => void; }

const IMG_HEADERS = Platform.OS !== 'web' ? {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  'Referer': 'https://marvelcdb.com/',
  'Accept': 'image/png,image/jpeg,image/*',
} : undefined;

export function CardPreviewModal({ card, onClose }: Props) {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => {
    if (!card) return;
    setError(false);
    setFallbackTried(false);
    setLoading(false);
    setImageUrl(card.imgsrc ?? null);
  }, [card?.id]);

  async function tryFallback() {
    if (fallbackTried || !card) return;
    setFallbackTried(true);
    setLoading(true);
    try {
      const resp = await fetch(`https://marvelcdb.com/api/public/cards/?name=${encodeURIComponent(card.name)}`);
      if (!resp.ok) return;
      const cards: any[] = await resp.json();
      const match = cards.find(c => c.name.toLowerCase() === card.name.toLowerCase() && c.pack_code !== undefined);
      if (match?.imagesrc) {
        const url = match.imagesrc.startsWith('http') ? match.imagesrc : `https://marvelcdb.com${match.imagesrc}`;
        setImageUrl(url);
        setError(false);
      }
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.inner} onPress={() => {}}>
          <View style={s.imgContainer}>
            {loading && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={C.info} />}
            {imageUrl && !error && (
              <Image
                source={{ uri: imageUrl, headers: IMG_HEADERS } as any}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
                onError={() => { setError(true); if (!fallbackTried) tryFallback(); }}
              />
            )}
            {((!imageUrl || error) && !loading) && (
              <View style={s.noImg}>
                <Text style={s.noImgName}>{card?.name}</Text>
                <Text style={s.noImgSub}>{error ? 'Image not available' : 'No image URL'}</Text>
              </View>
            )}
          </View>
          {card && (
            <>
              <Text style={s.name}>{card.name}</Text>
              <Text style={s.type}>
                {card.type?.replace(/\([A-Z]+\)/g, '').trim()}
                {card.cost != null ? ` · Cost ${card.cost}` : ''}
                {card.aspect && card.aspect !== 'Hero' && card.aspect !== 'Basic' ? ` · ${card.aspect}` : ''}
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

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center', padding:Spacing.xl },
    inner:        { alignItems:'center', gap:10, width:'100%', maxWidth:300 },
    imgContainer: { width:260, height:374, borderRadius:Radius.lg, borderWidth:2, borderColor:C.borderStrong, overflow:'hidden', backgroundColor:C.surface2 },
    noImg:        { flex:1, justifyContent:'center', alignItems:'center', gap:6, padding:16 },
    noImgName:    { color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' },
    noImgSub:     { color:C.textMuted, fontSize:12 },
    name:         { color:'#e8e8e0', fontSize:15, fontWeight:'600', textAlign:'center' },
    type:         { color:'#8a8a80', fontSize:12 },
    closeBtn:     { marginTop:4, paddingVertical:8, paddingHorizontal:24, borderWidth:1, borderColor:'rgba(255,255,255,0.35)', borderRadius:Radius.md },
    closeTxt:     { color:'#e8e8e0', fontSize:13 },
  });
}

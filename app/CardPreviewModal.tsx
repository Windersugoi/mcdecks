import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Card } from '@/data/types';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';
import { ASPECT_CARDS, SET_CATALOG } from '@/data/cards';

interface Props { card: Card | null; onClose: () => void; }

const IMG_HEADERS = Platform.OS !== 'web' ? {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  'Referer': 'https://marvelcdb.com/',
  'Accept': 'image/png,image/jpeg,image/*',
} : undefined;

const SET_NAME: Record<string, string> = Object.fromEntries(
  SET_CATALOG.map(s => [s.code, s.name])
);

const ALL_SETS_THRESHOLD = 12;

function useCardSets(card: Card | null) {
  return useMemo(() => {
    if (!card) return null;
    const matches = ASPECT_CARDS.filter(
      c => c.name === card.name && c.aspect === card.aspect
    );
    const bySet = new Map<string, number>();
    for (const c of matches) {
      if (!c.setCode) continue;
      bySet.set(c.setCode, (bySet.get(c.setCode) ?? 0) + (c.qty ?? 1));
    }
    if (bySet.size === 0) return null;
    if (bySet.size > ALL_SETS_THRESHOLD) return 'all' as const;
    return [...bySet.entries()]
      .sort(([a], [b]) => {
        if (a === 'Core') return -1;
        if (b === 'Core') return 1;
        return (SET_NAME[a] ?? a).localeCompare(SET_NAME[b] ?? b);
      })
      .map(([code, qty]) => ({ name: SET_NAME[code] ?? code, qty }));
  }, [card?.id]);
}

export function CardPreviewModal({ card, onClose }: Props) {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fallbackTried, setFallbackTried] = useState(false);
  const [extTried, setExtTried] = useState(false);
  const cardSets = useCardSets(card);

  useEffect(() => {
    if (!card) return;
    setError(false);
    setFallbackTried(false);
    setExtTried(false);
    setLoading(false);
    setImageUrl(card.imgsrc ?? null);
  }, [card?.id]);

  function swapExtension(url: string): string | null {
    // marvelcdb no usa una extensión fija: algunos packs (ej. Age of Apocalypse)
    // sirven .jpg en vez de .png. Antes de rendirnos, probamos la otra.
    if (url.endsWith('.png')) return url.slice(0, -4) + '.jpg';
    if (url.endsWith('.jpg')) return url.slice(0, -4) + '.png';
    return null;
  }

  function handleImgError() {
    if (!extTried && imageUrl) {
      const swapped = swapExtension(imageUrl);
      if (swapped) {
        setExtTried(true);
        setImageUrl(swapped);
        return;
      }
    }
    setError(true);
    if (!fallbackTried) tryFallback();
  }

  async function tryFallback() {
    // Solo buscar alternativa si la carta NO tiene URL propia
    // Si tiene imgsrc pero falla → mostrar placeholder directamente
    if (fallbackTried || !card || card.imgsrc) return;
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
                onError={handleImgError}
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

          {cardSets && (
            <View style={s.setsBox}>
              <Text style={s.setsTitle}>Available in</Text>
              {cardSets === 'all' ? (
                <Text style={s.setsAll}>All sets</Text>
              ) : (
                <ScrollView style={s.setsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {cardSets.map(({ name, qty }) => (
                    <View key={name} style={s.setRow}>
                      <Text style={s.setName} numberOfLines={1}>{name}</Text>
                      <Text style={s.setQty}>x{qty}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
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
    overlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center', padding:Spacing.xl },
    inner:     { alignItems:'center', gap:10, width:'100%', maxWidth:300 },
    imgContainer: { width:260, height:374, borderRadius:Radius.lg, borderWidth:2, borderColor:C.borderStrong, overflow:'hidden', backgroundColor:C.surface2 },
    noImg:     { flex:1, justifyContent:'center', alignItems:'center', gap:6, padding:16 },
    noImgName: { color:C.text, fontSize:16, fontWeight:'700', textAlign:'center' },
    noImgSub:  { color:C.textMuted, fontSize:12 },
    name:      { color:'#e8e8e0', fontSize:15, fontWeight:'600', textAlign:'center' },
    type:      { color:'#8a8a80', fontSize:12 },
    setsBox:   { width:'100%', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:Radius.md, padding:Spacing.sm, gap:4 },
    setsTitle: { color:'#8a8a80', fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5 },
    setsAll:   { color:'#e8e8e0', fontSize:13, fontStyle:'italic' },
    setsList:  { maxHeight:90 },
    setRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:2 },
    setName:   { color:'#e8e8e0', fontSize:12, flex:1 },
    setQty:    { color:'#8a8a80', fontSize:12, marginLeft:6 },
    closeBtn:  { marginTop:4, paddingVertical:8, paddingHorizontal:24, borderWidth:1, borderColor:'rgba(255,255,255,0.35)', borderRadius:Radius.md },
    closeTxt:  { color:'#e8e8e0', fontSize:13 },
  });
}

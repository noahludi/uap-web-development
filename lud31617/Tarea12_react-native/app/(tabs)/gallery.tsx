// app/(tabs)/gallery.tsx
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAllPhotos } from "../../lib/storage";
import { PhotoEntry } from "../../lib/types";

export default function GalleryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PhotoEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const all = await getAllPhotos();
    setItems(all);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: PhotoEntry }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/photo/[id]", params: { id: item.id } })}
    >
      <Image source={{ uri: item.uri }} style={styles.thumb} />
      <View style={styles.meta}>
        <Text style={styles.title}>{new Date(item.timestamp).toLocaleString()}</Text>
        <Text style={styles.sub}>
          {item.lat != null && item.lng != null ? `📍 ${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}` : "Sin ubicación"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "#aaa" }}>Aún no hay fotos. Sacá una desde la pestaña de cámara.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderColor: "#222",
    borderWidth: 1,
  },
  thumb: { width: 96, height: 96, backgroundColor: "#000" },
  meta: { flex: 1, padding: 10, justifyContent: "center" },
  title: { color: "#fff", fontWeight: "600" },
  sub: { color: "#aaa", marginTop: 4 },
});

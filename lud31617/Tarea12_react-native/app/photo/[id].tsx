// app/photo/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getPhotoById } from "../../lib/storage";
import { PhotoEntry } from "../../lib/types";

export default function PhotoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<PhotoEntry | null>(null);

  useEffect(() => {
    (async () => {
      if (id) setItem(await getPhotoById(id));
    })();
  }, [id]);

  if (!item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const hasGeo = item.lat != null && item.lng != null;
  const dateStr = new Date(item.timestamp).toLocaleString();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <Image source={{ uri: item.uri }} style={styles.photo} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title}>{dateStr}</Text>
        <Text style={styles.sub}>
          {hasGeo ? `📍 ${item.lat!.toFixed(6)}, ${item.lng!.toFixed(6)}` : "Sin ubicación"}
        </Text>
      </View>
      {hasGeo && (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: item.lat!,
              longitude: item.lng!,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: item.lat!, longitude: item.lng! }} />
          </MapView>
        </View>
      )}
    </ScrollView>
  );
}

const w = Dimensions.get("window").width;
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  photo: { width: w, height: w * 1.1, backgroundColor: "#000" },
  info: { padding: 12, backgroundColor: "#111", borderBottomColor: "#222", borderBottomWidth: 1 },
  title: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sub: { color: "#aaa", marginTop: 4 },
  mapWrap: { height: 260, margin: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#222" },
  map: { flex: 1 },
});

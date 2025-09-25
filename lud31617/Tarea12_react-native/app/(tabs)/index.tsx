// app/(tabs)/index.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addPhoto } from "../../lib/storage";
import { PhotoEntry } from "../../lib/types";

export default function CameraScreen() {
  const router = useRouter();

  // Permisos
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [locGranted, setLocGranted] = useState<boolean | null>(null);

  // Estados
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false); // cámara lista
  const camRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      // Ubicación (opcional)
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocGranted(status === "granted");
    })();
  }, []);

  if (!camPerm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!camPerm.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Necesitamos acceso a la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestCamPerm}>
          <Text style={styles.btnText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onTakePhoto = async () => {
    if (saving || !ready) return; // evita doble tap / cam no lista
    if (!camRef.current) return;

    try {
      setSaving(true);

      // 1) Capturar (sin skipProcessing, más estable en Android)
      const photo = await camRef.current.takePictureAsync({ quality: 0.9 });

      // 2) Guardar en almacenamiento privado de la app (NO MediaLibrary)
      const photosDir = FileSystem.documentDirectory + "photos";
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const dest = `${photosDir}/${fileName}`;
      await FileSystem.copyAsync({ from: photo.uri, to: dest });

      let finalUri = dest;

      // 3) Ubicación (si hay permiso)
      let lat: number | null = null;
      let lng: number | null = null;
      if (locGranted) {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (locErr) {
          console.warn("Location error:", locErr);
        }
      }

      // 4) Persistir registro
      const entry: PhotoEntry = {
        id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        uri: finalUri, // file://… en storage privado
        lat,
        lng,
        timestamp: Date.now(),
      };
      await addPhoto(entry);

      // 5) Ir a Galería
      router.push("/(tabs)/gallery");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo capturar la foto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setReady(true)}
        onMountError={(e) =>
          Alert.alert("Cámara", e?.message ?? "No se pudo iniciar la cámara")
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.shutter} disabled={saving || !ready} onPress={onTakePhoto}>
          {saving ? <ActivityIndicator /> : <Text style={styles.shutterText}>●</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { color: "#fff", fontSize: 18, marginBottom: 12, textAlign: "center" },
  btn: { backgroundColor: "#0ea5e9", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
  container: { flex: 1, backgroundColor: "black" },
  footer: {
    position: "absolute",
    bottom: 32,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  shutterText: { color: "#fff", fontSize: 28, marginTop: -2 },
});

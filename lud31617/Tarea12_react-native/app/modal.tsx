import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Información de la aplicación</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        {/* Identidad */}
        <Text style={styles.h2}>FotoBitácora</Text>
        <Text style={styles.p}>
          App móvil hecha con <Text style={styles.bold}>Expo + React Native</Text> para
          capturar fotos y guardar su <Text style={styles.bold}>ubicación GPS</Text>.
          Podés ver una <Text style={styles.bold}>galería</Text> con metadatos y abrir un
          <Text style={styles.bold}> mapa</Text> por foto.
        </Text>

        {/* Versión / Estado */}
        <View style={styles.card}>
          <Text style={styles.cardItem}><Text style={styles.label}>Versión:</Text> 0.1.0</Text>
          <Text style={styles.cardItem}><Text style={styles.label}>Álbum:</Text> “FotoBitacora” (Android/iOS)</Text>
          <Text style={styles.cardItem}><Text style={styles.label}>Almacenamiento:</Text> AsyncStorage (registros)</Text>
        </View>

        {/* Qué puedo hacer */}
        <Text style={styles.h3}>Qué podés hacer</Text>
        <View style={styles.list}>
          <Text style={styles.li}>• Sacar fotos con la cámara trasera.</Text>
          <Text style={styles.li}>• Guardar cada foto con coordenadas (si otorgás permisos).</Text>
          <Text style={styles.li}>• Ver galería con fecha y ubicación.</Text>
          <Text style={styles.li}>• Abrir un mapa por foto y ver el pin.</Text>
        </View>

        {/* Permisos */}
        <Text style={styles.h3}>Permisos usados</Text>
        <View style={styles.list}>
          <Text style={styles.li}>
            • <Text style={styles.bold}>Cámara</Text>: capturar imágenes.
          </Text>
          <Text style={styles.li}>
            • <Text style={styles.bold}>Ubicación (foreground)</Text>: guardar lat/lng al momento de la foto.
          </Text>
          <Text style={styles.li}>
            • <Text style={styles.bold}>Biblioteca/Archivos</Text>: crear/guardar en el álbum “FotoBitacora”.
          </Text>
        </View>

        {/* Dónde se guardan los datos */}
        <Text style={styles.h3}>Dónde van tus datos</Text>
        <Text style={styles.p}>
          Las fotos se guardan en tu <Text style={styles.bold}>galería del sistema</Text> (álbum “FotoBitacora”).
          Los registros (URI de la foto, fecha, lat/lng) se guardan en
          <Text style={styles.bold}> almacenamiento local</Text> (AsyncStorage). No se sube nada a servidores.
        </Text>

        {/* Uso rápido */}
        <Text style={styles.h3}>Cómo usar</Text>
        <View style={styles.list}>
          <Text style={styles.li}>1. Abrí la pestaña <Text style={styles.bold}>Cámara</Text> y otorgá permisos.</Text>
          <Text style={styles.li}>2. Tocá el botón de disparo para sacar una foto.</Text>
          <Text style={styles.li}>3. Aceptá permisos de ubicación si querés guardar el GPS.</Text>
          <Text style={styles.li}>4. Andá a <Text style={styles.bold}>Galería</Text> para ver tus capturas.</Text>
          <Text style={styles.li}>5. Tocá una foto para ver su detalle y mapa.</Text>
        </View>

        {/* Problemas comunes */}
        <Text style={styles.h3}>Problemas comunes</Text>
        <View style={styles.list}>
          <Text style={styles.li}>
            • <Text style={styles.bold}>No guarda ubicación:</Text> revisá que el GPS esté activo y que la app tenga permiso de ubicación.
          </Text>
          <Text style={styles.li}>
            • <Text style={styles.bold}>No veo el álbum:</Text> en algunos dispositivos aparece tras sacar la primera foto.
          </Text>
          <Text style={styles.li}>
            • <Text style={styles.bold}>Crashes o permisos raros en Android:</Text> si usás dev build, recordá regenerar nativo tras editar <Text style={styles.code}>app.json</Text>.
          </Text>
        </View>

        {/* Atajos de navegación */}
        <Text style={styles.h3}>Atajos</Text>
        <View style={styles.row}>
          <Link href="/(tabs)" asChild>
            <Pressable style={styles.btn}>
              <Text style={styles.btnText}>Ir a Cámara</Text>
            </Pressable>
          </Link>
          <Link href="/(tabs)/gallery" asChild>
            <Pressable style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Abrir Galería</Text>
            </Pressable>
          </Link>
        </View>

        {/* Créditos / Licencias (editá a gusto) */}
        <Text style={styles.h3}>Créditos</Text>
        <Text style={styles.p}>
          Construida con Expo, React Native y librerías de comunidad. Íconos: FontAwesome.
          Código base del template de pestañas de Expo Router.
        </Text>

        {/* Espaciador inferior */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Status bar clara en iOS para cubrir el espacio negro arriba del modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 36,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  separator: {
    marginVertical: 16,
    height: 1,
    width: '100%',
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  p: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  bold: { fontWeight: '700' },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as string,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  cardItem: { fontSize: 14, marginBottom: 4, opacity: 0.95 },
  label: { fontWeight: '700' },
  list: { gap: 6 },
  li: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: {
    borderColor: '#0ea5e9',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnOutlineText: { color: '#0ea5e9', fontWeight: '700' },
});

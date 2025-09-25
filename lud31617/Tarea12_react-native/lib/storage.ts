// lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PhotoEntry } from "./types";

const KEY = "photos@v1";

export async function getAllPhotos(): Promise<PhotoEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PhotoEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addPhoto(entry: PhotoEntry): Promise<void> {
  const all = await getAllPhotos();
  all.unshift(entry); // primero las más nuevas
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function getPhotoById(id: string): Promise<PhotoEntry | null> {
  const all = await getAllPhotos();
  return all.find((p) => p.id === id) || null;
}

export async function clearAll() {
  await AsyncStorage.removeItem(KEY);
}

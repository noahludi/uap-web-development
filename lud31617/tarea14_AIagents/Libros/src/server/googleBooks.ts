import { BasicBook, BookDetails } from '../types';
import { sanitizeQuery } from './validation';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1';

const pickISBN = (identifiers?: { type: string; identifier: string }[]) => {
  if (!identifiers) return {};
  const isbn10 = identifiers.find((id) => id.type === 'ISBN_10')?.identifier;
  const isbn13 = identifiers.find((id) => id.type === 'ISBN_13')?.identifier;
  return { isbn10, isbn13 };
};

export const searchBooks = async (
  query: string,
  maxResults: number,
  orderBy: 'relevance' | 'newest',
  apiKey?: string,
): Promise<BasicBook[]> => {
  const safeQuery = sanitizeQuery(query);
  const params = new URLSearchParams({ q: safeQuery, maxResults: String(maxResults), orderBy });
  if (apiKey) params.set('key', apiKey);

  const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes?${params.toString()}`, {
    headers: { 'User-Agent': 'ai-book-advisor/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Google Books respondió ${res.status}`);
  }

  const payload = await res.json();
  const items = payload.items ?? [];
  return items.map((item: any) => ({
    id: item.id,
    title: item.volumeInfo?.title ?? 'Título no disponible',
    authors: item.volumeInfo?.authors ?? [],
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
  }));
};

export const fetchBookDetails = async (bookId: string, apiKey?: string): Promise<BookDetails> => {
  const params = new URLSearchParams();
  if (apiKey) params.set('key', apiKey);
  const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes/${encodeURIComponent(bookId)}?${params.toString()}`, {
    headers: { 'User-Agent': 'ai-book-advisor/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Google Books respondió ${res.status}`);
  }
  const payload = await res.json();
  const info = payload.volumeInfo ?? {};
  const identifiers = pickISBN(info.industryIdentifiers);
  return {
    id: payload.id,
    title: info.title ?? 'Título no disponible',
    authors: info.authors ?? [],
    thumbnail: info.imageLinks?.thumbnail,
    description: info.description,
    pageCount: info.pageCount,
    categories: info.categories,
    averageRating: info.averageRating,
    ratingsCount: info.ratingsCount,
    publishedDate: info.publishedDate,
    publisher: info.publisher,
    language: info.language,
    infoLink: info.infoLink,
    ...identifiers,
  };
};

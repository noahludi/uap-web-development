import { addBook, getStats, listBooks, markBookAsRead } from './datastore';
import { fetchBookDetails, searchBooks as searchGoogleBooks } from './googleBooks';
import {
  addToReadingListSchema,
  getBookDetailsSchema,
  getReadingListSchema,
  markAsReadSchema,
  readingStatsSchema,
  searchBooksSchema,
} from './validation';

const getGoogleBooksKey = () => process.env.GOOGLE_BOOKS_API_KEY;

export async function searchBooks(body: unknown) {
  const { query, maxResults, orderBy } = searchBooksSchema.parse(body);
  const apiKey = getGoogleBooksKey();
  const results = await searchGoogleBooks(query, maxResults, orderBy, apiKey);
  return { results };
}

export async function getBookDetails(body: unknown) {
  const { bookId } = getBookDetailsSchema.parse(body);
  const apiKey = getGoogleBooksKey();
  const details = await fetchBookDetails(bookId, apiKey);
  return { details };
}

export async function addToReadingList(body: unknown, userId: string) {
  const { bookId, priority, notes } = addToReadingListSchema.parse(body);
  const apiKey = getGoogleBooksKey();
  const details = await fetchBookDetails(bookId, apiKey);

  const added = addBook(userId, {
    bookId,
    priority,
    notes,
    addedAt: new Date().toISOString(),
    status: 'pending',
    title: details.title,
    authors: details.authors,
    thumbnail: details.thumbnail,
  });
  return added;
}

export async function getReadingList(body: unknown, userId: string) {
  const { filter, limit } = getReadingListSchema.parse(body);
  const items = listBooks(userId, filter === 'all' ? undefined : filter, limit);
  return { items };
}

export async function markAsRead(body: unknown, userId: string) {
  const { bookId, rating, review, dateFinished } = markAsReadSchema.parse(body);
  const apiKey = getGoogleBooksKey();
  const details = await fetchBookDetails(bookId, apiKey);
  const updated = markBookAsRead(userId, bookId, rating, review, dateFinished, details);
  return updated ? { success: true } : { success: false, reason: 'Libro no encontrado en la lista' };
}

export async function getReadingStats(body: unknown, userId: string) {
  const { period, groupBy } = readingStatsSchema.parse(body);
  const stats = getStats(userId, period);
  const breakdown =
    groupBy === 'author'
      ? stats.authors
      : groupBy === 'year'
        ? Object.keys(stats.byPeriod).reduce<Record<string, number>>((acc, key) => {
            if (key === 'unknown') return acc;
            const year = key.slice(0, 4);
            acc[year] = (acc[year] || 0) + stats.byPeriod[key];
            return acc;
          }, {})
        : stats.genres;

  return { period, groupBy, stats, breakdown };
}

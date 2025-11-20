import { db, ensureUser } from './db';
import { BookDetails, ReadingListEntry, ReadingStats } from '../types';

type Priority = ReadingListEntry['priority'];

const serializeArray = (value?: string[]) => (value ? JSON.stringify(value.slice(0, 20)) : null);
const deserializeArray = (value: string | null) => (value ? (JSON.parse(value) as string[]) : undefined);

export const addBook = (
  userId: string,
  entry: ReadingListEntry,
): { added: boolean; reason?: string; item?: ReadingListEntry } => {
  const safeUser = ensureUser(userId);

  try {
    const stmt = db.prepare(
      `INSERT INTO reading_list (user_id, book_id, priority, notes, added_at, status, title, authors, thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
      safeUser,
      entry.bookId,
      entry.priority,
      entry.notes,
      entry.addedAt,
      entry.status,
      entry.title ?? null,
      entry.authors ? JSON.stringify(entry.authors) : null,
      entry.thumbnail ?? null,
    );
  } catch (error: any) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { added: false, reason: 'El libro ya existe en tu lista.' } as const;
    }
    throw error;
  }

  return { added: true, item: entry } as const;
};

export const listBooks = (
  userId: string,
  filter?: Priority,
  limit?: number,
): ReadingListEntry[] => {
  const safeUser = ensureUser(userId);
  const filters: string[] = [];
  const params: (string | number)[] = [safeUser];

  if (filter && filter !== 'all') {
    filters.push('priority = ?');
    params.push(filter);
  }

  const where = filters.length ? `AND ${filters.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${limit}` : '';

  const rows = db
    .prepare(
      `SELECT id, book_id, priority, notes, added_at, status, rating, review, date_finished, title, authors, thumbnail
       FROM reading_list
       WHERE user_id = ? ${where}
       ORDER BY added_at DESC ${limitClause}`,
    )
    .all(...params);

  return rows.map((row) => ({
    id: row.id,
    bookId: row.book_id,
    priority: row.priority,
    notes: row.notes ?? undefined,
    addedAt: row.added_at,
    status: row.status,
    rating: row.rating ?? undefined,
    review: row.review ?? undefined,
    dateFinished: row.date_finished ?? undefined,
    title: row.title ?? undefined,
    authors: deserializeArray(row.authors ?? null),
    thumbnail: row.thumbnail ?? undefined,
  }));
};

export const markBookAsRead = (
  userId: string,
  bookId: string,
  rating?: number,
  review?: string,
  dateFinished?: string,
  details?: BookDetails,
) => {
  const safeUser = ensureUser(userId);
  const tx = db.transaction(() => {
    const existing = db
      .prepare('SELECT id, title, authors, thumbnail FROM reading_list WHERE user_id = ? AND book_id = ?')
      .get(safeUser, bookId);

    if (!existing) return false;

    db.prepare(
      `UPDATE reading_list
       SET status = 'read', rating = ?, review = ?, date_finished = ?
       WHERE user_id = ? AND book_id = ?`,
    ).run(rating ?? null, review ?? null, dateFinished ?? new Date().toISOString(), safeUser, bookId);

    const targetDetails = details ?? null;
    db.prepare(
      `INSERT OR REPLACE INTO read_books (user_id, book_id, rating, review, date_finished, page_count, authors, categories, title, thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      safeUser,
      bookId,
      rating ?? null,
      review ?? null,
      dateFinished ?? new Date().toISOString(),
      targetDetails?.pageCount ?? null,
      serializeArray(targetDetails?.authors),
      serializeArray(targetDetails?.categories),
      targetDetails?.title ?? existing?.title ?? null,
      targetDetails?.thumbnail ?? existing?.thumbnail ?? null,
    );

    return true;
  });

  return tx();
};

type Period = 'all-time' | 'year' | 'month' | 'week';

const isWithinPeriod = (date: string | null, period: Period) => {
  if (period === 'all-time') return true;
  if (!date) return false;
  const current = new Date();
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return false;

  if (period === 'year') return target.getFullYear() === current.getFullYear();
  if (period === 'month')
    return target.getFullYear() === current.getFullYear() && target.getMonth() === current.getMonth();

  const diff = (current.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7;
};

export const getStats = (userId: string, period: Period = 'all-time'): ReadingStats => {
  const safeUser = ensureUser(userId);
  const readRows = db
    .prepare(
      `SELECT book_id, rating, review, date_finished, page_count, authors, categories, title, thumbnail
       FROM read_books WHERE user_id = ? ORDER BY date_finished DESC`,
    )
    .all(safeUser)
    .filter((row) => isWithinPeriod(row.date_finished ?? null, period));

  const totalRead = readRows.length;
  const totalPages = readRows.reduce((sum, row) => sum + (row.page_count || 0), 0);
  const rated = readRows.filter((row) => row.rating != null);
  const averageRating = rated.length
    ? rated.reduce((sum, row) => sum + Number(row.rating), 0) / rated.length
    : undefined;

  const genres: Record<string, number> = {};
  const authors: Record<string, number> = {};
  const byPeriod: Record<string, number> = {};

  const toKey = (date?: string) => {
    if (!date) return 'unknown';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'unknown';
    return parsed.toISOString().slice(0, 10);
  };

  readRows.forEach((row) => {
    const dayKey = toKey(row.date_finished);
    byPeriod[dayKey] = (byPeriod[dayKey] || 0) + 1;

    const rowGenres = deserializeArray(row.categories ?? null) ?? [];
    rowGenres.forEach((genre) => {
      genres[genre] = (genres[genre] || 0) + 1;
    });

    const rowAuthors = deserializeArray(row.authors ?? null) ?? [];
    rowAuthors.forEach((author) => {
      authors[author] = (authors[author] || 0) + 1;
    });
  });

  const sortedDates = Object.keys(byPeriod)
    .filter((key) => key !== 'unknown')
    .sort((a, b) => (a > b ? -1 : 1));

  let streakDays = 0;
  let previous: Date | null = null;
  for (const key of sortedDates) {
    const current = new Date(key);
    if (!previous) {
      streakDays = 1;
      previous = current;
      continue;
    }
    const diff = (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streakDays += 1;
    } else if (diff > 1) {
      break;
    }
    previous = current;
  }

  return {
    totalRead,
    totalPages,
    averageRating,
    genres,
    authors,
    byPeriod,
    streakDays,
  };
};

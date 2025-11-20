export interface BasicBook {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string;
}

export interface BookDetails extends BasicBook {
  description?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  publishedDate?: string;
  publisher?: string;
  language?: string;
  infoLink?: string;
  isbn10?: string;
  isbn13?: string;
}

export interface ReadingListEntry {
  id?: number;
  bookId: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  addedAt: string;
  status: 'pending' | 'read';
  rating?: number;
  review?: string;
  dateFinished?: string;
  title?: string;
  authors?: string[];
  thumbnail?: string;
}

export interface ReadingStats {
  totalRead: number;
  totalPages: number;
  averageRating?: number;
  genres: Record<string, number>;
  authors: Record<string, number>;
  byPeriod: Record<string, number>;
  streakDays?: number;
}

export type Post = {
  id: string;
  locale: 'fa' | 'en';
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover: string;
  coverAlt: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  revision: string;
};
export type Media = {
  key: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
};
export type Inquiry = {
  id: string;
  name: string;
  contact: string;
  type: string;
  message: string;
  phase?: string;
  services?: string[];
  timeline?: string;
  location?: string;
  locale: 'fa' | 'en';
  createdAt: string;
};
export type { GalleryItem } from '../src/shared/config/showcase.ts';
import type { GalleryItem } from '../src/shared/config/showcase.ts';
export type AssistantSettings = {
  persona: string;
  knowledge: string;
  model: string;
  enabled: boolean;
  revision: string;
};
export type StoredFile = {
  body: ArrayBuffer | ReadableStream;
  type: string;
  size: number;
};

export interface ContentStore {
  posts(): Promise<Post[]>;
  savePost(post: Post, expectedRevision: string | null): Promise<boolean>;
  deletePost(id: string, revision: string): Promise<boolean>;
  media(): Promise<Media[]>;
  putMedia(meta: Media, bytes: ArrayBuffer): Promise<void>;
  mediaInfo(key: string): Promise<Media | null>;
  getMedia(key: string, range?: { start: number; end: number }): Promise<StoredFile | null>;
  deleteMedia(key: string): Promise<boolean>;
  mediaUsage(): Promise<{ used: number; limit: number }>;
  beginMedia(meta: Media): Promise<void>;
  appendMedia(key: string, part: number, bytes: ArrayBuffer): Promise<boolean>;
  finishMedia(key: string): Promise<Media | null>;
  cancelMedia(key: string): Promise<void>;
  inquiries(): Promise<Inquiry[]>;
  addInquiry(inquiry: Inquiry, fingerprint: string): Promise<boolean>;
  portfolio(): Promise<GalleryItem[]>;
  saveWork(item: GalleryItem, revision: string | null): Promise<boolean>;
  deleteWork(id: string, revision: string): Promise<boolean>;
  assistantSettings(): Promise<AssistantSettings | null>;
  saveAssistantSettings(settings: AssistantSettings, revision: string | null): Promise<boolean>;
  reserveChat(fingerprint: string): Promise<boolean>;
}

export type Services = {
  store: ContentStore;
  authenticate: (request: Request) => Promise<{ email: string; local: boolean } | null>;
  fingerprint: (request: Request) => Promise<string>;
  siteOrigin?: string;
  ai?: { key?: string; fetch?: typeof fetch };
};

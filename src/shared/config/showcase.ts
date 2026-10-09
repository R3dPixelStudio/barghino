import type { Locale } from './locale';

export const showcase = {
  fa: {
    nav: ['شروع', 'کارنامه', 'پروژهٔ شما'],
    journal: 'مجله',
    eyebrow: 'برقینو / طراحی و اجرای برق هوشمند',
    title: ['جریان،', 'با فکر.'],
    intro: 'برق دقیق. فضای هوشمند. از اولین تصمیم تا آخرین روشنایی.',
    work: 'کار را ببینید',
    start: 'از پروژه‌تان بگویید',
    expertise: ['تأسیسات برق', 'روشنایی', 'کنترل هوشمند'],
    powerOn: 'جریان را روشن کنید',
    powerOff: 'جریان را خاموش کنید',
    powerHint: 'یک لمس. یک جریان تازه.',
    live: 'جریان برقرار است',
    pause: 'توقف حرکت',
    resume: 'ادامهٔ حرکت',
    workLabel: '02 / SELECTED WORK',
    workTitle: 'جزئیات، تفاوت می‌سازند.',
    workIntro: 'از زیرساخت تا تجربهٔ فضا؛ تصویرهایی از کاری که برای ما مهم است.',
    previewNote: 'پیش‌نمایش مفهومی — تصاویر پروژه‌های واقعی به‌زودی اضافه می‌شوند.',
    previous: 'کار قبلی',
    next: 'کار بعدی',
    open: 'نگاه نزدیک‌تر',
    briefLabel: '03 / YOUR NEXT PROJECT',
    briefTitle: 'شروع خوب، با یک سؤال.',
    briefIntro: 'چهار تصمیم کوتاه. یک مسیر روشن برای پروژهٔ شما.',
    assistant: 'دستیار برقینو',
    assistantIntro: 'دربارهٔ خدمات، روش کار یا پیش‌نویس قرارداد بپرسید.',
  },
  en: {
    nav: ['The idea', 'Selected work', 'Your project'],
    journal: 'Journal',
    eyebrow: 'BARGHINO / INTELLIGENT ELECTRICAL WORK',
    title: ['Current.', 'Considered.'],
    intro:
      'Precise electrical work. Intelligent spaces. From the first decision to the final light.',
    work: 'Explore the work',
    start: 'Tell us what’s next',
    expertise: ['Electrical installation', 'Lighting', 'Smart control'],
    powerOn: 'Switch the current on',
    powerOff: 'Switch the current off',
    powerHint: 'One touch. A new current.',
    live: 'CURRENT IS LIVE',
    pause: 'Pause motion',
    resume: 'Resume motion',
    workLabel: '02 / SELECTED WORK',
    workTitle: 'The difference is in the details.',
    workIntro:
      'From infrastructure to the experience of a space. A closer look at what matters to us.',
    previewNote: 'Concept previews — real project imagery will be added soon.',
    previous: 'Previous work',
    next: 'Next work',
    open: 'Take a closer look',
    briefLabel: '03 / YOUR NEXT PROJECT',
    briefTitle: 'Good work begins with a question.',
    briefIntro: 'Four considered decisions. A clear direction for your project.',
    assistant: 'Barghino assistant',
    assistantIntro: 'Ask about our services, process, or a first contract draft.',
  },
} satisfies Record<Locale, unknown>;

export type GalleryItem = {
  id: string;
  titleFa: string;
  titleEn: string;
  categoryFa: string;
  categoryEn: string;
  src: string;
  kind: 'image' | 'video';
  poster: string;
  altFa: string;
  altEn: string;
  year: string;
  location: string;
  descriptionFa: string;
  descriptionEn: string;
  captions?: string;
  captionLanguage?: 'fa' | 'en';
  status: 'draft' | 'published';
  order: number;
  concept: boolean;
  revision: string;
};

export const conceptGallery: GalleryItem[] = [
  {
    id: 'concept-light',
    titleFa: 'روشنایی، بخشی از معماری',
    titleEn: 'Light, built into the architecture',
    categoryFa: 'روشنایی یکپارچه',
    categoryEn: 'ARCHITECTURAL LIGHTING',
    src: '/previews/lighting.webp',
    kind: 'image',
    poster: '',
    altFa: 'پیش‌نمایش مفهومی فضای داخلی با روشنایی خطی',
    altEn: 'Concept preview of an interior with integrated linear lighting',
    year: '',
    location: '',
    descriptionFa: 'پیش‌نمایش زبان بصری گالری؛ پروژهٔ اجراشده نیست.',
    descriptionEn: 'A visual preview of the gallery, not a completed project.',
    status: 'published',
    order: 0,
    concept: true,
    revision: 'concept',
  },
  {
    id: 'concept-control',
    titleFa: 'کنترل، به سادگی یک لمس',
    titleEn: 'Intelligence at your fingertips',
    categoryFa: 'کنترل هوشمند',
    categoryEn: 'INTELLIGENT CONTROL',
    src: '/previews/control.webp',
    kind: 'image',
    poster: '',
    altFa: 'پیش‌نمایش مفهومی یک پنل کنترل هوشمند',
    altEn: 'Concept preview of a minimalist smart control panel',
    year: '',
    location: '',
    descriptionFa: 'تصویر مفهومی؛ با رسانهٔ واقعی شما جایگزین می‌شود.',
    descriptionEn: 'Concept imagery, ready to be replaced with your actual work.',
    status: 'published',
    order: 1,
    concept: true,
    revision: 'concept',
  },
  {
    id: 'concept-detail',
    titleFa: 'دقت، در همهٔ جزئیات',
    titleEn: 'Precision in every detail',
    categoryFa: 'کیفیت اجرا',
    categoryEn: 'INSTALLATION CRAFT',
    src: '/previews/detail.webp',
    kind: 'image',
    poster: '',
    altFa: 'پیش‌نمایش مفهومی ابزار و جزئیات کار برق',
    altEn: 'Concept preview of electrical installation tools and materials',
    year: '',
    location: '',
    descriptionFa: 'نمای مفهومی کیفیت و ظرافت اجرا.',
    descriptionEn: 'A concept study of craft and installation materials.',
    status: 'published',
    order: 2,
    concept: true,
    revision: 'concept',
  },
];

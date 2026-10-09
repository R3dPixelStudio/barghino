import type { Locale } from './locale';

const en = {
  skip: 'Skip to content',
  navigation: 'Main navigation',
  services: 'Expertise',
  approach: 'Our approach',
  contact: 'Start a conversation',
  eyebrow: 'ENGINEERED FOR WHAT’S NEXT',
  headline: ['Power,', 'with precision.'],
  intro:
    'Electrical infrastructure. Intelligent control. One considered approach to the energy behind your ambition.',
  explore: 'Explore our expertise',
  heroLabel: '01 / INTELLIGENT INFRASTRUCTURE',
  diagram:
    'Conceptual electrical energy core. Decorative visualization; all services and navigation are available in the page.',
  system: 'ENERGY / IN MOTION',
  pause: 'Pause motion',
  resume: 'Enable motion',
  reduced: 'Reduced motion enabled',
  capabilitiesLabel: 'THE DISCIPLINES',
  capabilitiesTitle: 'Complex systems.\nClear thinking.',
  capabilitiesIntro:
    'From the first drawing to the final connection, every element belongs to a bigger picture.',
  disciplines: [
    {
      title: 'Electrical infrastructure',
      text: 'Distribution, power systems, and the foundations of dependable buildings.',
      tag: 'POWER / DISTRIBUTION',
    },
    {
      title: 'Intelligent buildings',
      text: 'Connected control, considered automation, and systems that work together.',
      tag: 'CONTROL / AUTOMATION',
    },
    {
      title: 'Energy optimization',
      text: 'Monitoring and integration that turn energy use into actionable insight.',
      tag: 'MONITOR / OPTIMIZE',
    },
  ],
  approachLabel: 'THE APPROACH',
  approachTitle: 'Precision is a process.',
  steps: [
    {
      title: 'Understand',
      text: 'Begin with the building, the people, and the demands of the project.',
    },
    {
      title: 'Engineer',
      text: 'Bring power and intelligence into one coherent, practical system.',
    },
    {
      title: 'Integrate',
      text: 'Connect every detail with a clear path to operation and maintenance.',
    },
  ],
  contactLabel: 'THE NEXT CONNECTION',
  contactTitle: 'Let’s power\nyour next chapter.',
  contactText: 'A considered electrical system starts with a considered conversation.',
  contactPending: 'Contact details will be available soon.',
  footer: 'POWER. INTELLIGENCE. PRECISION.',
  top: 'Back to top',
  metadataDescription:
    'Barghino — electrical infrastructure, intelligent building control, and energy optimization. A Smart-Tech Energy concept showcase.',
};

const fa: typeof en = {
  skip: 'رفتن به محتوای اصلی',
  navigation: 'ناوبری اصلی',
  services: 'تخصص ما',
  approach: 'رویکرد ما',
  contact: 'آغاز همکاری',
  eyebrow: 'مهندسی برای فردا',
  headline: ['انرژی،', 'با دقت مهندسی.'],
  intro: 'زیرساخت برق. کنترل هوشمند. رویکردی یکپارچه برای انرژیِ پشت ایده‌های بزرگ شما.',
  explore: 'آشنایی با تخصص ما',
  heroLabel: '۰۱ / زیرساخت هوشمند',
  diagram:
    'نمای مفهومی هسته انرژی الکتریکی. این تصویر تزئینی است؛ تمام خدمات و مسیرهای ناوبری در متن صفحه در دسترس هستند.',
  system: 'انرژی / در جریان',
  pause: 'توقف حرکت',
  resume: 'فعال‌سازی حرکت',
  reduced: 'کاهش حرکت فعال است',
  capabilitiesLabel: 'حوزه‌های تخصص',
  capabilitiesTitle: 'سیستم‌های پیچیده.\nنگاهی روشن.',
  capabilitiesIntro: 'از نخستین نقشه تا آخرین اتصال، هر جزء بخشی از یک تصویر بزرگ‌تر است.',
  disciplines: [
    {
      title: 'زیرساخت برق',
      text: 'توزیع انرژی، سیستم‌های قدرت و زیربنای ساختمان‌های قابل اتکا.',
      tag: 'قدرت / توزیع',
    },
    {
      title: 'ساختمان هوشمند',
      text: 'کنترل یکپارچه، اتوماسیون هدفمند و سیستم‌هایی که با هم کار می‌کنند.',
      tag: 'کنترل / اتوماسیون',
    },
    {
      title: 'بهینه‌سازی انرژی',
      text: 'پایش و یکپارچه‌سازی برای تبدیل مصرف انرژی به بینش کاربردی.',
      tag: 'پایش / بهینه‌سازی',
    },
  ],
  approachLabel: 'رویکرد ما',
  approachTitle: 'دقت، یک فرآیند است.',
  steps: [
    { title: 'شناخت', text: 'آغاز با شناخت ساختمان، افراد و نیازهای واقعی پروژه.' },
    { title: 'مهندسی', text: 'ترکیب قدرت و هوشمندی در یک سیستم منسجم و کاربردی.' },
    { title: 'یکپارچه‌سازی', text: 'اتصال تمام جزئیات با مسیری روشن برای بهره‌برداری و نگهداری.' },
  ],
  contactLabel: 'اتصال بعدی',
  contactTitle: 'انرژیِ فصل بعدی\nشما را بسازیم.',
  contactText: 'یک سیستم برق سنجیده، با گفت‌وگویی سنجیده آغاز می‌شود.',
  contactPending: 'اطلاعات تماس به‌زودی در دسترس خواهد بود.',
  footer: 'قدرت. هوشمندی. دقت.',
  top: 'بازگشت به بالا',
  metadataDescription:
    'برقینو؛ زیرساخت برق، کنترل هوشمند ساختمان و بهینه‌سازی انرژی. نمایش مفهومی انرژی هوشمند.',
};

export const content: Record<Locale, typeof en> = { en, fa };
export type SiteContent = typeof en;

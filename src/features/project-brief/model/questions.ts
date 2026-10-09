export const questions = {
  fa: [
    {
      title: 'چه چیزی می‌سازید؟',
      hint: 'نوع فضا، نقطهٔ شروع راه‌حل ماست.',
      key: 'type',
      options: [
        {
          value: 'development',
          title: 'مجتمع و ساختمان بزرگ',
          detail: 'مسکونی، اداری یا تجاری',
        },
        {
          value: 'home',
          title: 'خانه یا فضای کوچک‌تر',
          detail: 'یک واحد، ویلا یا فضای کاری',
        },
        {
          value: 'renovation',
          title: 'بازسازی و ارتقا',
          detail: 'بهبود تأسیسات یک فضای موجود',
        },
      ],
    },
    {
      title: 'پروژه در چه مرحله‌ای است؟',
      hint: 'برای هماهنگی درست، زمان ورود ما مهم است.',
      key: 'phase',
      options: [
        {
          value: 'planning',
          title: 'طراحی و برنامه‌ریزی',
          detail: 'هنوز اجرا شروع نشده',
        },
        {
          value: 'construction',
          title: 'در حال ساخت',
          detail: 'هماهنگی با برنامهٔ اجرا',
        },
        {
          value: 'existing',
          title: 'فضای ساخته‌شده',
          detail: 'بازدید و بررسی وضع موجود',
        },
      ],
    },
    {
      title: 'کدام بخش‌ها را به ما می‌سپارید؟',
      hint: 'می‌توانید بیش از یک مورد را انتخاب کنید.',
      key: 'services',
      options: [
        {
          value: 'installation',
          title: 'تأسیسات و توزیع برق',
          detail: 'اجرای زیرساخت و تابلوها',
        },
        {
          value: 'lighting',
          title: 'روشنایی',
          detail: 'طراحی و اجرای نور متناسب با فضا',
        },
        {
          value: 'smart',
          title: 'کنترل هوشمند',
          detail: 'روشنایی، سناریوها و کنترل فضا',
        },
      ],
    },
    {
      title: 'زمان مناسب برای شروع؟',
      hint: 'برنامه‌ریزی اولیه، بدون تعهد یا قیمت‌گذاری فوری.',
      key: 'timeline',
      options: [
        {
          value: 'soon',
          title: 'در اولین فرصت',
          detail: 'پروژه آمادهٔ گفت‌وگو است',
        },
        {
          value: 'quarter',
          title: 'در چند ماه آینده',
          detail: 'برای هماهنگی از حالا شروع کنیم',
        },
        {
          value: 'exploring',
          title: 'در حال بررسی',
          detail: 'ابتدا مسیر مناسب را بشناسیم',
        },
      ],
    },
  ],
  en: [
    {
      title: 'What are you building?',
      hint: 'The space gives our work its starting point.',
      key: 'type',
      options: [
        {
          value: 'development',
          title: 'A development or large building',
          detail: 'Residential, office, or commercial',
        },
        {
          value: 'home',
          title: 'A home or smaller space',
          detail: 'An apartment, villa, or workspace',
        },
        {
          value: 'renovation',
          title: 'A renovation or upgrade',
          detail: 'Improving an existing installation',
        },
      ],
    },
    {
      title: 'Where is the project now?',
      hint: 'The right time to join matters for coordination.',
      key: 'phase',
      options: [
        {
          value: 'planning',
          title: 'Design and planning',
          detail: 'Construction has not started',
        },
        {
          value: 'construction',
          title: 'Under construction',
          detail: 'Coordinate with the installation programme',
        },
        {
          value: 'existing',
          title: 'An existing space',
          detail: 'Start by reviewing the current conditions',
        },
      ],
    },
    {
      title: 'What would you like us to handle?',
      hint: 'Choose one or more disciplines.',
      key: 'services',
      options: [
        {
          value: 'installation',
          title: 'Electrical installation',
          detail: 'Infrastructure and power distribution',
        },
        {
          value: 'lighting',
          title: 'Lighting',
          detail: 'Light designed around the space',
        },
        {
          value: 'smart',
          title: 'Intelligent control',
          detail: 'Lighting, scenes, and room controls',
        },
      ],
    },
    {
      title: 'When would you like to begin?',
      hint: 'An initial plan, without an instant quote or commitment.',
      key: 'timeline',
      options: [
        {
          value: 'soon',
          title: 'As soon as practical',
          detail: 'The project is ready for a conversation',
        },
        {
          value: 'quarter',
          title: 'In the next few months',
          detail: 'Start coordination ahead of time',
        },
        {
          value: 'exploring',
          title: 'Still exploring',
          detail: 'First, understand the right approach',
        },
      ],
    },
  ],
} as const;

import { notFound } from 'next/navigation';
import { resolveLocale } from '@/shared/config/locale';
import { showcase } from '@/shared/config/showcase';
import { LocaleSwitch } from '@/features/locale/ui/LocaleSwitch';
import { PulseBackground, CurrentControl } from '@/widgets/pulse-background/ui/PulseBackground';
import { WorkGallery } from '@/widgets/work-gallery/ui/WorkGallery';
import { ProjectBrief } from '@/features/project-brief/ui/ProjectBrief';
import { Assistant } from '@/features/assistant/ui/Assistant';

export default async function Home({ params }: { params: Promise<{ locale?: string[] }> }) {
  const locale = resolveLocale((await params).locale);
  if (!locale) notFound();
  const copy = showcase[locale];
  const fa = locale === 'fa';
  return (
    <div className="showcase-shell">
      <header className="site-header">
        <a
          className="brand"
          href={`/${locale}/`}
          aria-label={fa ? 'برقینو، خانه' : 'Barghino home'}
        >
          <svg aria-hidden="true" viewBox="0 0 28 36">
            <path d="M16 0 1 21h12l-1 15 15-22H15z" fill="currentColor" />
          </svg>
          <span dir="ltr">
            BARGHINO<span className="brand-dot">.</span>
          </span>
        </a>
        <nav className="main-navigation" aria-label={fa ? 'بخش‌های سایت' : 'Site sections'}>
          {copy.nav.map((name, index) => (
            <a key={name} href={`#${['idea', 'work', 'project'][index]}`}>
              <span dir="ltr">0{index + 1}</span>
              {name}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a href={`/${locale}/journal/`}>{copy.journal}</a>
          <LocaleSwitch locale={locale} />
        </div>
      </header>
      <main id="main">
        <section className="landing-section" id="idea" aria-labelledby="hero-title">
          <PulseBackground />
          <div className="landing-registration" aria-hidden="true">
            <span>01 / THE IDEA</span>
            <i />
            <span>POWER. WITH PURPOSE.</span>
          </div>
          <div className="hero-editorial">
            <p className="eyebrow">
              <span className="status-dot" />
              {copy.eyebrow}
            </p>
            <h1 id="hero-title">
              <span>{copy.title[0]}</span>
              <span>
                {copy.title[1]}
                <i aria-hidden="true">↗</i>
              </span>
            </h1>
            <div className="hero-lower">
              <p>{copy.intro}</p>
              <a className="hero-work-link" href="#work">
                {copy.work}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="hero-bottom">
            <CurrentControl />
            <div className="expertise-index">
              {copy.expertise.map((item, index) => (
                <span key={item}>
                  <small dir="ltr">0{index + 1}</small>
                  {item}
                </span>
              ))}
            </div>
            <a className="scroll-marker" href="#work">
              <span aria-hidden="true">↓</span>
              {fa ? 'مدار را دنبال کنید' : 'FOLLOW THE CURRENT'}
            </a>
          </div>
        </section>
        <section className="work-section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <span className="chapter-index" dir="ltr">
                {copy.workLabel}
              </span>
              <h2 id="work-title">{copy.workTitle}</h2>
            </div>
            <p>{copy.workIntro}</p>
          </div>
          <WorkGallery locale={locale} />
          <div className="work-philosophy">
            <span dir="ltr">PLANNED. INSTALLED. CONNECTED.</span>
            <p>
              {fa
                ? 'از مجتمع‌های بزرگ تا خانه‌های کوچک‌تر؛ هر پروژه با نیازهای خودش.'
                : 'From large developments to individual homes. Every project has its own brief.'}
            </p>
          </div>
        </section>
        <section className="project-section" id="project" aria-labelledby="project-title">
          <div className="project-intro">
            <span className="chapter-index" dir="ltr">
              {copy.briefLabel}
            </span>
            <h2 id="project-title">{copy.briefTitle}</h2>
            <p>{copy.briefIntro}</p>
            <div className="project-connection-mark" aria-hidden="true">
              <span />
              <i />
              <span />
              <b>＋</b>
            </div>
            <a href={`/${locale}/journal/`}>
              {fa ? 'دربارهٔ طراحی و اجرا بخوانید' : 'Read about design and installation'}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ProjectBrief locale={locale} />
        </section>
      </main>
      <footer className="site-footer">
        <a href="#idea" className="footer-brand" dir="ltr">
          BARGHINO<span>.</span>
        </a>
        <span>{fa ? 'برق دقیق. زندگی هوشمند.' : 'PRECISE POWER. INTELLIGENT LIVING.'}</span>
        <a href={`/${locale}/journal/`}>{copy.journal} ↗</a>
        <small dir="ltr">© {new Date().getUTCFullYear()}</small>
      </footer>
      <Assistant locale={locale} />
    </div>
  );
}

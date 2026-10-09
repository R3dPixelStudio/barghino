import type { Locale } from '@/shared/config/locale';

const brands = [
  {
    name: 'Schneider',
    sub: 'Electric',
    category: ['توزیع و کنترل برق', 'Power & control'],
    href: 'https://www.se.com/ww/en/work/products/low-voltage-products-and-systems/',
    style: 'schneider',
  },
  {
    name: 'VIKO',
    sub: 'by Panasonic',
    category: ['کلید و پریز', 'Switches & sockets'],
    href: 'https://viko.panasonic.com/en/products/switch-socket',
    style: 'viko',
  },
  {
    name: 'Milwaukee',
    sub: 'TOOL',
    category: ['ابزار نصب', 'Installation tools'],
    href: 'https://www.milwaukeetool.com/products/power-tools/electrical-installation',
    style: 'milwaukee',
  },
  {
    name: 'ABB',
    sub: 'Electrification',
    category: ['تجهیزات ساختمان', 'Building equipment'],
    href: 'https://electrification.us.abb.com/industries',
    style: 'abb',
  },
  {
    name: 'Legrand',
    sub: 'Infrastructure',
    category: ['زیرساخت برق و شبکه', 'Power & data'],
    href: 'https://www.legrand.com/datacenter/gb-en/brands/legrand',
    style: 'legrand',
  },
  {
    name: 'BOSCH',
    sub: 'Professional',
    category: ['ابزار حرفه‌ای', 'Professional tools'],
    href: 'https://www.bosch-professional.com/middle-east/en/cordless-tools-131400-ocs-c/',
    style: 'bosch',
  },
];

export function Brands({ locale }: { locale: Locale }) {
  const fa = locale === 'fa';
  return (
    <section className="brands-section" id="brands" aria-labelledby="brands-title">
      <div className="brands-heading">
        <div>
          <span className="chapter-index" dir="ltr">
            THE COMPONENTS / OUR STANDARD
          </span>
          <h2 id="brands-title">
            {fa ? 'جزئیات، از انتخاب شروع می‌شود.' : 'Quality starts with the components.'}
          </h2>
        </div>
        <p>
          {fa
            ? 'برندهای تجهیزات و ابزار؛ انتخاب متناسب با نیاز هر پروژه.'
            : 'Equipment and tool brands. Selected to suit each project.'}
        </p>
      </div>
      <div className="brand-grid">
        {brands.map((brand, index) => (
          <a
            key={brand.name}
            href={brand.href}
            target="_blank"
            rel="noreferrer"
            className={`equipment-brand ${brand.style}`}
          >
            <span className="brand-terminal" aria-hidden="true" dir="ltr">
              0{index + 1}
              <i>↗</i>
            </span>
            <span className="equipment-wordmark" dir="ltr">
              <strong>{brand.name}</strong>
              <small>{brand.sub}</small>
            </span>
            <span className="equipment-category">{brand.category[fa ? 0 : 1]}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

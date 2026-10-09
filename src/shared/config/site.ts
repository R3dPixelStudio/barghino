const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
export const siteOrigin = configuredOrigin ? new URL(configuredOrigin) : undefined;

export const site = {
  brand: 'BARGHINO',
  brandFa: 'برقینو',
  // Populate only with verified company details. No fabricated contact endpoints.
  email: '',
  phone: '',
};

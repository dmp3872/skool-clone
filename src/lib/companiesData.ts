/**
 * Companies Data
 *
 * Peptide supplier referral links and coupon codes
 */

export interface Company {
  id: string;
  name: string;
  referralUrl: string;
  couponCode: string;
  notes?: string;
}

export const companies: Company[] = [
  {
    id: 'alpha-omega-peptide',
    name: 'Alpha Omega Peptide',
    referralUrl: 'https://alphaomegapeptide.com/products/ref/4/',
    couponCode: 'derek',
  },
  {
    id: 'amc-essentials',
    name: 'AMC Essentials',
    referralUrl: 'https://amc-essentials.com/shop/?ref=derek',
    couponCode: 'derek',
  },
  {
    id: 'amp-peptides',
    name: 'AMP Peptides (Ameano Peptides)',
    referralUrl: 'https://ameanopeptides.com/?ref=Derek15',
    couponCode: 'derek15',
  },
  {
    id: 'ascension-peptides',
    name: 'Ascension Peptides',
    referralUrl: 'https://ascensionpeptides.com/ref/derekpruski/',
    couponCode: 'DEREK',
  },
  {
    id: 'atomik-labz',
    name: 'Atomik Labz',
    referralUrl: 'https://atomiklabz.com/?aff=51',
    couponCode: 'derek15',
  },
  {
    id: 'biocase-innovations',
    name: 'Biocase Innovations',
    referralUrl: 'http://biocaseinnovations.com/',
    couponCode: 'peptideprice5',
  },
  {
    id: 'biomed-labs',
    name: 'Biomed Labs',
    referralUrl: 'https://biomedlabs.com/',
    couponCode: 'derek',
  },
  {
    id: 'double-r-labs',
    name: 'Double R Labs',
    referralUrl: 'https://doublerlabs.is/?ref=Derek',
    couponCode: 'derek',
    notes: 'Also derek30 for $30 OFF Tirzepatide 30mg. Excludes 5-amino, tadalafil, and 60mg sizes.',
  },
  {
    id: 'ez-peptides',
    name: 'EZ Peptides',
    referralUrl: 'https://ezpeptides.com/ref/derekliftz/',
    couponCode: 'derek',
    notes: 'Buy 2 Get 1 Free Sale',
  },
  {
    id: 'felixchem',
    name: 'FelixChem',
    referralUrl: 'https://felixchem.is/refer/3681/',
    couponCode: 'derek',
  },
  {
    id: 'flawless-compounds',
    name: 'Flawless Compounds',
    referralUrl: 'https://flawlesscompounds.com/?coupon=Derek15',
    couponCode: 'derek15',
  },
  {
    id: 'glow-aminos',
    name: 'Glow Aminos',
    referralUrl: 'https://glowaminos.com/?coupon=Derek15',
    couponCode: 'derek15',
  },
  {
    id: 'his-and-hers',
    name: 'His & Hers',
    referralUrl: 'https://his-and-hers.com/shop/research-peptides/?ref=derek',
    couponCode: 'derek',
  },
  {
    id: 'la-peptides',
    name: 'LA Peptides',
    referralUrl: 'https://lapeptides.net/?ref=peptideprice',
    couponCode: 'derek',
  },
  {
    id: 'mile-high-compounds',
    name: 'Mile High Compounds',
    referralUrl: 'https://milehighcompounds.is/aff/3/',
    couponCode: 'derek',
  },
  {
    id: 'modern-aminos',
    name: 'Modern Aminos',
    referralUrl: 'https://modernaminos.com/?ref=derek',
    couponCode: 'derek',
  },
  {
    id: 'omegamino',
    name: 'Omegamino',
    referralUrl: 'https://omegamino.net/?ref=Derek',
    couponCode: 'derek',
  },
  {
    id: 'paramount-peptides',
    name: 'Paramount Peptides',
    referralUrl: 'https://paramountpeptides.com/?ref=DEREKPRUSKI',
    couponCode: 'N/A',
  },
  {
    id: 'peptira',
    name: 'Peptira',
    referralUrl: 'https://peptira.com/?ref=Derek',
    couponCode: 'derek',
  },
  {
    id: 'peppy',
    name: 'Peppy (3D Peppy)',
    referralUrl: 'https://3dpeppy.myshopify.com/',
    couponCode: 'derek10',
  },
  {
    id: 'prime-peptides',
    name: 'Prime Peptides',
    referralUrl: 'https://primepeptides.co/?sca_ref=8658472.73VW1Vo4d1',
    couponCode: 'derek',
  },
  {
    id: 'refillpen',
    name: 'RefillPen',
    referralUrl: 'https://www.refillpen.com/?ref=DEREK',
    couponCode: 'derek',
  },
  {
    id: 'retaonelabs',
    name: 'RetaOneLabs',
    referralUrl: 'https://retaonelabs.com/ref/onn2k/',
    couponCode: 'derek',
  },
  {
    id: 'science-bio',
    name: 'Science Bio',
    referralUrl: 'https://science.bio/ref/2622/',
    couponCode: 'price',
  },
  {
    id: 'simple-peptide',
    name: 'Simple Peptide',
    referralUrl: 'https://simplepeptide.com/sp/peptideprice/',
    couponCode: 'derek',
  },
  {
    id: 'solution-peptides',
    name: 'Solution Peptides',
    referralUrl: 'https://solutionpeptides.net/aff/51',
    couponCode: 'derek15',
  },
  {
    id: 'southern-aminos',
    name: 'Southern Aminos',
    referralUrl: 'https://southernaminos.com/?coupon=derek15',
    couponCode: 'derek15',
  },
  {
    id: 'valor-peptides',
    name: 'Valor Peptides',
    referralUrl: 'https://valorpeptides.com/?ref=Derek',
    couponCode: 'derek',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    referralUrl: 'https://www.amazon.com/?tag=onamzderekpru-20',
    couponCode: 'N/A',
    notes: 'Affiliate link included in URL',
  },
];

// Sort companies alphabetically by name
companies.sort((a, b) => a.name.localeCompare(b.name));

// Get company by ID
export function getCompanyById(id: string): Company | undefined {
  return companies.find(c => c.id === id);
}

// Search companies by name
export function searchCompanies(query: string): Company[] {
  const lowerQuery = query.toLowerCase();
  return companies.filter(c =>
    c.name.toLowerCase().includes(lowerQuery)
  );
}

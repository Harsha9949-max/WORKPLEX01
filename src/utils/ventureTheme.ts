export const ventureTheme: Record<string, any> = {
  buyrix: {
    color: '#3B82F6',
    lightColor: '#93C5FD',
    bgColor: 'rgba(59,130,246,0.15)',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))',
    couponPrefix: 'BX',
    name: 'BuyRix',
    tagline: 'Digital Products Commerce',
    website: 'buyrix.in',
    taskFocus: 'digital products'
  },
  vyuma: {
    color: '#8B5CF6',
    lightColor: '#C4B5FD',
    bgColor: 'rgba(139,92,246,0.15)',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1))',
    couponPrefix: 'VY',
    name: 'Vyuma',
    tagline: 'Physical E-Commerce Marketplace',
    website: 'vyuma.shop',
    taskFocus: 'e-commerce products'
  },
  growplex: {
    color: '#00C9A7',
    lightColor: '#6EE7D5',
    bgColor: 'rgba(0,201,167,0.15)',
    gradient: 'linear-gradient(135deg, rgba(0,201,167,0.3), rgba(0,201,167,0.1))',
    couponPrefix: 'GP',
    name: 'Growplex',
    tagline: 'B2C SMM Panel',
    website: 'growplex.sbs',
    taskFocus: 'SMM panel engagement',
    manualWallet: true
  },
  zaestify: {
    color: '#E8B84B',
    lightColor: '#FCD34D',
    bgColor: 'rgba(232,184,75,0.15)',
    gradient: 'linear-gradient(135deg, rgba(232,184,75,0.3), rgba(232,184,75,0.1))',
    couponPrefix: 'ZS',
    name: 'Zaestify',
    tagline: 'Startup Incubator & Hub',
    website: 'zaestify.sbs',
    taskFocus: 'startup entrepreneurship',
    comingSoon: true
  }
};

export const getVentureTheme = (ventureKey?: string) => {
  const key = ventureKey?.toLowerCase() || 'buyrix';
  return ventureTheme[key] || ventureTheme['buyrix'];
};

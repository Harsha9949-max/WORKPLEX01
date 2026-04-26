export const ventureTheme: Record<string, any> = {
  buyrix: {
    color: '#3B82F6',
    lightColor: '#93C5FD',
    bgColor: 'rgba(59,130,246,0.15)',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))',
    couponPrefix: 'BX',
    name: 'BuyRix',
    tagline: 'Electronics & Gadgets',
    website: 'buyrix.in',
    taskFocus: 'electronics promotion'
  },
  vyuma: {
    color: '#8B5CF6',
    lightColor: '#C4B5FD',
    bgColor: 'rgba(139,92,246,0.15)',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1))',
    couponPrefix: 'VY',
    name: 'Vyuma',
    tagline: 'Lifestyle & Fashion',
    website: 'vyuma.shop',
    taskFocus: 'lifestyle content'
  },
  growplex: {
    color: '#00C9A7',
    lightColor: '#6EE7D5',
    bgColor: 'rgba(0,201,167,0.15)',
    gradient: 'linear-gradient(135deg, rgba(0,201,167,0.3), rgba(0,201,167,0.1))',
    couponPrefix: 'GP',
    name: 'Growplex',
    tagline: 'SMM Services',
    website: 'growplex.sbs',
    taskFocus: 'SMM promotion',
    manualWallet: true
  }
};

export const getVentureTheme = (ventureKey?: string) => {
  const key = ventureKey?.toLowerCase() || 'buyrix';
  return ventureTheme[key] || ventureTheme['buyrix'];
};

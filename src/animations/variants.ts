import { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20 }
};

export const containerVariants: Variants = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export const fireVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

export const modalVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { scale: 0.8, opacity: 0 }
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    color: ['#EF4444', '#FF6B6B', '#EF4444'],
    transition: { duration: 1, repeat: Infinity }
  }
};

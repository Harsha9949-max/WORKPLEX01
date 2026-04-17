import { 
  Award, 
  Zap, 
  TrendingUp, 
  Users, 
  Flame, 
  Target, 
  Star, 
  Shield, 
  Trophy, 
  Crown, 
  Rocket, 
  Gem 
} from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'Earning' | 'Activity' | 'Streak' | 'Social';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  condition: string;
}

export const BADGES: Badge[] = [
  { id: 'first_sale', name: 'First Sale', description: 'Complete your first task', icon: Zap, category: 'Activity', rarity: 'Common', condition: 'tasksCompleted >= 1' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Maintain a 7-day streak', icon: Flame, category: 'Streak', rarity: 'Rare', condition: 'streak >= 7' },
  { id: 'earn_10k', name: 'Rs.10K Club', description: 'Earn a total of Rs. 10,000', icon: TrendingUp, category: 'Earning', rarity: 'Rare', condition: 'totalEarned >= 10000' },
  { id: 'earn_50k', name: 'Rs.50K Legend', description: 'Earn a total of Rs. 50,000', icon: Award, category: 'Earning', rarity: 'Epic', condition: 'totalEarned >= 50000' },
  { id: 'team_builder', name: 'Team Builder', description: 'Refer 5 active members', icon: Users, category: 'Social', rarity: 'Rare', condition: 'directReferrals >= 5' },
  { id: 'venture_pro', name: 'Venture Pro', description: 'Work in 3 different ventures', icon: Target, category: 'Activity', rarity: 'Epic', condition: 'venturesWorked >= 3' },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a task after midnight', icon: Star, category: 'Activity', rarity: 'Common', condition: 'nightTask === true' },
  { id: 'consistent', name: 'Consistent', description: 'Maintain a 30-day streak', icon: Shield, category: 'Streak', rarity: 'Epic', condition: 'streak >= 30' },
  { id: 'top_earner', name: 'Top Earner', description: 'Rank #1 on any leaderboard', icon: Trophy, category: 'Earning', rarity: 'Legendary', condition: 'rank === 1' },
  { id: 'workaholic', name: 'Workaholic', description: 'Complete 10 tasks in one day', icon: Rocket, category: 'Activity', rarity: 'Rare', condition: 'dailyTasks >= 10' },
  { id: 'elite', name: 'WorkPlex Elite', description: 'Reach Legend level', icon: Crown, category: 'Activity', rarity: 'Legendary', condition: 'level === "Legend"' },
  { id: 'gem_collector', name: 'Gem Collector', description: 'Earn Rs. 1 Lakh total', icon: Gem, category: 'Earning', rarity: 'Legendary', condition: 'totalEarned >= 100000' },
];

export const getLevelInfo = (totalEarned: number) => {
  if (totalEarned >= 100000) return { current: 'Legend', next: 'Max', min: 100000, max: 1000000 };
  if (totalEarned >= 50000) return { current: 'Platinum', next: 'Legend', min: 50000, max: 100000 };
  if (totalEarned >= 25000) return { current: 'Gold', next: 'Platinum', min: 25000, max: 50000 };
  if (totalEarned >= 5000) return { current: 'Silver', next: 'Gold', min: 5000, max: 25000 };
  return { current: 'Bronze', next: 'Silver', min: 0, max: 5000 };
};

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  behance?: string;
  dribbble?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  profession?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: SocialLinks;
  createdAt?: string;
  updatedAt?: string;
}

export interface Portfolio {
  id: string;
  title: string;
  description: string;
  userId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  type?: 'about' | 'cv' | 'portfolio';
  theme?: string;
  layout?: string;
  sections?: PortfolioSection[];
  projects?: any[];
  subdomain?: string;
  customDomain?: string;
}

export interface PortfolioSection {
  id: string;
  title: string;
  type: string;
  content: any;
  order: number;
}

export interface AuthResponse {
  token: string;
  user: User;
} 
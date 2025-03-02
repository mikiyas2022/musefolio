export interface Section {
  id: string;
  title: string;
  type: string;
  content: string;
  order: number;
}

export interface Portfolio {
  id: string;
  title: string;
  description?: string;
  sections: Section[];
  templateId?: string;
  themeId?: string;
  userId: string;
  isPublished: boolean;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
} 
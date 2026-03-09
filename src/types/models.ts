export interface Project {
  id: string;
  topic: string;
  type: 'Article' | 'VideoPost' | 'Both';
  mode: 'Single' | 'Series';
  seriesCount?: number;
  tags: string[];
  tone: string;
  gist?: string;
  wordCount: number;
  status: 'Draft' | 'Outline' | 'Content' | 'Scheduled' | 'Published';
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  projectId: string;
  index: number;
  platform: 'WeChat_OA' | 'WeChat_Channels';
  outline?: {
    title: string;
    structure: string[];
  };
  content?: {
    text: string;
    images: { url: string; prompt?: string }[];
  };
  status: 'Pending' | 'Ready' | 'Published';
}

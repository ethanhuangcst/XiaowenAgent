export interface SchedulePolicy {
  startDate: string;
  frequency: 'Daily' | 'Weekly';
  time: string;
  weekdays?: number[];
}

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
  schedulePolicy?: SchedulePolicy;
  status: 'Draft' | 'Outline' | 'Content' | 'Scheduled' | 'Published';
  createdAt: Date;
  updatedAt: Date;
  prompt?: string;
  outline?: string;
}

export interface Outline {
  seriesTitle?: string;
  title: string;
  keyMessage: string;
  hook: string;
  tags?: string[];
  keywords?: string[];
  status?: '草稿' | '定稿';
}

export interface Post {
  id: string;
  projectId: string;
  index: number;
  platform: 'WeChat_OA' | 'WeChat_Channels';
  outline?: Outline;
  content?: {
    text: string;
    images: { url: string; prompt?: string }[];
  };
  status: 'Pending' | 'Ready' | 'Published';
}

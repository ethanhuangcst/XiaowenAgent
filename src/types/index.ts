export type ContentTone = "专业" | "故事化" | "干货" | "情绪价值" | "轻松";

export interface GenerateInput {
  topic: string;
  audience: string;
  goal: string;
  highlights: string[];
  tone: ContentTone;
  wordCount: number;
  callToAction: string;
}

export interface WechatArticleResult {
  titleOptions: string[];
  abstract: string;
  outline: string[];
  articleMarkdown: string;
  coverText: string;
  tags: string[];
}

export interface VideoPostResult {
  titleOptions: string[];
  openingHook: string;
  imagePlan: string[];
  postMarkdown: string;
  tags: string[];
}

export interface GeneratedContent {
  wechatArticle: WechatArticleResult;
  videoPost: VideoPostResult;
}

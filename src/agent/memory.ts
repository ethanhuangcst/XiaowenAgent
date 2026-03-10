import { db } from '../db/client.js';

export interface UserPreference {
  writingStyle: string;
  preferredTone: string;
  commonTags: string[];
  avgWordCount: number;
  preferredLLM: string;
}

export interface Memory {
  userPreferences: UserPreference;
  successfulOutlines: any[];
  successfulContents: any[];
  userFeedback: any[];
}

export class MemorySystem {
  private memory: Memory;
  
  constructor() {
    this.memory = {
      userPreferences: {
        writingStyle: '',
        preferredTone: '',
        commonTags: [],
        avgWordCount: 1500,
        preferredLLM: 'qwen'
      },
      successfulOutlines: [],
      successfulContents: [],
      userFeedback: []
    };
  }
  
  async learn(project: any, result: any, feedback?: any): Promise<void> {
    if (feedback) {
      this.memory.userFeedback.push({
        projectId: project.id,
        feedback,
        timestamp: new Date()
      });
    }
    
    if (result.type === 'outline' && feedback?.approved) {
      this.memory.successfulOutlines.push({
        topic: project.topic,
        outline: result.outline,
        prompt: project.prompt
      });
    }
    
    if (result.type === 'content' && feedback?.approved) {
      this.memory.successfulContents.push({
        topic: project.topic,
        content: result.content,
        style: feedback.style
      });
      
      this.updatePreferences(result.content);
    }
    
    await this.save();
  }
  
  private updatePreferences(content: any) {
    if (content.wordCount) {
      const counts = this.memory.successfulContents.map(c => c.content.wordCount);
      this.memory.userPreferences.avgWordCount = 
        counts.reduce((a, b) => a + b, 0) / counts.length;
    }
    
    if (content.tags && content.tags.length > 0) {
      const allTags = this.memory.successfulContents
        .flatMap(c => c.content.tags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      this.memory.userPreferences.commonTags = (Object.entries(tagCounts) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);
    }
  }
  
  async getRelevantMemory(context: any): Promise<Memory> {
    return this.memory;
  }
  
  private async save(): Promise<void> {
    // Memory is already stored in memory, no need to save to db
  }
  
  getPreferences(): UserPreference {
    return this.memory.userPreferences;
  }
}

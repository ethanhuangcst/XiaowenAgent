export interface UserPreferences {
  writingStyle: string;
  preferredTone: string;
  commonTags: string[];
  avgWordCount: number;
  lastUpdated: Date;
}

export interface HistoryRecord {
  timestamp: Date;
  action: string;
  result: any;
  feedback?: string;
}

export interface SuccessfulCase {
  id: string;
  outline: string;
  content: string;
  views: number;
  engagement: number;
  timestamp: Date;
}

export interface Memory {
  userPreferences: UserPreferences;
  history: HistoryRecord[];
  successfulCases: SuccessfulCase[];
}

export class AgentMemorySystem {
  private memory: Memory;

  constructor() {
    this.memory = {
      userPreferences: {
        writingStyle: '',
        preferredTone: '',
        commonTags: [],
        avgWordCount: 0,
        lastUpdated: new Date()
      },
      history: [],
      successfulCases: []
    };
  }

  getMemory(): Memory {
    return JSON.parse(JSON.stringify(this.memory));
  }

  getPreferences(): UserPreferences {
    return { ...this.memory.userPreferences };
  }

  getHistory(limit: number = 10): HistoryRecord[] {
    return this.memory.history.slice(-limit);
  }

  getSuccessfulCases(limit: number = 5): SuccessfulCase[] {
    return this.memory.successfulCases.slice(-limit);
  }

  getRelevantMemory(context: string): Memory {
    const relevantHistory = this.memory.history
      .filter(record => 
        record.action.includes(context) || 
        JSON.stringify(record.result).includes(context)
      )
      .slice(-10);
    
    const relevantCases = this.memory.successfulCases
      .filter(case_ => 
        case_.outline.includes(context) || 
        case_.content.includes(context)
      )
      .slice(-5);
    
    return {
      userPreferences: this.memory.userPreferences,
      history: relevantHistory,
      successfulCases: relevantCases
    };
  }

  learn(result: any, feedback?: string): void {
    const record: HistoryRecord = {
      timestamp: new Date(),
      action: 'learn',
      result,
      feedback
    };
    
    this.memory.history.push(record);
    
    if (feedback) {
      this.updatePreferences(result, feedback);
    }
    
    if (result.views && result.views >= 1000) {
      this.addSuccessfulCase(result);
    }
  }

  private updatePreferences(result: any, feedback: string): void {
    if (result.style) {
      this.memory.userPreferences.writingStyle = result.style;
    }
    
    if (result.tone) {
      this.memory.userPreferences.preferredTone = result.tone;
    }
    
    if (result.tags && Array.isArray(result.tags)) {
      const newTags = result.tags.filter((tag: string) => 
        !this.memory.userPreferences.commonTags.includes(tag)
      );
      this.memory.userPreferences.commonTags.push(...newTags);
    }
    
    if (result.wordCount) {
      const total = this.memory.userPreferences.avgWordCount * this.memory.history.length;
      this.memory.userPreferences.avgWordCount = 
        (total + result.wordCount) / (this.memory.history.length + 1);
    }
    
    this.memory.userPreferences.lastUpdated = new Date();
  }

  private addSuccessfulCase(result: any): void {
    const successCase: SuccessfulCase = {
      id: `case-${Date.now()}`,
      outline: result.outline || '',
      content: result.content || '',
      views: result.views || 0,
      engagement: result.engagement || 0,
      timestamp: new Date()
    };
    
    this.memory.successfulCases.push(successCase);
  }

  clear(): void {
    this.memory = {
      userPreferences: {
        writingStyle: '',
        preferredTone: '',
        commonTags: [],
        avgWordCount: 0,
        lastUpdated: new Date()
      },
      history: [],
      successfulCases: []
    };
  }
}

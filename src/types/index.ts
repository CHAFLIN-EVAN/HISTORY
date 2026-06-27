export interface TimelineEvent {
  year: string;
  event: string;
}

export interface HistoricalFigure {
  name: string;
  title: string;
  description: string;
}

export type NodeType = 'civilization' | 'dynasty' | 'period' | 'sub-period';

export interface DynastyNode {
  id: string;
  name: string;
  nameEn?: string;
  period?: string;
  type: NodeType;
  children?: DynastyNode[];
  content?: {
    overview: string;
    timeline: TimelineEvent[];
    figures: HistoricalFigure[];
    culture?: string;
    tags: string[];
  };
}

export interface UserNote {
  nodeId: string;
  text: string;
  updatedAt: number;
}

export interface UserData {
  notes: Record<string, UserNote>;
  favorites: string[];
  nodeOrder: string[];
}

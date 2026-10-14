export type ToolCategory = 'web' | 'recon' | 'network' | 'crypto' | 'custom';

export type ParameterType = 'string' | 'number' | 'boolean' | 'select' | 'array';

export interface ToolParameter {
  name: string;
  flag: string;
  type: ParameterType;
  label: string;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  options?: string[];
  required?: boolean;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface OutputParserConfig {
  type: string;
  summaryMetric?: string;
  regexFindings?: string;
}

export interface ToolDefinition {
  $schema?: string;
  id: string;
  name: string;
  version: string;
  author: string;
  githubUrl?: string;
  category: ToolCategory;
  tags?: string[];
  description: string;
  entrypoint: string;
  attached: boolean;
  isBuiltIn?: boolean;
  parameters: ToolParameter[];
  outputParser?: OutputParserConfig;
}

export interface TaskExecution {
  id: string;
  toolId: string;
  toolName: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  logs: string[];
  parsedFindings?: any;
  exitCode?: number | null;
}

export interface WordlistMetadata {
  filename: string;
  path: string;
  linesCount: number;
  description: string;
}

import { ToolDefinition, TaskExecution } from './tool';

export interface PipelineStep {
  id: string;
  toolId: string;
  name: string;
  parameterOverrides: Record<string, any>;
  // Condition to execute this step: e.g. "always", or "if_port_open:80,443", or "if_endpoints_found"
  condition?: {
    type: 'always' | 'if_ports_open' | 'if_endpoints_found' | 'if_previous_success';
    value?: string;
  };
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: PipelineStep[];
  isBuiltIn?: boolean;
}

export interface PipelineExecutionRecord {
  id: string;
  pipelineId: string;
  pipelineName: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
  currentStepIndex: number;
  totalSteps: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  stepResults: {
    stepId: string;
    stepName: string;
    toolId: string;
    taskId?: string;
    status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
    command?: string;
    durationMs?: number;
    logs: string[];
    parsedFindings?: any;
    skipReason?: string;
  }[];
}

export interface TargetScope {
  id: string;
  name: string;
  primaryDomain: string;
  organization: string;
  ipRanges: string[];
  hostnames: string[];
  exclusions: string[];
  description: string;
  lastScanned?: number;
  tags?: string[];
}

export interface DiscoveredAsset {
  id: string;
  targetId: string;
  type: 'port' | 'endpoint' | 'subdomain' | 'service';
  value: string;
  details?: Record<string, any>;
  discoveredAt: number;
  firstSeenScanId?: string;
}

export interface ScheduledScan {
  id: string;
  name: string;
  type: 'tool' | 'pipeline';
  targetEntityId: string; // toolId or pipelineId
  targetScopeId: string;
  cadence: 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  lastDiff?: {
    hasChanges: boolean;
    newPorts: number[];
    closedPorts: number[];
    newEndpoints: string[];
    summary: string;
  };
}

export interface WebhookConfig {
  id: string;
  platform: 'discord' | 'slack' | 'telegram' | 'custom';
  url: string;
  botToken?: string;
  chatId?: string;
  enabled: boolean;
  alertOnComplete: boolean;
  alertOnFailure: boolean;
  alertOnlyOnChanges: boolean;
}

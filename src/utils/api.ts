import { ToolDefinition, TaskExecution, WordlistMetadata } from '../types/tool';
import {
  PipelineDefinition,
  PipelineExecutionRecord,
  TargetScope,
  DiscoveredAsset,
  ScheduledScan,
  WebhookConfig,
} from '../types/pipeline';

// Tools API
export async function fetchTools(): Promise<ToolDefinition[]> {
  const resp = await fetch('/api/tools');
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tools');
  }
  return data.tools;
}

export async function toggleToolAttached(toolId: string, attached: boolean): Promise<void> {
  const resp = await fetch(`/api/tools/${toolId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attached }),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update tool status');
  }
}

export async function registerTool(toolData: Partial<ToolDefinition> & { scriptContent?: string }): Promise<ToolDefinition> {
  const resp = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toolData),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to register tool');
  }
  return data.tool;
}

export async function deleteTool(toolId: string): Promise<void> {
  const resp = await fetch(`/api/tools/${toolId}`, {
    method: 'DELETE',
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete tool');
  }
}

export async function executeTool(toolId: string, params: Record<string, any>): Promise<{ taskId: string; command: string }> {
  const resp = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, params }),
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Execution failed');
  }
  return { taskId: data.taskId, command: data.command };
}

export async function fetchTasks(): Promise<TaskExecution[]> {
  const resp = await fetch('/api/tasks');
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tasks');
  }
  return data.tasks;
}

export async function fetchTask(taskId: string): Promise<TaskExecution> {
  const resp = await fetch(`/api/tasks/${taskId}`);
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch task');
  }
  return data.task;
}

export async function killTask(taskId: string): Promise<void> {
  const resp = await fetch(`/api/tasks/${taskId}/kill`, {
    method: 'POST',
  });
  const data = await resp.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to kill task');
  }
}

export async function fetchWordlists(): Promise<WordlistMetadata[]> {
  const resp = await fetch('/api/wordlists');
  const data = await resp.json();
  if (!data.success) {
    return [];
  }
  return data.wordlists || [];
}

// -------------------------------------------------------------
// PIPELINES API
// -------------------------------------------------------------
export async function fetchPipelines(): Promise<PipelineDefinition[]> {
  const resp = await fetch('/api/pipelines');
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch pipelines');
  return data.pipelines;
}

export async function savePipeline(pipeline: PipelineDefinition): Promise<PipelineDefinition> {
  const resp = await fetch('/api/pipelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to save pipeline');
  return data.pipeline;
}

export async function deletePipeline(id: string): Promise<void> {
  const resp = await fetch(`/api/pipelines/${id}`, { method: 'DELETE' });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete pipeline');
}

export async function executePipeline(pipelineId: string, target: string): Promise<{ executionId: string }> {
  const resp = await fetch('/api/pipelines/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipelineId, target }),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to trigger pipeline execution');
  return { executionId: data.executionId };
}

export async function fetchPipelineExecutions(): Promise<PipelineExecutionRecord[]> {
  const resp = await fetch('/api/pipelines/executions');
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch pipeline executions');
  return data.executions;
}

// -------------------------------------------------------------
// TARGETS & ASSET LEDGER API
// -------------------------------------------------------------
export async function fetchTargets(): Promise<TargetScope[]> {
  const resp = await fetch('/api/targets');
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch targets');
  return data.targets;
}

export async function saveTarget(target: TargetScope): Promise<TargetScope> {
  const resp = await fetch('/api/targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(target),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to save target');
  return data.target;
}

export async function deleteTarget(id: string): Promise<void> {
  const resp = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete target');
}

export async function fetchAssets(targetId?: string): Promise<DiscoveredAsset[]> {
  const url = targetId ? `/api/assets?targetId=${encodeURIComponent(targetId)}` : '/api/assets';
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch assets');
  return data.assets;
}

// -------------------------------------------------------------
// SCHEDULED SCANS & DIFFING API
// -------------------------------------------------------------
export async function fetchSchedules(): Promise<ScheduledScan[]> {
  const resp = await fetch('/api/schedules');
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch schedules');
  return data.schedules;
}

export async function saveSchedule(schedule: ScheduledScan): Promise<ScheduledScan> {
  const resp = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to save schedule');
  return data.schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const resp = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete schedule');
}

// -------------------------------------------------------------
// WEBHOOKS API
// -------------------------------------------------------------
export async function fetchWebhooks(): Promise<WebhookConfig[]> {
  const resp = await fetch('/api/webhooks');
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch webhooks');
  return data.webhooks;
}

export async function saveWebhook(webhook: WebhookConfig): Promise<WebhookConfig> {
  const resp = await fetch('/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhook),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to save webhook');
  return data.webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  const resp = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete webhook');
}

export async function testWebhook(platform: string, url: string): Promise<{ success: boolean; message: string }> {
  const resp = await fetch('/api/webhooks/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, url }),
  });
  return await resp.json();
}

import { ToolDefinition, TaskExecution, WordlistMetadata } from '../types/tool';

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

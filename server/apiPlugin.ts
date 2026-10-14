import { Plugin } from 'vite';
import express, { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ToolDefinition, TaskExecution } from '../src/types/tool';
import { setupExtendedRoutes } from './extendedModules';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TOOLS_DIR = path.resolve(process.cwd(), 'tools');
const WORDLISTS_DIR = path.resolve(process.cwd(), 'wordlists');
const CUSTOM_TOOLS_FILE = path.join(DATA_DIR, 'custom_tools.json');
const TOOL_STATES_FILE = path.join(DATA_DIR, 'tool_states.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ActiveProcessInfo {
  process: ChildProcess;
  task: TaskExecution;
  listeners: ((chunk: string, eventType?: string) => void)[];
}

const activeTasks = new Map<string, TaskExecution>();
const runningProcesses = new Map<string, ActiveProcessInfo>();

function getToolStates(): Record<string, boolean> {
  try {
    if (fs.existsSync(TOOL_STATES_FILE)) {
      return JSON.parse(fs.readFileSync(TOOL_STATES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading tool states:', err);
  }
  return {};
}

function saveToolStates(states: Record<string, boolean>) {
  try {
    fs.writeFileSync(TOOL_STATES_FILE, JSON.stringify(states, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving tool states:', err);
  }
}

function getCustomTools(): ToolDefinition[] {
  try {
    if (fs.existsSync(CUSTOM_TOOLS_FILE)) {
      return JSON.parse(fs.readFileSync(CUSTOM_TOOLS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading custom tools:', err);
  }
  return [];
}

function saveCustomTools(tools: ToolDefinition[]) {
  try {
    fs.writeFileSync(CUSTOM_TOOLS_FILE, JSON.stringify(tools, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving custom tools:', err);
  }
}

function loadAllTools(): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  const toolStates = getToolStates();

  // 1. Scan tools/ directory for built-in tools
  if (fs.existsSync(TOOLS_DIR)) {
    const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(TOOLS_DIR, entry.name, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const raw = fs.readFileSync(manifestPath, 'utf-8');
            const manifest: ToolDefinition = JSON.parse(raw);
            manifest.isBuiltIn = true;
            if (toolStates[manifest.id] !== undefined) {
              manifest.attached = toolStates[manifest.id];
            } else if (manifest.attached === undefined) {
              manifest.attached = true;
            }
            tools.push(manifest);
          } catch (err) {
            console.error(`Error loading manifest at ${manifestPath}:`, err);
          }
        }
      }
    }
  }

  // 2. Load custom user tools
  const customTools = getCustomTools();
  for (const ct of customTools) {
    if (toolStates[ct.id] !== undefined) {
      ct.attached = toolStates[ct.id];
    }
    tools.push(ct);
  }

  return tools;
}

export function cyberSuiteBackendPlugin(): Plugin {
  return {
    name: 'cybersuite-backend-api',
    configureServer(server) {
      const app = express();
      app.use(express.json());

      // GET /api/tools - List all tools (built-in + custom, attached & detached)
      app.get('/api/tools', (req: Request, res: Response) => {
        try {
          const tools = loadAllTools();
          res.json({ success: true, count: tools.length, tools });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      // PATCH /api/tools/:id/status - Toggle attached / detached status
      app.patch('/api/tools/:id/status', (req: Request, res: Response) => {
        const { id } = req.params;
        const { attached } = req.body;

        if (typeof attached !== 'boolean') {
          res.status(400).json({ success: false, error: 'Field "attached" must be a boolean' });
          return;
        }

        const states = getToolStates();
        states[id] = attached;
        saveToolStates(states);

        res.json({ success: true, id, attached });
      });

      // POST /api/tools - Register / attach a new tool (Manifest + optional python code)
      app.post('/api/tools', (req: Request, res: Response) => {
        try {
          const toolData: ToolDefinition & { scriptContent?: string } = req.body;

          if (!toolData.id || !toolData.name || !toolData.parameters) {
            res.status(400).json({ success: false, error: 'Missing required manifest fields: id, name, parameters' });
            return;
          }

          // Clean ID slug
          const toolId = toolData.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const targetToolDir = path.join(TOOLS_DIR, toolId);

          if (!fs.existsSync(targetToolDir)) {
            fs.mkdirSync(targetToolDir, { recursive: true });
          }

          // If script content is provided, save it as main.py
          let entrypoint = toolData.entrypoint || `tools/${toolId}/main.py`;
          if (toolData.scriptContent) {
            const scriptPath = path.join(targetToolDir, 'main.py');
            fs.writeFileSync(scriptPath, toolData.scriptContent, 'utf-8');
            try {
              fs.chmodSync(scriptPath, 0o755);
            } catch (e) {
              // Ignore chmod errors on windows/non-posix
            }
            entrypoint = `tools/${toolId}/main.py`;
          }

          const newTool: ToolDefinition = {
            $schema: 'cybertool-v1',
            id: toolId,
            name: toolData.name,
            version: toolData.version || '1.0.0',
            author: toolData.author || 'Custom Author',
            githubUrl: toolData.githubUrl || '',
            category: toolData.category || 'custom',
            tags: toolData.tags || ['custom'],
            description: toolData.description || 'Custom security tool',
            entrypoint: entrypoint,
            attached: true,
            isBuiltIn: false,
            parameters: toolData.parameters,
            outputParser: toolData.outputParser || { type: 'auto' }
          };

          // Save manifest in tool directory
          const manifestPath = path.join(targetToolDir, 'manifest.json');
          fs.writeFileSync(manifestPath, JSON.stringify(newTool, null, 2), 'utf-8');

          // Update custom tools list
          const custom = getCustomTools().filter(t => t.id !== toolId);
          custom.push(newTool);
          saveCustomTools(custom);

          // Mark attached
          const states = getToolStates();
          states[toolId] = true;
          saveToolStates(states);

          res.json({ success: true, tool: newTool });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      // DELETE /api/tools/:id - Delete a custom tool or detach
      app.delete('/api/tools/:id', (req: Request, res: Response) => {
        const { id } = req.params;
        const custom = getCustomTools();
        const exists = custom.some(t => t.id === id);

        if (exists) {
          const filtered = custom.filter(t => t.id !== id);
          saveCustomTools(filtered);
        }

        // Mark as detached
        const states = getToolStates();
        states[id] = false;
        saveToolStates(states);

        res.json({ success: true, id, message: 'Tool detached and unlinked successfully' });
      });

      // POST /api/execute - Spawn Python CLI process
      app.post('/api/execute', (req: Request, res: Response) => {
        try {
          const { toolId, params } = req.body;
          const tools = loadAllTools();
          const tool = tools.find(t => t.id === toolId);

          if (!tool) {
            res.status(404).json({ success: false, error: `Tool "${toolId}" not found` });
            return;
          }

          if (!tool.attached) {
            res.status(400).json({ success: false, error: `Tool "${tool.name}" is currently detached. Attach it first.` });
            return;
          }

          // Build CLI arguments from manifest parameters
          const cliArgs: string[] = [tool.entrypoint];
          const renderedDisplayParts: string[] = ['python3', tool.entrypoint];

          for (const param of tool.parameters) {
            const val = params?.[param.name] !== undefined ? params[param.name] : param.defaultValue;

            if (param.type === 'boolean') {
              if (val === true) {
                cliArgs.push(param.flag);
                renderedDisplayParts.push(param.flag);
              }
            } else if (val !== undefined && val !== null && val !== '') {
              cliArgs.push(param.flag);
              cliArgs.push(String(val));
              renderedDisplayParts.push(param.flag, String(val).includes(' ') ? `"${val}"` : String(val));
            }
          }

          const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const fullCommand = renderedDisplayParts.join(' ');

          const taskRecord: TaskExecution = {
            id: taskId,
            toolId: tool.id,
            toolName: tool.name,
            command: fullCommand,
            status: 'running',
            startTime: Date.now(),
            logs: [`\x1b[36m[*] Initializing ${tool.name}...\x1b[0m\n`, `\x1b[34m[*] Command: ${fullCommand}\x1b[0m\n\n`],
            parsedFindings: null
          };

          activeTasks.set(taskId, taskRecord);

          // Spawn python3 with unbuffered output
          const child = spawn('python3', cliArgs, {
            cwd: process.cwd(),
            env: {
              ...process.env,
              PYTHONUNBUFFERED: '1',
              FORCE_COLOR: '1'
            }
          });

          const activeInfo: ActiveProcessInfo = {
            process: child,
            task: taskRecord,
            listeners: []
          };
          runningProcesses.set(taskId, activeInfo);

          let fullOutputAccumulator = '';

          child.stdout.on('data', (data: Buffer) => {
            const chunk = data.toString();
            taskRecord.logs.push(chunk);
            fullOutputAccumulator += chunk;
            for (const listener of activeInfo.listeners) {
              listener(chunk, 'stdout');
            }
          });

          child.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            taskRecord.logs.push(chunk);
            fullOutputAccumulator += chunk;
            for (const listener of activeInfo.listeners) {
              listener(chunk, 'stderr');
            }
          });

          child.on('close', (code: number | null) => {
            taskRecord.endTime = Date.now();
            taskRecord.durationMs = taskRecord.endTime - taskRecord.startTime;
            taskRecord.exitCode = code;

            if (taskRecord.status === 'running') {
              taskRecord.status = code === 0 ? 'completed' : 'failed';
            }

            // Extract structured findings JSON block if present
            const jsonMatch = fullOutputAccumulator.match(/<<<CYBERSUITE_FINDINGS_JSON>>>([\s\S]*?)<<<END_CYBERSUITE_FINDINGS_JSON>>>/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                taskRecord.parsedFindings = JSON.parse(jsonMatch[1].trim());
              } catch (e) {
                console.error('Failed to parse findings JSON:', e);
              }
            }

            for (const listener of activeInfo.listeners) {
              listener(
                JSON.stringify({
                  status: taskRecord.status,
                  exitCode: code,
                  durationMs: taskRecord.durationMs,
                  parsedFindings: taskRecord.parsedFindings
                }),
                'done'
              );
            }

            runningProcesses.delete(taskId);
          });

          child.on('error', (err: Error) => {
            taskRecord.status = 'failed';
            taskRecord.endTime = Date.now();
            taskRecord.durationMs = taskRecord.endTime - taskRecord.startTime;
            taskRecord.logs.push(`\n\x1b[31m[-] Execution error: ${err.message}\x1b[0m\n`);

            for (const listener of activeInfo.listeners) {
              listener(`Execution error: ${err.message}`, 'error');
            }
            runningProcesses.delete(taskId);
          });

          res.json({
            success: true,
            taskId,
            command: fullCommand,
            status: taskRecord.status
          });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      // GET /api/tasks - List all recent tasks
      app.get('/api/tasks', (req: Request, res: Response) => {
        const tasks = Array.from(activeTasks.values()).sort((a, b) => b.startTime - a.startTime);
        res.json({ success: true, count: tasks.length, tasks });
      });

      // GET /api/tasks/:id - Get specific task details
      app.get('/api/tasks/:id', (req: Request, res: Response) => {
        const { id } = req.params;
        const task = activeTasks.get(id);

        if (!task) {
          res.status(404).json({ success: false, error: `Task "${id}" not found` });
          return;
        }

        res.json({ success: true, task });
      });

      // GET /api/tasks/:id/stream - Server-Sent Events (SSE) live streaming
      app.get('/api/tasks/:id/stream', (req: Request, res: Response) => {
        const { id } = req.params;
        const task = activeTasks.get(id);

        if (!task) {
          res.status(404).json({ success: false, error: `Task "${id}" not found` });
          return;
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        // Send existing buffered logs immediately
        for (const line of task.logs) {
          res.write(`data: ${JSON.stringify({ type: 'log', chunk: line })}\n\n`);
        }

        // If already finished, close right away
        if (task.status !== 'running') {
          res.write(
            `data: ${JSON.stringify({
              type: 'done',
              status: task.status,
              durationMs: task.durationMs,
              parsedFindings: task.parsedFindings
            })}\n\n`
          );
          res.end();
          return;
        }

        // Register listener for live chunks
        const activeInfo = runningProcesses.get(id);
        if (activeInfo) {
          const listener = (chunk: string, eventType?: string) => {
            if (eventType === 'done') {
              res.write(`data: ${JSON.stringify({ type: 'done', payload: JSON.parse(chunk) })}\n\n`);
              res.end();
            } else {
              res.write(`data: ${JSON.stringify({ type: 'log', chunk })}\n\n`);
            }
          };

          activeInfo.listeners.push(listener);

          req.on('close', () => {
            const index = activeInfo.listeners.indexOf(listener);
            if (index !== -1) {
              activeInfo.listeners.splice(index, 1);
            }
          });
        } else {
          res.end();
        }
      });

      // POST /api/tasks/:id/kill - Terminate running process
      app.post('/api/tasks/:id/kill', (req: Request, res: Response) => {
        const { id } = req.params;
        const activeInfo = runningProcesses.get(id);

        if (!activeInfo) {
          res.status(404).json({ success: false, error: `No active process found for task "${id}"` });
          return;
        }

        try {
          activeInfo.task.status = 'aborted';
          activeInfo.task.logs.push('\n\x1b[33m[!] Process interrupted and terminated by user request.\x1b[0m\n');
          activeInfo.process.kill('SIGTERM');
          setTimeout(() => {
            if (runningProcesses.has(id)) {
              try {
                activeInfo.process.kill('SIGKILL');
              } catch (e) {
                // Ignore
              }
            }
          }, 1500);

          res.json({ success: true, message: `Task "${id}" killed.` });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      // GET /api/wordlists - Wordlists inventory
      app.get('/api/wordlists', (req: Request, res: Response) => {
        try {
          const wordlists = [];
          if (fs.existsSync(WORDLISTS_DIR)) {
            const files = fs.readdirSync(WORDLISTS_DIR);
            for (const f of files) {
              const fullPath = path.join(WORDLISTS_DIR, f);
              const stats = fs.statSync(fullPath);
              if (stats.isFile()) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
                wordlists.push({
                  filename: f,
                  path: `wordlists/${f}`,
                  linesCount: lines.length,
                  preview: lines.slice(0, 5)
                });
              }
            }
          }
          res.json({ success: true, wordlists });
        } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
        }
      });

      // Mount extended modules (Pipelines, Targets, Schedules, Webhooks)
      setupExtendedRoutes(app);

      // Attach backend Express app to Vite dev server middlewares
      server.middlewares.use(app);
    }
  };
}

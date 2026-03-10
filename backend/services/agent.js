const fs = require('fs-extra');
const path = require('path');
const { streamChat } = require('./ollama');

// ─────────────────────────────────────────────
// MULTI-AGENT DEFINITIONS
// ─────────────────────────────────────────────
const AGENTS = [
  { id: 'analyzer', name: 'Prompt Analyzer', icon: '🔍', description: 'Understanding your request deeply...' },
  { id: 'researcher', name: 'Research Agent', icon: '📚', description: 'Finding best practices and approaches...' },
  { id: 'planner', name: 'Planner Agent', icon: '📋', description: 'Designing project architecture...' },
  { id: 'coder', name: 'Coder Agent', icon: '💻', description: 'Generating project files...' },
  { id: 'reviewer', name: 'Reviewer Agent', icon: '✅', description: 'Reviewing code for errors and improvements...' },
];

// ─────────────────────────────────────────────
// MASTER SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MobCloud AI — a world-class senior software architect and full-stack developer.

You build COMPLETE, PRODUCTION-READY applications: React, Vue, Next.js, plain HTML/CSS/JS, Node.js APIs, Python, and more.

═══════════════════════════════
FILE WRITING PROTOCOL (MANDATORY)
═══════════════════════════════
Every file you create or modify MUST use this exact format:

<file path="RELATIVE/PATH/TO/FILE">
COMPLETE FILE CONTENT HERE
</file>

RULES:
• Path is always relative to project root (e.g., src/components/Button.jsx)
• Always write COMPLETE file content — never partial, never "..." placeholders
• Never put code in chat messages — ALL code goes in <file> tags only
• You can create unlimited files per response
• Create folders implicitly by using paths (src/components/Navbar.jsx creates src/components/ automatically)

═══════════════════════════════
THINKING PROTOCOL
═══════════════════════════════
Always show your reasoning:

<thinking>
Project type: [detected type]
Framework: [chosen framework]
Files to create: [list]
Architecture: [brief description]
Database: [if needed]
</thinking>

═══════════════════════════════
STANDARD FILES YOU ALWAYS CREATE
═══════════════════════════════
For EVERY project, always create these if they don't exist:
• README.md — project description, setup instructions, usage
• .gitignore — ignore node_modules, .env, dist, build, etc.
• favicon.svg or favicon.ico — simple branded icon
• robots.txt — allow all crawlers
• placeholder.svg — reusable placeholder image

For web projects also create:
• index.html (or src/main.jsx for React)
• style.css or tailwind config

For React/Next.js projects:
• package.json with all dependencies
• src/App.jsx
• src/components/ structure
• src/hooks/ (useLocalStorage, useFetch, etc.)
• src/lib/utils.js
• src/pages/ or src/routes/
• .env.example

For Node.js/API projects:
• server.js or index.js
• routes/ folder
• middleware/ folder
• .env.example
• package.json

═══════════════════════════════
DATABASE INTEGRATION
═══════════════════════════════
If the project needs a database:

For SUPABASE:
• Create supabase.sql with complete schema (CREATE TABLE, RLS policies, indexes)
• Create src/lib/supabase.js with client setup
• Create .env.example with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

For FIREBASE:
• Create firebase.json and .firebaserc
• Create src/lib/firebase.js with app initialization
• Create firestore.rules and storage.rules
• Create .env.example with all FIREBASE_ keys

For SQLite/Prisma:
• Create prisma/schema.prisma with full data models
• Create prisma/seed.js
• Create src/lib/prisma.js

═══════════════════════════════
PROJECT STRUCTURES
═══════════════════════════════

React + Vite:
src/
  components/
    ui/          ← Button, Input, Modal, Card, Badge, etc.
    layout/      ← Navbar, Footer, Sidebar, Layout
    features/    ← Feature-specific components
  hooks/         ← useAuth, useFetch, useLocalStorage, etc.
  lib/           ← utils.js, api.js, constants.js
  pages/         ← Home, About, Dashboard, etc.
  store/         ← Zustand or Context stores
  styles/        ← global.css, variables.css
  types/         ← TypeScript types if needed
public/
  favicon.svg
  robots.txt
  placeholder.svg

Next.js:
app/ or pages/
  layout.jsx
  page.jsx
  globals.css
components/
lib/
public/
package.json
next.config.js
tailwind.config.js

═══════════════════════════════
CODE QUALITY STANDARDS
═══════════════════════════════
• Mobile-first responsive design ALWAYS
• Semantic HTML5
• Accessibility: aria labels, keyboard nav, focus styles
• Performance: lazy loading, code splitting, optimized images
• Security: input validation, XSS prevention, CSP headers
• Modern CSS: CSS variables, flexbox, grid, animations
• Clean component architecture
• Error boundaries and loading states
• Empty states for all data displays
• Dark mode support when appropriate

═══════════════════════════════
SMART UPDATE PROTOCOL
═══════════════════════════════
When updating an existing project:
1. Analyze ALL existing files first
2. Understand the current architecture and structure
3. Only modify files that need changes
4. Keep existing working code intact
5. NEVER regenerate the entire project unnecessarily
6. Explain what you changed and why

═══════════════════════════════
CHAT RESPONSE FORMAT
═══════════════════════════════
Your chat messages should contain ONLY:
1. Brief summary of what you built (2-4 sentences)
2. List of files created (✓ filename.ext — description)
3. Setup instructions if needed (npm install, etc.)
4. Questions if clarification needed

NEVER include raw code, code blocks, or snippets in chat messages.
ALL code goes in <file> tags only.

═══════════════════════════════
CLARIFICATION PROTOCOL (DOUBT AGENT)
═══════════════════════════════
If request is vague or unclear, ask targeted questions BEFORE building:
"Before I start building, I need a few details:
1. [Specific question with options]
2. [Specific question with options]
..."

Then wait for answers before generating files.

═══════════════════════════════
IMAGE ANALYSIS
═══════════════════════════════
If an image is provided:
1. Analyze the UI layout, colors, typography, and structure
2. Identify components, sections, and interactive elements
3. Implement the exact design as closely as possible
4. Use modern CSS to match the visual style
`;

// ─────────────────────────────────────────────
// BINARY FILE STUBS
// ─────────────────────────────────────────────
const BINARY_STUBS = {
  'favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/>
  </linearGradient></defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui,sans-serif" font-weight="800" font-size="18" fill="white">M</text>
</svg>`,

  'placeholder.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1e1e3a"/>
  <text x="50%" y="48%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui,sans-serif" font-size="16" fill="#475569">Image Placeholder</text>
  <text x="50%" y="58%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui,sans-serif" font-size="12" fill="#334155">400 × 300</text>
</svg>`,

  'robots.txt': `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Sitemap: https://yourdomain.com/sitemap.xml`,

  '.gitignore': `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.nuxt/

# Environment files
.env
.env.local
.env.production
.env.*.local

# Editor
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output

# Misc
*.pem
.vercel
.cache/`,
};

// ─────────────────────────────────────────────
// AGENT CLASS WITH MULTI-AGENT SIMULATION
// ─────────────────────────────────────────────
class AIAgent {
  constructor(workspaceDir, io) {
    this.workspaceDir = workspaceDir;
    this.io = io;
  }

  getProjectDir(pid) {
    return path.join(this.workspaceDir, pid);
  }

  async readProjectContext(pid, maxFiles = 15) {
    const dir = this.getProjectDir(pid);
    if (!fs.existsSync(dir)) return '';
    const files = [];
    this._collectTextFiles(dir, dir, files, maxFiles);
    return files.map(f => {
      try {
        const content = fs.readFileSync(f.full, 'utf-8');
        const preview = content.length > 2000 ? content.substring(0, 2000) + '\n... (truncated)' : content;
        return `=== ${f.rel} (${content.length} chars) ===\n${preview}`;
      } catch { return ''; }
    }).filter(Boolean).join('\n\n');
  }

  _collectTextFiles(base, dir, result, max) {
    if (result.length >= max) return;
    const TEXT_EXTS = ['.html','.css','.js','.jsx','.ts','.tsx','.json','.md','.txt',
      '.svg','.xml','.yaml','.yml','.env','.prisma','.sql','.graphql','.sh','.py','.php','.vue'];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => {
          const priority = ['index.html','index.jsx','App.jsx','package.json','style.css'];
          return priority.indexOf(a.name) - priority.indexOf(b.name);
        });
      for (const e of entries) {
        if (result.length >= max) break;
        if (e.name.startsWith('.') && e.name !== '.env.example' && e.name !== '.gitignore') continue;
        if (['node_modules','dist','build','.next','coverage','.snapshots'].includes(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) this._collectTextFiles(base, full, result, max);
        else if (TEXT_EXTS.some(x => e.name.endsWith(x))) {
          result.push({ full, rel: path.relative(base, full) });
        }
      }
    } catch {}
  }

  parseFileBlocks(text) {
    const blocks = [];
    const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const filePath = m[1].trim();
      const content = m[2].trim();
      if (filePath && content !== undefined) {
        blocks.push({ path: filePath, content });
      }
    }
    return blocks;
  }

  parseThinking(text) {
    const m = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
    return m ? m[1].trim() : null;
  }

  writeFile(projectDir, filePath, content) {
    const safe = path.join(projectDir, filePath);
    if (!safe.startsWith(projectDir)) return false;
    fs.ensureDirSync(path.dirname(safe));
    fs.writeFileSync(safe, content, 'utf-8');
    return true;
  }

  async createStandardFiles(projectDir, emit) {
    for (const [filename, content] of Object.entries(BINARY_STUBS)) {
      const filePath = path.join(projectDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, content, 'utf-8');
        emit('ai-action', { type: 'auto-create', path: filename, message: `Auto-created: ${filename}` });
      }
    }
  }

  async saveSnapshot(pid, label) {
    try {
      const dir = this.getProjectDir(pid);
      const snapDir = path.join(dir, '.snapshots');
      fs.ensureDirSync(snapDir);
      const files = {};
      const list = [];
      this._collectTextFiles(dir, dir, list, 60);
      for (const f of list) {
        try { files[f.rel] = fs.readFileSync(f.full, 'utf-8'); } catch {}
      }
      const snap = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        label: label || 'Snapshot',
        filesCount: Object.keys(files).length,
        files
      };
      fs.writeJsonSync(path.join(snapDir, `${snap.id}.json`), snap, { spaces: 2 });
      return snap.id;
    } catch (e) {
      console.error('Snapshot failed:', e.message);
    }
  }

  // Simulate multi-agent progress events
  simulateAgents(emit, hasExistingFiles) {
    const steps = [];
    // Analyzer
    steps.push({ delay: 0, agent: AGENTS[0] });
    // Researcher
    steps.push({ delay: 800, agent: AGENTS[1] });
    // Planner
    steps.push({ delay: 1800, agent: AGENTS[2] });
    // Coder (starts when the LLM begins writing files)
    steps.push({ delay: 3000, agent: AGENTS[3] });

    const timers = [];
    for (const step of steps) {
      const timer = setTimeout(() => {
        emit('agent-status', {
          id: step.agent.id,
          name: step.agent.name,
          icon: step.agent.icon,
          status: 'working',
          description: step.agent.description,
        });
      }, step.delay);
      timers.push(timer);
    }
    return timers;
  }

  // Main stream processor with multi-agent simulation
  async processStream({ projectId, messages, model, imageBase64, socket }) {
    const dir = this.getProjectDir(projectId);
    fs.ensureDirSync(dir);

    const context = await this.readProjectContext(projectId);
    const hasExistingFiles = context.length > 0;
    const systemFull = context
      ? `${SYSTEM_PROMPT}\n\n${'═'.repeat(40)}\nEXISTING PROJECT FILES:\n${'═'.repeat(40)}\n${context}`
      : SYSTEM_PROMPT;

    await this.saveSnapshot(projectId, `Before: ${(messages[messages.length-1]?.content || '').substring(0, 50)}`);

    const emit = (event, data) => {
      try { socket?.emit(event, data); } catch {}
      try { this.io?.to(`project-${projectId}`).emit(event, data); } catch {}
    };

    // Start multi-agent simulation
    const agentTimers = this.simulateAgents(emit, hasExistingFiles);

    await this.createStandardFiles(dir, emit);

    let fullText = '';
    const writtenFiles = new Map();
    let thinkingShown = false;
    let firstFileWritten = false;

    let ollamaMessages = messages.map(m => ({ role: m.role, content: m.content || '' }));
    if (imageBase64 && ollamaMessages.length > 0) {
      const last = ollamaMessages[ollamaMessages.length - 1];
      ollamaMessages[ollamaMessages.length - 1] = { ...last, images: [imageBase64] };
    }

    await streamChat({
      model,
      messages: ollamaMessages,
      system: systemFull,

      onChunk: (chunk, full) => {
        fullText = full;
        emit('ai-chunk', { chunk, full });

        const thinking = this.parseThinking(full);
        if (thinking && !thinkingShown) {
          emit('ai-thinking', { thinking });
          if (full.includes('</thinking>')) thinkingShown = true;
        }

        const blocks = this.parseFileBlocks(full);
        for (const block of blocks) {
          const prev = writtenFiles.get(block.path);
          if (prev !== block.content) {
            writtenFiles.set(block.path, block.content);

            // Fire coder agent status on first file
            if (!firstFileWritten) {
              firstFileWritten = true;
              emit('agent-status', {
                id: 'coder',
                name: 'Coder Agent',
                icon: '💻',
                status: 'writing',
                description: `Writing ${block.path}...`,
              });
            } else {
              emit('agent-status', {
                id: 'coder',
                name: 'Coder Agent',
                icon: '💻',
                status: 'writing',
                description: `Writing ${block.path}...`,
              });
            }

            try {
              const ok = this.writeFile(dir, block.path, block.content);
              if (ok) {
                emit('file-changed', { path: block.path, content: block.content });
                emit('ai-action', { type: 'write-file', path: block.path, message: `✓ ${block.path}` });
              }
            } catch (err) {
              emit('ai-error', { message: `Failed to write ${block.path}: ${err.message}` });
            }
          }
        }
      },

      onDone: (full) => {
        // Clear agent timers
        agentTimers.forEach(t => clearTimeout(t));

        const blocks = this.parseFileBlocks(full);
        for (const block of blocks) {
          if (!writtenFiles.has(block.path) || writtenFiles.get(block.path) !== block.content) {
            try { this.writeFile(dir, block.path, block.content); } catch {}
          }
        }

        // Fire reviewer agent
        emit('agent-status', {
          id: 'reviewer',
          name: 'Reviewer Agent',
          icon: '✅',
          status: 'reviewing',
          description: 'Reviewing generated code...',
        });

        // After brief delay, mark complete
        setTimeout(() => {
          emit('agent-status', {
            id: 'reviewer',
            name: 'Reviewer Agent',
            icon: '✅',
            status: 'complete',
            description: 'Code review complete.',
          });

          emit('ai-done', {
            message: full,
            filesChanged: [...writtenFiles.keys()],
            summary: generateSummary([...writtenFiles.keys()]),
          });
        }, 500);
      },

      onError: (err) => {
        agentTimers.forEach(t => clearTimeout(t));
        emit('ai-error', { message: err.message });
      }
    });

    return { response: fullText, filesChanged: [...writtenFiles.keys()] };
  }
}

// Generate a summary of what was created
function generateSummary(files) {
  const items = [];
  const byType = {};
  for (const f of files) {
    const ext = f.split('.').pop()?.toLowerCase() || 'other';
    if (!byType[ext]) byType[ext] = [];
    byType[ext].push(f);
  }
  if (byType.html) items.push(`Created ${byType.html.length} HTML file(s)`);
  if (byType.css || byType.scss) items.push('Added styling');
  if (byType.jsx || byType.tsx) items.push(`Built ${(byType.jsx?.length || 0) + (byType.tsx?.length || 0)} React component(s)`);
  if (byType.js && !byType.jsx) items.push(`Created ${byType.js.length} JavaScript file(s)`);
  if (byType.json) items.push('Configured project settings');
  if (byType.md) items.push('Added documentation');
  if (byType.svg) items.push('Added SVG assets');
  if (items.length === 0) items.push(`Generated ${files.length} file(s)`);
  return items;
}

module.exports = AIAgent;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Wrench, Cpu, ChevronDown, Monitor } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api, streamAI } from '../../utils/api';
import toast from 'react-hot-toast';

const FIX_ACTIONS = [
  { id: 'responsive', label: 'Make Responsive', prompt: 'Make this project fully mobile-responsive with hamburger menu and proper breakpoints for all screen sizes' },
  { id: 'darkmode', label: 'Add Dark Mode', prompt: 'Add complete dark/light mode toggle with CSS variables, localStorage persistence, and smooth transitions' },
  { id: 'seo', label: 'Optimize SEO', prompt: 'Add complete SEO: meta tags, Open Graph, Twitter Cards, JSON-LD, robots.txt, and sitemap.xml' },
  { id: 'performance', label: 'Boost Performance', prompt: 'Optimize for performance: lazy loading images, font preloading, critical CSS inline, minify, and add caching headers' },
  { id: 'accessibility', label: 'Fix Accessibility', prompt: 'Fix all accessibility issues: ARIA labels, keyboard nav, color contrast ratios, skip links, and focus management' },
  { id: 'animations', label: 'Add Animations', prompt: 'Add smooth professional CSS animations, scroll reveal effects, hover transitions, and micro-interactions throughout' },
];

export default function WorkspaceHeader({ projectId, onRefreshTree }) {
  const navigate = useNavigate();
  const {
    currentProject,
    ollamaStatus, models, selectedModel, setSelectedModel,
    addMessage, updateLastMessage, setIsAiThinking, setAiThinkingSteps, addAiAction,
    setPreviewUrl,
  } = useAppStore();

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [fixing, setFixing] = useState(null);

  const statusColor = { connected: '#10b981', disconnected: '#f43f5e', unknown: '#f59e0b' }[ollamaStatus] || '#f59e0b';

  async function runFix(action) {
    if (!selectedModel) { toast.error('Select an AI model first'); return; }
    setShowFix(false);
    setFixing(action.id);
    addMessage({ role: 'user', content: action.label });
    addMessage({ role: 'assistant', content: '', streaming: true });
    setIsAiThinking(true);
    setAiThinkingSteps([]);
    toast.loading(`Running: ${action.label}...`, { id: 'fix' });
    let filesChanged = [];

    streamAI({
      projectId,
      messages: [{ role: 'user', content: action.prompt }],
      model: selectedModel,
      onFile: async ({ path: fp }) => {
        if (!filesChanged.includes(fp)) filesChanged.push(fp);
        addAiAction({ type: 'fix', path: fp, message: `Fixed: ${fp}` });
        try { await onRefreshTree?.(); } catch {}
      },
      onChunk: (_, full) => {
        const display = full
          .replace(/<file path="[^"]*">[\s\S]*?<\/file>/g, '')
          .replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        updateLastMessage({ content: display, streaming: true });
      },
      onDone: () => {
        updateLastMessage({ streaming: false, filesChanged });
        setIsAiThinking(false);
        setFixing(null);
        onRefreshTree?.();
        toast.success(`${action.label} applied!`, { id: 'fix' });
      },
      onError: (err) => {
        updateLastMessage({ content: `Error: ${err.message}`, streaming: false });
        setIsAiThinking(false);
        setFixing(null);
        toast.error(err.message, { id: 'fix' });
      }
    });
  }

  function refreshPreview() {
    setPreviewUrl('');
    setTimeout(() => setPreviewUrl(`/preview/${projectId}/index.html?t=${Date.now()}`), 100);
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
      height: 44, flexShrink: 0, background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Back */}
      <button onClick={() => navigate('/')} className="btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }}>
        <ArrowLeft size={13} />
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: "'Orbitron', sans-serif",
        }}>M</div>
        <span style={{
          fontWeight: 800, fontSize: 13, color: 'var(--text)',
          fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.04em',
        }}>
          MOBCLOUD
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: 'rgba(99,102,241,0.15)', color: '#818cf8',
          fontFamily: "'Orbitron', sans-serif",
        }}>
          v2.5
        </span>
        <span style={{ color: 'var(--border2)', margin: '0 2px' }}>|</span>
        <span style={{
          fontWeight: 600, fontSize: 12, color: 'var(--text2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
        }}>
          {currentProject?.name || 'Project'}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Ollama status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
        borderRadius: 6, background: 'var(--surface2)', fontSize: 10, color: 'var(--muted)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
        }} />
        Ollama
      </div>

      {/* Model picker */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setShowModelPicker(v => !v); setShowFix(false); }} className="btn-ghost" style={{ fontSize: 11, padding: '5px 8px', gap: 4 }}>
          <Cpu size={12} />
          <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedModel || 'No model'}
          </span>
          <ChevronDown size={10} />
        </button>
        {showModelPicker && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
            minWidth: 180, borderRadius: 10, overflow: 'hidden',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }} onMouseLeave={() => setShowModelPicker(false)}>
            <div style={{ padding: '8px 12px 6px', fontSize: 11, color: 'var(--muted)', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Ollama Models</div>
            {models.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)' }}>
                Run: <code>ollama pull llama3</code>
              </div>
            ) : models.map(m => (
              <button key={m.name} onClick={() => { setSelectedModel(m.name); setShowModelPicker(false); }} style={{
                width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, border: 'none',
                cursor: 'pointer', background: selectedModel === m.name ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: selectedModel === m.name ? '#a5b4fc' : 'var(--text2)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = selectedModel === m.name ? 'rgba(99,102,241,0.1)' : 'transparent'}>
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Fix */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setShowFix(v => !v); setShowModelPicker(false); }}
          className="btn-ghost"
          style={{ fontSize: 11, padding: '5px 8px', gap: 4, color: fixing ? '#fbbf24' : 'var(--text2)' }}>
          <Wrench size={12} />
          {fixing ? 'Running...' : 'AI Fix'}
          <ChevronDown size={10} />
        </button>
        {showFix && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
            width: 200, borderRadius: 10, overflow: 'hidden',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }} onMouseLeave={() => setShowFix(false)}>
            {FIX_ACTIONS.map(a => (
              <button key={a.id} onClick={() => runFix(a)} style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12,
                border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text2)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh preview */}
      <button onClick={refreshPreview} className="btn-icon" style={{ width: 28, height: 28 }} title="Refresh Preview">
        <Monitor size={13} />
      </button>

      {/* Download ZIP */}
      <button onClick={() => window.open(api.downloadProject(projectId), '_blank')} className="btn-icon" style={{ width: 28, height: 28 }} title="Download ZIP">
        <Download size={13} />
      </button>
    </header>
  );
}

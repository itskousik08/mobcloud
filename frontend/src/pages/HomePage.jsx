import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Folder, Trash2, ChevronRight, Clock, Cpu, Wifi, WifiOff,
  Zap, Code2, Globe, Layers, ArrowRight, Settings, Search,
  Sparkles, Eye, MoreHorizontal, Filter, ChevronLeft,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import NewProjectModal from '../components/Modals/NewProjectModal.jsx';
import SettingsModal from '../components/Modals/SettingsModal.jsx';

const FRAMEWORK_COLORS = {
  react: '#61dafb',
  angular: '#dd0031',
  vue: '#42b883',
  next: '#ffffff',
  tailwind: '#38bdf8',
  landing: '#f59e0b',
  portfolio: '#8b5cf6',
  dashboard: '#10b981',
  blog: '#f43f5e',
  blank: '#6366f1',
};

function getFrameworkTag(template) {
  if (!template || template === 'blank') return null;
  return {
    label: template.charAt(0).toUpperCase() + template.slice(1),
    color: FRAMEWORK_COLORS[template] || '#6366f1',
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    projects, setProjects, removeProject,
    ollamaStatus, models, selectedModel, setSelectedModel,
  } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    api.getProjects()
      .then(({ projects }) => setProjects(projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function deleteProject(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id);
    removeProject(id);
    toast.success('Deleted');
  }

  const statusColor = { connected: '#10b981', disconnected: '#f43f5e', unknown: '#f59e0b' }[ollamaStatus];
  const statusLabel = { connected: 'Ollama Connected', disconnected: 'Ollama Offline', unknown: 'Checking...' }[ollamaStatus];

  return (
    <div className="app-bg min-h-screen flex flex-col" style={{ overflow: 'auto' }}>
      {/* ═══════ NAVBAR ═══════ */}
      <header className="glass sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            M
          </div>
          <span className="font-bold text-white text-base tracking-tight">MobCloud</span>
        </div>

        <div className="flex-1" />

        {/* Status */}
        <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
          style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}25` }}>
          <span className="status-dot" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
          <span style={{ color: statusColor }}>{statusLabel}</span>
        </div>

        {/* Model picker */}
        {models.length > 0 && (
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="hidden md:block text-xs px-3 py-1.5 rounded-lg border outline-none cursor-pointer"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text2)' }}
          >
            {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        )}

        <button onClick={() => setShowSettings(true)} className="btn-icon tooltip" data-tip="Settings">
          <Settings size={16} />
        </button>

        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={15} />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </header>

      {/* ═══════ HERO SECTION ═══════ */}
      <section ref={heroRef} className="relative px-4 md:px-8 pt-16 pb-20 grid-bg">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-indigo-500 opacity-40 animate-float" />
          <div className="absolute top-40 right-20 w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-30 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-60 left-1/4 w-1 h-1 rounded-full bg-purple-400 opacity-30 animate-float" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow tag */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
            <Zap size={12} /> HOW TO GET STARTED WITH
          </motion.div>

          {/* Big cyber title */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="cyber-title text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95]">
            <span className="gradient-text-cyber" style={{
              textShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1)',
              filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.2))',
            }}>
              MOBCLOUD
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg max-w-xl mx-auto mb-4 leading-relaxed" style={{ color: 'var(--text2)' }}>
            Your local AI development platform. Chat, generate code, preview instantly — all powered by Ollama on your device.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <button onClick={() => setShowNew(true)} className="btn-primary-lg group">
              Start Building
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURE CHIPS ═══════ */}
      <section className="px-4 md:px-8 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Cpu size={18} />, title: 'Local AI', desc: 'Runs on Ollama', color: '#6366f1' },
            { icon: <Code2 size={18} />, title: 'Live Code Gen', desc: 'Real-time writing', color: '#22d3ee' },
            { icon: <Eye size={18} />, title: 'Instant Preview', desc: 'Desktop & mobile', color: '#8b5cf6' },
            { icon: <Sparkles size={18} />, title: 'Multi-Agent AI', desc: 'Smart workflows', color: '#14b8a6' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="card p-4 flex flex-col gap-2 hover:border-indigo-500/30 transition-all cursor-default"
              style={{ background: 'rgba(13,13,31,0.6)', backdropFilter: 'blur(12px)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{f.title}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ PROJECTS DASHBOARD ═══════ */}
      <section className="px-4 md:px-8 py-12 flex-1">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <h2 className="text-xl font-bold flex-1">Your Projects</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="input w-full sm:w-52 text-xs py-2 pl-8"
                />
              </div>
              <button onClick={() => setShowFilters(v => !v)} className="btn-secondary text-xs py-2 gap-1">
                <Filter size={12} /> Filters & Tags
              </button>
              <button onClick={() => setShowNew(true)} className="btn-primary text-xs py-2">
                <Plus size={14} /> New
              </button>
            </div>
          </div>

          {/* Projects grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex gap-1.5">
                <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card text-center py-20 flex flex-col items-center gap-4"
              style={{ background: 'rgba(13,13,31,0.5)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Folder size={26} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <div className="font-semibold mb-1">{search ? 'No projects found' : 'No projects yet'}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Create your first project to get started</div>
              </div>
              {!search && (
                <button onClick={() => setShowNew(true)} className="btn-primary">
                  <Plus size={15} /> Create Project
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((p, i) => {
                  const tag = getFrameworkTag(p.template);
                  return (
                    <motion.div key={p.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/workspace/${p.id}`)}
                      className="project-card card p-0 cursor-pointer group overflow-hidden">
                      {/* Preview thumbnail */}
                      <div className="h-32 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, var(--surface2), var(--surface3))' }}>
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ color: 'var(--border2)' }}>
                          <Globe size={32} style={{ opacity: 0.3 }} />
                        </div>
                        {/* Shimmer line */}
                        <div className="absolute bottom-3 left-3 right-3 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(30 + Math.random() * 70, 100)}%`,
                            background: `linear-gradient(90deg, ${tag?.color || '#6366f1'}, ${tag?.color || '#8b5cf6'}88)`,
                          }} />
                        </div>
                        {/* Menu button */}
                        <button onClick={(e) => deleteProject(e, p.id)}
                          className="absolute top-2 right-2 btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <div className="font-semibold text-sm mb-1 truncate">{p.name}</div>
                        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--muted)' }}>
                          <Clock size={10} />
                          Created on {new Date(p.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        {tag && (
                          <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-md font-medium"
                            style={{ background: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}25` }}>
                            {tag.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination hint */}
          {filtered.length > 6 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button className="btn-icon" style={{ width: 32, height: 32 }}><ChevronLeft size={14} /></button>
              <button className="btn-icon" style={{ width: 32, height: 32 }}><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="text-center py-6 text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
        MobCloud v2.5 — Local AI Development Platform
      </footer>

      {/* Offline warning */}
      {ollamaStatus === 'disconnected' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-5 py-3 rounded-xl flex items-center gap-3 text-sm max-w-sm mx-4"
          style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
          <WifiOff size={15} style={{ color: '#f59e0b' }} />
          <span style={{ color: 'var(--text2)' }}>Ollama offline — <span style={{ color: '#fbbf24' }}>run `ollama serve`</span></span>
        </div>
      )}

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <NewProjectModal open={showNew} onClose={() => setShowNew(false)}
        onCreated={(p) => navigate(`/workspace/${p.id}`)} />
    </div>
  );
}

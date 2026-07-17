// ═══════════════════════════════════════════════════════════
// IMPORT PAGE — Import agents from n8n workflows or GitHub repos
// New, additive page at /app/import
// Does not modify any existing route, component, or service
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, GitBranch, Workflow, Eye, Play, Square,
  AlertTriangle, CheckCircle2, Loader2, ExternalLink,
  ChevronRight, Package, Cpu, Zap, Shield, Clock,
  RefreshCw, X, Search,
} from 'lucide-react';
import { BACKEND_URL } from '../utils/constants';
import { useNavigate } from 'react-router-dom';
import styles from './ImportPage.module.css';

// ═══════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════

/** Node type icon mapper */
function NodeIcon({ spanType }) {
  const iconMap = {
    llm_call: { emoji: '🤖', className: styles.nodeIconAgent },
    tool_call: { emoji: '🔧', className: styles.nodeIconTool },
    internal_step: { emoji: '⚙️', className: styles.nodeIconLogic },
    trigger: { emoji: '⚡', className: styles.nodeIconTrigger },
  };
  const icon = iconMap[spanType] || iconMap.internal_step;
  return (
    <div className={`${styles.nodeIcon} ${icon.className}`}>
      {icon.emoji}
    </div>
  );
}

/** N8n health status indicator */
function N8nHealthBanner({ health }) {
  if (!health) return null;

  if (health.reachable) {
    return (
      <div className={styles.healthOk}>
        <CheckCircle2 size={14} />
        <span>n8n instance is reachable at {health.url || 'localhost:5678'}</span>
      </div>
    );
  }

  return (
    <div className={styles.healthWarning}>
      <AlertTriangle size={16} />
      <div>
        <strong>n8n is unreachable.</strong> Make sure it's running via{' '}
        <code style={{ fontSize: 12, background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4 }}>
          docker-compose up
        </code>
        {health.error && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{health.error}</div>}
      </div>
    </div>
  );
}

/** Preview: n8n workflow nodes */
function N8nPreviewPanel({ preview, onConfirm, confirming }) {
  if (!preview) return null;

  const { workflow, nodes, edges, summary, n8nHealth } = preview;

  return (
    <div className={`${styles.previewPanel} ${styles.fadeIn}`}>
      <div className={styles.previewHeader}>
        <div className={styles.previewTitle}>
          <Eye size={16} />
          Preview: {workflow.name}
        </div>
        <button
          className={`${styles.btn} ${styles.btnConfirm}`}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <><div className={styles.spinner} /> Importing...</>
          ) : (
            <><Play size={14} /> Confirm Import</>
          )}
        </button>
      </div>

      <N8nHealthBanner health={n8nHealth} />

      <div className={styles.statsRow}>
        <div className={`${styles.statBadge} ${styles.statAgent}`}>
          <Cpu size={12} /> {summary.agentNodes} Agent Nodes
        </div>
        <div className={`${styles.statBadge} ${styles.statTool}`}>
          <Zap size={12} /> {summary.toolNodes} Tool Nodes
        </div>
        <div className={`${styles.statBadge} ${styles.statLogic}`}>
          <GitBranch size={12} /> {summary.logicNodes} Logic Nodes
        </div>
        {summary.highRiskNodes > 0 && (
          <div className={`${styles.statBadge} ${styles.statRisk}`}>
            <Shield size={12} /> {summary.highRiskNodes} High-Risk
          </div>
        )}
        <div className={`${styles.statBadge} ${styles.statGreen}`}>
          {summary.totalEdges} Connections
        </div>
      </div>

      <div className={styles.nodeList}>
        {nodes.map((node, i) => (
          <div key={i} className={styles.nodeItem}>
            <NodeIcon spanType={node.spanType} />
            <span className={styles.nodeName}>{node.name}</span>
            <span className={styles.nodeType}>{node.spanType}</span>
            {node.risk !== 'low' && (
              <span className={`${styles.nodeRisk} ${node.risk === 'high' ? styles.riskHigh : styles.riskMedium}`}>
                {node.risk}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Preview: GitHub repo scan */
function GitHubPreviewPanel({ preview, onConfirm, confirming }) {
  if (!preview) return null;

  const { repo, projectType, scan, summary } = preview;

  return (
    <div className={`${styles.previewPanel} ${styles.fadeIn}`}>
      <div className={styles.previewHeader}>
        <div className={styles.previewTitle}>
          <Eye size={16} />
          Scan Results
        </div>
        <button
          className={`${styles.btn} ${styles.btnConfirm}`}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <><div className={styles.spinner} /> Importing...</>
          ) : (
            <><Play size={14} /> Confirm Import</>
          )}
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={`${styles.statBadge} ${styles.statLlm}`}>
          <Cpu size={12} /> {summary.language}
        </div>
        {summary.framework && (
          <div className={`${styles.statBadge} ${styles.statAgent}`}>
            <Package size={12} /> {summary.framework}
          </div>
        )}
        <div className={`${styles.statBadge} ${styles.statGreen}`}>
          <Search size={12} /> {scan.scannedFiles} files scanned
        </div>
        <div className={`${styles.statBadge} ${styles.statLlm}`}>
          🤖 {summary.llmCallCount} LLM calls
        </div>
        {summary.sideEffectCount > 0 && (
          <div className={`${styles.statBadge} ${styles.statRisk}`}>
            <Shield size={12} /> {summary.sideEffectCount} side effects
          </div>
        )}
      </div>

      {summary.entrypoint && (
        <div style={{ fontSize: 13, marginBottom: 12, color: 'rgba(0,0,0,0.7)' }}>
          <strong>Entrypoint:</strong>{' '}
          <code style={{ fontSize: 12, background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 4 }}>
            {summary.entrypoint}
          </code>
        </div>
      )}

      {scan.llmCalls.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            LLM Call Sites (will be instrumented)
          </div>
          <div className={styles.nodeList}>
            {scan.llmCalls.map((call, i) => (
              <div key={i} className={styles.nodeItem}>
                <NodeIcon spanType="llm_call" />
                <span className={styles.nodeName}>{call.label}</span>
                <span className={styles.nodeType}>{call.file}</span>
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }}>
                  ×{call.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {scan.sideEffects.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            External Side Effects (will trigger approval)
          </div>
          <div className={styles.nodeList}>
            {scan.sideEffects.map((effect, i) => (
              <div key={i} className={styles.nodeItem}>
                <NodeIcon spanType="tool_call" />
                <span className={styles.nodeName}>{effect.label}</span>
                <span className={styles.nodeType}>{effect.file}</span>
                <span className={`${styles.nodeRisk} ${effect.type === 'payment' ? styles.riskHigh : styles.riskMedium}`}>
                  {effect.type}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!summary.canAutoInstrument && (
        <div className={styles.healthWarning} style={{ marginTop: 12 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Limited auto-instrumentation.</strong> No known LLM SDK calls were detected.
            The agent will still be monitored, but you may need to manually add instrumentation
            for full telemetry.
          </div>
        </div>
      )}
    </div>
  );
}

/** Job status card */
function JobStatusCard({ job, onStop }) {
  const statusConfig = {
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending', cls: styles.jobPending },
    instrumenting: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Instrumenting', cls: styles.jobInstrumenting },
    running: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Running', cls: styles.jobRunning },
    completed: { color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Completed', cls: styles.jobCompleted },
    failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Failed', cls: styles.jobFailed },
    stopped: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Stopped', cls: styles.jobStopped },
  };

  const config = statusConfig[job.status] || statusConfig.pending;

  return (
    <div className={`${styles.jobCard} ${config.cls}`}>
      {['pending', 'instrumenting', 'running'].includes(job.status) && (
        <div className={styles.spinner} />
      )}
      {job.status === 'failed' && <AlertTriangle size={16} style={{ color: '#ef4444' }} />}
      {job.status === 'stopped' && <Square size={16} style={{ color: '#6b7280' }} />}
      {job.status === 'completed' && <CheckCircle2 size={16} style={{ color: '#059669' }} />}

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.85)' }}>
          {job.source_type === 'n8n' ? '📦 n8n' : '🐙 GitHub'} Import — {job.swarm_id}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 2, fontFamily: 'monospace' }}>
          {job.source_url}
        </div>
        {job.error_message && (
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{job.error_message}</div>
        )}
      </div>

      <span
        className={styles.jobStatusBadge}
        style={{ background: config.bg, color: config.color }}
      >
        {config.label}
      </span>

      {['pending', 'instrumenting', 'running'].includes(job.status) && (
        <button
          className={`${styles.btn} ${styles.btnDanger}`}
          style={{ padding: '6px 12px', fontSize: 11 }}
          onClick={() => onStop(job.id)}
        >
          <Square size={12} /> Stop
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// Main Import Page
// ═══════════════════════════════════════

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('n8n'); // 'n8n' | 'github'

  // n8n state
  const [n8nUrl, setN8nUrl] = useState('');
  const [n8nHealth, setN8nHealth] = useState(null);
  const [n8nPreview, setN8nPreview] = useState(null);
  const [n8nLoading, setN8nLoading] = useState(false);
  const [n8nError, setN8nError] = useState(null);

  // GitHub state
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('');
  const [githubPath, setGithubPath] = useState('');
  const [githubPreview, setGithubPreview] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(null);
  const [githubBackendError, setGithubBackendError] = useState(null);
  const [allowedRepos, setAllowedRepos] = useState([]);
  
  const demoN8nWorkflows = [
    { url: 'http://localhost:5678/api/v1/workflows/1', label: 'Basic Data Sync', description: 'Simple Postgres to CRM sync workflow', type: 'demo' },
    { url: 'http://localhost:5678/api/v1/workflows/2', label: 'Customer Onboarding', description: 'Complex email and Slack notification flow', type: 'automation' },
    { url: 'http://localhost:5678/api/v1/workflows/3', label: 'AI Support Agent', description: 'LLM-powered ticket routing and resolution', type: 'ai-agent' },
  ];

  // Job state
  const [jobs, setJobs] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [navigatingJobId, setNavigatingJobId] = useState(null);
  const navigate = useNavigate();

  // Polling ref
  const pollRef = useRef(null);

  // ── Check n8n health on mount ──
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/import/n8n/health`)
      .then(r => r.json())
      .then(setN8nHealth)
      .catch(() => setN8nHealth({ reachable: false, error: 'Could not reach the backend server.' }));
  }, []);

  // ── Fetch GitHub allowlist on mount ──
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/import/github/allowlist`)
      .then(r => r.json())
      .then(data => {
        setAllowedRepos(data.repos || []);
        setGithubBackendError(null);
      })
      .catch((err) => {
        setGithubBackendError('Could not reach the backend server. Make sure it is running.');
      });
  }, []);

  // ── Poll jobs ──
  useEffect(() => {
    const fetchJobs = () => {
      fetch(`${BACKEND_URL}/api/import/jobs`)
        .then(r => r.json())
        .then(data => {
          const fetchedJobs = data.jobs || [];
          setJobs(fetchedJobs);
          
          if (navigatingJobId) {
            const navJob = fetchedJobs.find(j => j.id === navigatingJobId);
            if (navJob && navJob.status === 'running') {
              setNavigatingJobId(null);
              navigate(`/app/observatory?swarm=${navJob.swarm_id}`);
            }
          }
        })
        .catch(() => {});
    };

    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [navigatingJobId, navigate]);

  // ── n8n Preview ──
  const handleN8nPreview = useCallback(async () => {
    if (!n8nUrl.trim()) return;

    setN8nLoading(true);
    setN8nError(null);
    setN8nPreview(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/import/n8n/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: n8nUrl.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Preview failed');
      }

      setN8nPreview(data.preview);
    } catch (err) {
      setN8nError(err.message);
    } finally {
      setN8nLoading(false);
    }
  }, [n8nUrl]);

  // ── GitHub Preview ──
  const handleGithubPreview = useCallback(async () => {
    if (!githubUrl.trim()) return;

    setGithubLoading(true);
    setGithubError(null);
    setGithubPreview(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/import/github/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: githubUrl.trim(),
          branch: githubBranch.trim() || undefined,
          path: githubPath.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.allowedRepos) {
          setGithubError(`${data.error}\n\nSelect a repo from the allowlist below.`);
        } else {
          throw new Error(data.error || 'Preview failed');
        }
        return;
      }

      setGithubPreview(data.preview);
    } catch (err) {
      setGithubError(err.message);
    } finally {
      setGithubLoading(false);
    }
  }, [githubUrl, githubBranch, githubPath]);

  // ── Confirm Import ──
  const handleConfirm = useCallback(async (sourceType) => {
    setConfirming(true);

    const previewData = sourceType === 'n8n' ? n8nPreview : githubPreview;
    const sourceUrl = sourceType === 'n8n' ? n8nUrl : githubUrl;

    try {
      const response = await fetch(`${BACKEND_URL}/api/import/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: sourceType,
          source_url: sourceUrl,
          preview_data: previewData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      // Reset state
      if (sourceType === 'n8n') {
        setN8nPreview(null);
        setN8nUrl('');
      } else {
        setGithubPreview(null);
        setGithubUrl('');
      }

      setNavigatingJobId(data.job?.id);

      // Fetch updated jobs
      const jobsRes = await fetch(`${BACKEND_URL}/api/import/jobs`);
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);

    } catch (err) {
      const setError = sourceType === 'n8n' ? setN8nError : setGithubError;
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }, [n8nPreview, githubPreview, n8nUrl, githubUrl]);

  // ── Stop Job ──
  const handleStopJob = useCallback(async (jobId) => {
    try {
      await fetch(`${BACKEND_URL}/api/import/jobs/${jobId}/stop`, { method: 'POST' });
      const jobsRes = await fetch(`${BACKEND_URL}/api/import/jobs`);
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);
    } catch (err) {
      console.error('Failed to stop job:', err);
    }
  }, []);

  // ── Select allowlist repo ──
  const handleSelectRepo = useCallback((repo) => {
    setGithubUrl(repo.url);
    setGithubError(null);
  }, []);

  return (
    <div className={styles.importPage}>
      {/* ── Header Bar ── */}
      <div className={styles.headerBar}>
        <Download size={16} style={{ color: 'rgba(0,0,0,0.5)' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.85)', letterSpacing: '-0.02em' }}>
          Import Agent
        </span>
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)' }} />

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'n8n' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('n8n')}
          >
            <Workflow size={14} /> n8n Workflow
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'github' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <GitBranch size={14} /> GitHub Repo
          </button>
        </div>

        {/* Job count */}
        {jobs.filter(j => ['running', 'instrumenting'].includes(j.status)).length > 0 && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 6,
            fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            color: '#059669',
          }}>
            <div className={styles.spinner} style={{ width: 10, height: 10, borderWidth: 1.5 }} />
            {jobs.filter(j => ['running', 'instrumenting'].includes(j.status)).length} active
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className={styles.contentArea}>

        {/* ══════════ TAB: n8n ══════════ */}
        {activeTab === 'n8n' && (
          <div className={styles.fadeIn}>
            <div className={styles.glassCard}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.85)', marginBottom: 4 }}>
                Import from n8n Workflow
              </div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 16 }}>
                Paste a public n8n workflow URL to preview and import it as a monitored agent swarm.
              </div>

              <N8nHealthBanner health={n8nHealth} />

              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Demo Workflows
              </div>
              <div className={styles.allowlistGrid}>
                {demoN8nWorkflows.map((flow, i) => (
                  <div
                    key={i}
                    className={`${styles.allowlistCard} ${n8nUrl === flow.url ? styles.allowlistCardSelected : ''}`}
                    onClick={() => {
                      setN8nUrl(flow.url);
                      setN8nPreview(null);
                      setN8nError(null);
                    }}
                  >
                    <div className={styles.allowlistLabel}>
                      ⚙️ {flow.label}
                    </div>
                    <div className={styles.allowlistDesc}>{flow.description}</div>
                    <div className={styles.allowlistMeta}>
                      <span className={styles.allowlistLang}>{flow.type}</span>
                      {n8nUrl === flow.url && (
                        <CheckCircle2 size={14} style={{ color: '#06b6d4' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.inputGroup} style={{ marginTop: 16 }}>
                <label className={styles.inputLabel}>Workflow URL</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="n8n-url-input"
                    type="text"
                    className={styles.input}
                    placeholder="http://localhost:5678/api/v1/workflows/1"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleN8nPreview()}
                  />
                  <button
                    id="n8n-preview-btn"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleN8nPreview}
                    disabled={!n8nUrl.trim() || n8nLoading}
                  >
                    {n8nLoading ? (
                      <><div className={styles.spinner} /> Fetching...</>
                    ) : (
                      <><Eye size={14} /> Preview</>
                    )}
                  </button>
                </div>
              </div>

              {n8nError && (
                <div className={styles.errorBox} style={{ marginTop: 12 }}>
                  <AlertTriangle size={14} />
                  {n8nError}
                </div>
              )}

              <N8nPreviewPanel
                preview={n8nPreview}
                onConfirm={() => handleConfirm('n8n')}
                confirming={confirming}
              />
            </div>
          </div>
        )}

        {/* ══════════ TAB: GitHub ══════════ */}
        {activeTab === 'github' && (
          <div className={styles.fadeIn}>
            <div className={styles.glassCard}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.85)', marginBottom: 4 }}>
                Import from GitHub Repository
              </div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 4 }}>
                Select a pre-tested demo repo to import as a monitored agent swarm.
              </div>
              <div style={{
                fontSize: 11, color: '#92400e', marginBottom: 16,
                padding: '6px 10px',
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.12)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Shield size={12} />
                For security, imports are limited to curated repos. Open-ended import requires Docker isolation.
              </div>

              {githubBackendError && (
                <div className={styles.healthWarning}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Backend Unreachable.</strong> {githubBackendError}
                  </div>
                </div>
              )}

              {/* Allowlist Grid */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Available Repos
              </div>
              <div className={styles.allowlistGrid}>
                {allowedRepos.map((repo, i) => (
                  <div
                    key={i}
                    className={`${styles.allowlistCard} ${githubUrl === repo.url ? styles.allowlistCardSelected : ''}`}
                    onClick={() => handleSelectRepo(repo)}
                  >
                    <div className={styles.allowlistLabel}>
                      🐙 {repo.label}
                    </div>
                    <div className={styles.allowlistDesc}>{repo.description}</div>
                    <div className={styles.allowlistMeta}>
                      <span className={styles.allowlistLang}>{repo.language}</span>
                      {githubUrl === repo.url && (
                        <CheckCircle2 size={14} style={{ color: '#06b6d4' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* URL + options */}
              <div className={styles.inputGroup} style={{ marginTop: 16 }}>
                <label className={styles.inputLabel}>Repository URL</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="github-url-input"
                    type="text"
                    className={styles.input}
                    placeholder="https://github.com/user/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGithubPreview()}
                  />
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputSmall}`}
                    placeholder="Branch"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                  />
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputSmall}`}
                    placeholder="Path"
                    value={githubPath}
                    onChange={(e) => setGithubPath(e.target.value)}
                  />
                  <button
                    id="github-preview-btn"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleGithubPreview}
                    disabled={!githubUrl.trim() || githubLoading}
                  >
                    {githubLoading ? (
                      <><div className={styles.spinner} /> Scanning...</>
                    ) : (
                      <><Eye size={14} /> Preview</>
                    )}
                  </button>
                </div>
              </div>

              {githubError && (
                <div className={styles.errorBox} style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  {githubError}
                </div>
              )}

              <GitHubPreviewPanel
                preview={githubPreview}
                onConfirm={() => handleConfirm('github')}
                confirming={confirming}
              />
            </div>
          </div>
        )}

        {/* ══════════ JOB HISTORY ══════════ */}
        {jobs.length > 0 && (
          <div className={styles.jobHistorySection}>
            <div className={styles.jobHistoryTitle}>
              <Clock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Import Jobs
            </div>
            <div className={styles.jobHistoryList}>
              {jobs.map(job => (
                <JobStatusCard key={job.id} job={job} onStop={handleStopJob} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

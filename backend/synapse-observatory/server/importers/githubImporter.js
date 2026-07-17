// ═══════════════════════════════════════════════════════════
// GITHUB IMPORTER SERVICE
// Clones, scans, and instruments GitHub repos for Synapse OS
// observation via the existing simulator/Socket.IO pipeline.
//
// SECURITY NOTE: This service restricts GitHub imports to a
// curated allowlist of pre-tested demo repos. Open-ended repo
// import requires Docker container execution (not yet wired).
// See IMPORT_FEATURE.md for the full security rationale.
// ═══════════════════════════════════════════════════════════

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const zlib = require('zlib');
const importJobStore = require('./importJobStore');

// ── Pure Node.js tarball downloader (no curl/tar/git needed) ──

/**
 * Download a URL via HTTPS, following redirects. Returns a Buffer.
 */
function httpsDownload(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { 'User-Agent': 'synapse-observatory/1.0' },
    };

    https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        return resolve(httpsDownload(res.headers.location, maxRedirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume(); // drain
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Decompress a .tar.gz buffer and extract files to destDir.
 * Equivalent to `tar xz --strip-components=1 -C destDir`.
 * Uses only Node.js built-in modules (zlib for gzip, manual tar parsing).
 */
async function extractTarGz(gzBuffer, destDir) {
  // Decompress gzip → raw tar
  const tarData = await new Promise((resolve, reject) => {
    zlib.gunzip(gzBuffer, (err, data) => (err ? reject(err) : resolve(data)));
  });

  const BLOCK = 512;
  let offset = 0;

  while (offset + BLOCK <= tarData.length) {
    const header = tarData.subarray(offset, offset + BLOCK);
    offset += BLOCK;

    // End-of-archive marker (two consecutive zero blocks)
    if (header[0] === 0) break;

    // Parse filename (UStar: prefix field at 345-500 + name field at 0-100)
    const nameField = header.subarray(0, 100).toString('utf-8').replace(/\0/g, '');
    const prefix = header.subarray(345, 500).toString('utf-8').replace(/\0/g, '');
    const fullName = prefix ? prefix + '/' + nameField : nameField;

    // Parse size (octal ASCII at offset 124-136)
    const sizeStr = header.subarray(124, 136).toString('utf-8').replace(/\0/g, '').trim();
    const size = sizeStr ? parseInt(sizeStr, 8) : 0;

    // Type flag at offset 156 (ASCII '5' = dir, '0' or NUL = regular file)
    const typeFlag = header[156];

    // Data occupies ceil(size / 512) * 512 bytes
    const dataBlocks = Math.ceil(size / BLOCK) * BLOCK;

    // Strip first path component (equivalent to --strip-components=1)
    const slashIdx = fullName.indexOf('/');
    const stripped = slashIdx >= 0 ? fullName.slice(slashIdx + 1) : '';

    if (!stripped) {
      offset += dataBlocks;
      continue;
    }

    const outPath = path.join(destDir, stripped);

    // Prevent path traversal
    if (!outPath.startsWith(destDir)) {
      offset += dataBlocks;
      continue;
    }

    if (typeFlag === 53 /* '5' */ || fullName.endsWith('/')) {
      // Directory
      fs.mkdirSync(outPath, { recursive: true });
    } else if (typeFlag === 48 /* '0' */ || typeFlag === 0) {
      // Regular file
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, tarData.subarray(offset, offset + size));
    }
    // Skip symlinks, pax headers, etc.

    offset += dataBlocks;
  }
}

// ── Curated allowlist of pre-tested demo repos ──
// Open-ended repo import needs Docker container execution before it's safe
const ALLOWED_REPOS = [
  {
    url: 'https://github.com/langchain-ai/langchain',
    label: 'LangChain (Python)',
    description: 'LLM framework with chains, agents, and tools',
    language: 'python',
    entrypoint: 'libs/langchain/langchain/__init__.py',
  },
  {
    url: 'https://github.com/hwchase17/langchainjs',
    label: 'LangChain.js (TypeScript)',
    description: 'LangChain for JavaScript/TypeScript',
    language: 'typescript',
    entrypoint: 'langchain/src/index.ts',
  },
  {
    url: 'https://github.com/joaomdmoura/crewAI',
    label: 'CrewAI (Python)',
    description: 'Multi-agent orchestration framework',
    language: 'python',
    entrypoint: 'src/crewai/crew.py',
  },
  {
    url: 'https://github.com/openai/openai-node',
    label: 'OpenAI Node SDK',
    description: 'Official OpenAI Node.js client library',
    language: 'typescript',
    entrypoint: 'src/index.ts',
  },
  {
    url: 'https://github.com/anthropics/anthropic-sdk-python',
    label: 'Anthropic Python SDK',
    description: 'Official Anthropic Python client library',
    language: 'python',
    entrypoint: 'src/anthropic/__init__.py',
  },
];

// ── Framework/SDK detection patterns ──
const DETECTION_PATTERNS = {
  // Node/TypeScript patterns
  node: {
    entrypoints: ['index.ts', 'index.js', 'main.ts', 'main.js', 'agent.ts', 'agent.js', 'app.ts', 'app.js', 'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js'],
    packageKeywords: ['langchain', '@langchain', 'openai', '@anthropic-ai/sdk', 'crewai', 'autogen'],
    llmPatterns: [
      { regex: /new\s+OpenAI\s*\(/g, type: 'openai', label: 'OpenAI client' },
      { regex: /new\s+Anthropic\s*\(/g, type: 'anthropic', label: 'Anthropic client' },
      { regex: /ChatOpenAI|ChatAnthropic/g, type: 'langchain', label: 'LangChain chat model' },
      { regex: /\.invoke\s*\(|\.run\s*\(|\.call\s*\(/g, type: 'langchain', label: 'LangChain chain invocation' },
      { regex: /createAgent|AgentExecutor/g, type: 'langchain', label: 'LangChain agent' },
    ],
    sideEffectPatterns: [
      { regex: /fetch\s*\(|axios\.(post|put|delete|patch)/gi, type: 'http', label: 'HTTP request' },
      { regex: /\.send\s*\(|nodemailer/gi, type: 'email', label: 'Email send' },
      { regex: /stripe\.|paymentIntent/gi, type: 'payment', label: 'Payment operation' },
    ],
  },
  // Python patterns
  python: {
    entrypoints: ['main.py', 'agent.py', 'app.py', 'run.py', 'src/main.py', 'src/agent.py'],
    requirementsKeywords: ['langchain', 'openai', 'anthropic', 'crewai', 'autogen'],
    llmPatterns: [
      { regex: /OpenAI\s*\(/g, type: 'openai', label: 'OpenAI client' },
      { regex: /Anthropic\s*\(/g, type: 'anthropic', label: 'Anthropic client' },
      { regex: /ChatOpenAI|ChatAnthropic/g, type: 'langchain', label: 'LangChain chat model' },
      { regex: /\.invoke\s*\(|\.run\s*\(|Crew\.kickoff/g, type: 'framework', label: 'Agent framework invocation' },
      { regex: /Agent\s*\(|Task\s*\(|Crew\s*\(/g, type: 'crewai', label: 'CrewAI agent/task' },
    ],
    sideEffectPatterns: [
      { regex: /requests\.(post|put|delete|patch)/gi, type: 'http', label: 'HTTP request' },
      { regex: /httpx\.(post|put|delete|patch)/gi, type: 'http', label: 'HTTP request' },
      { regex: /smtplib|send_mail/gi, type: 'email', label: 'Email send' },
      { regex: /stripe\./gi, type: 'payment', label: 'Payment operation' },
    ],
  },
};

/**
 * Check if a GitHub URL is in the curated allowlist
 * @param {string} url
 * @returns {{ allowed: boolean, repo: object|null, allRepos: object[] }}
 */
function checkAllowlist(url) {
  const normalizedUrl = url.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
  const match = ALLOWED_REPOS.find(r =>
    normalizedUrl === r.url.toLowerCase() ||
    normalizedUrl.startsWith(r.url.toLowerCase())
  );
  return {
    allowed: !!match,
    repo: match || null,
    allRepos: ALLOWED_REPOS,
  };
}

/**
 * Detect project type from a cloned repo directory
 * @param {string} dir - Path to cloned repo
 * @returns {{ language: string, framework: string|null, entrypoint: string|null, hasPackageJson: boolean, hasRequirements: boolean }}
 */
function detectProjectType(dir) {
  const result = {
    language: 'unknown',
    framework: null,
    entrypoint: null,
    hasPackageJson: false,
    hasRequirements: false,
    hasPyProject: false,
  };

  // Check for Node/TypeScript project
  const packageJsonPath = path.join(dir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    result.hasPackageJson = true;
    result.language = 'node';

    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Check for start script
      if (pkg.scripts?.start) {
        result.entrypoint = pkg.scripts.start;
      }

      // Detect framework from dependencies
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const keyword of DETECTION_PATTERNS.node.packageKeywords) {
        if (allDeps[keyword]) {
          result.framework = keyword;
          break;
        }
      }

      // Check if it's TypeScript
      if (allDeps.typescript || allDeps['ts-node'] || fs.existsSync(path.join(dir, 'tsconfig.json'))) {
        result.language = 'typescript';
      }
    } catch {}

    // Find entrypoint file
    if (!result.entrypoint || result.entrypoint.startsWith('node ') || result.entrypoint.startsWith('ts-node ')) {
      for (const ep of DETECTION_PATTERNS.node.entrypoints) {
        if (fs.existsSync(path.join(dir, ep))) {
          result.entrypoint = ep;
          break;
        }
      }
    }
  }

  // Check for Python project
  const requirementsPath = path.join(dir, 'requirements.txt');
  const pyprojectPath = path.join(dir, 'pyproject.toml');

  if (fs.existsSync(requirementsPath)) {
    result.hasRequirements = true;
    if (result.language === 'unknown') result.language = 'python';

    try {
      const requirements = fs.readFileSync(requirementsPath, 'utf-8');
      for (const keyword of DETECTION_PATTERNS.python.requirementsKeywords) {
        if (requirements.toLowerCase().includes(keyword)) {
          result.framework = keyword;
          break;
        }
      }
    } catch {}
  }

  if (fs.existsSync(pyprojectPath)) {
    result.hasPyProject = true;
    if (result.language === 'unknown') result.language = 'python';
  }

  // Find Python entrypoint
  if (result.language === 'python' && !result.entrypoint) {
    for (const ep of DETECTION_PATTERNS.python.entrypoints) {
      if (fs.existsSync(path.join(dir, ep))) {
        result.entrypoint = ep;
        break;
      }
    }
  }

  return result;
}

/**
 * Scan source files for LLM calls and side effects
 * @param {string} dir - Repo directory
 * @param {string} language - 'node' | 'typescript' | 'python'
 * @returns {{ llmCalls: object[], sideEffects: object[], scannedFiles: number }}
 */
function scanForInstrumentationPoints(dir, language) {
  const llmCalls = [];
  const sideEffects = [];
  let scannedFiles = 0;

  const patterns = language === 'python' ? DETECTION_PATTERNS.python : DETECTION_PATTERNS.node;
  const extensions = language === 'python' ? ['.py'] : ['.js', '.ts', '.jsx', '.tsx', '.mjs'];

  // Walk directory (max depth 4, skip node_modules/.git/venv)
  function walkDir(currentDir, depth = 0) {
    if (depth > 4) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip non-source directories
        if (['node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 'build', '.next'].includes(entry.name)) {
          continue;
        }
        walkDir(fullPath, depth + 1);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const relPath = path.relative(dir, fullPath);
          scannedFiles++;

          // Check LLM patterns
          for (const pattern of patterns.llmPatterns) {
            const matches = content.match(pattern.regex);
            if (matches) {
              llmCalls.push({
                file: relPath,
                type: pattern.type,
                label: pattern.label,
                count: matches.length,
              });
            }
          }

          // Check side effect patterns
          for (const pattern of patterns.sideEffectPatterns) {
            const matches = content.match(pattern.regex);
            if (matches) {
              sideEffects.push({
                file: relPath,
                type: pattern.type,
                label: pattern.label,
                count: matches.length,
              });
            }
          }
        } catch {}
      }
    }
  }

  walkDir(dir);
  return { llmCalls, sideEffects, scannedFiles };
}

/**
 * Preview a GitHub repo — clone, detect, scan
 * Returns structured preview data without executing anything.
 *
 * @param {string} url - GitHub repo URL
 * @param {string} [branch] - Optional branch name
 * @param {string} [subPath] - Optional subdirectory path
 * @returns {Promise<object>} Preview data
 */
async function previewGitHubRepo(url, branch, subPath) {
  // Check allowlist
  const allowlistResult = checkAllowlist(url);
  if (!allowlistResult.allowed) {
    return {
      allowed: false,
      error: 'This repository is not in the curated allowlist. For security, only pre-tested demo repos are currently supported. Open-ended repo import requires Docker container execution.',
      allowedRepos: allowlistResult.allRepos.map(r => ({
        url: r.url,
        label: r.label,
        description: r.description,
      })),
    };
  }

  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-import-'));

  try {
    // Parse owner/repo from the GitHub URL
    const urlMatch = url.replace(/\.git$/, '').replace(/\/$/, '').match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
    }
    const [, owner, repoName] = urlMatch;
    const targetBranch = branch || 'main';

    // Download and extract using pure Node.js (no git/curl/tar needed)
    const repoDestDir = path.join(tempDir, 'repo');
    fs.mkdirSync(repoDestDir, { recursive: true });

    const branchesToTry = [targetBranch];
    if (targetBranch === 'main') branchesToTry.push('master');

    let downloaded = false;
    for (const branchName of branchesToTry) {
      const tarballUrl = `https://github.com/${owner}/${repoName}/archive/refs/heads/${branchName}.tar.gz`;
      console.log(`[GitHub Import] Downloading ${owner}/${repoName} (${branchName}) via Node.js HTTPS...`);
      try {
        const gzBuffer = await httpsDownload(tarballUrl);
        console.log(`[GitHub Import] Downloaded ${(gzBuffer.length / 1024 / 1024).toFixed(1)} MB, extracting...`);
        await extractTarGz(gzBuffer, repoDestDir);
        downloaded = true;
        console.log(`[GitHub Import] ✅ Extracted (branch: ${branchName})`);
        break;
      } catch (dlErr) {
        console.log(`[GitHub Import] Branch "${branchName}" failed: ${dlErr.message}`);
      }
    }

    if (!downloaded) {
      throw new Error(`Could not download repository ${owner}/${repoName}. Tried branches: ${branchesToTry.join(', ')}`);
    }

    const repoDir = subPath
      ? path.join(repoDestDir, subPath)
      : repoDestDir;

    if (!fs.existsSync(repoDir)) {
      throw new Error(`Subdirectory "${subPath}" not found in the repository.`);
    }

    // Detect project type
    const projectType = detectProjectType(repoDir);

    // Scan for instrumentation points
    const scan = scanForInstrumentationPoints(repoDir, projectType.language);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      allowed: true,
      repo: {
        url,
        branch: branch || 'main',
        subPath: subPath || '/',
      },
      projectType,
      scan: {
        llmCalls: scan.llmCalls,
        sideEffects: scan.sideEffects,
        scannedFiles: scan.scannedFiles,
        totalInstrumentationPoints: scan.llmCalls.length + scan.sideEffects.length,
      },
      summary: {
        language: projectType.language,
        framework: projectType.framework,
        entrypoint: projectType.entrypoint,
        llmCallCount: scan.llmCalls.reduce((sum, c) => sum + c.count, 0),
        sideEffectCount: scan.sideEffects.reduce((sum, c) => sum + c.count, 0),
        canAutoInstrument: scan.llmCalls.length > 0,
      },
    };
  } catch (err) {
    // Clean up on error
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    throw new Error(`Failed to download repository: ${err.message}`);
  }
}

/**
 * Execute a GitHub import job — simulates instrumented agent execution
 * via the existing Socket.IO pipeline.
 *
 * @param {object} job - Import job from the job store
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {object} previewData - Data from previewGitHubRepo
 */
async function executeGitHubImport(job, io, previewData) {
  const jobId = job.id;
  const swarmId = job.swarm_id;

  try {
    importJobStore.updateStatus(jobId, 'instrumenting');

    const { scan, projectType, repo } = previewData;

    // Build agent list from detected instrumentation points
    const agentEntries = [];

    // Create an agent for each unique LLM call type
    const llmTypes = new Map();
    for (const call of scan.llmCalls) {
      const key = `${call.type}-${call.label}`;
      if (!llmTypes.has(key)) {
        llmTypes.set(key, {
          name: call.label,
          type: call.type,
          file: call.file,
          spanType: 'llm_call',
          risk: 'low',
          count: call.count,
        });
      } else {
        llmTypes.get(key).count += call.count;
      }
    }
    agentEntries.push(...llmTypes.values());

    // Create entries for side effects
    const sideEffectTypes = new Map();
    for (const effect of scan.sideEffects) {
      const key = `${effect.type}-${effect.label}`;
      if (!sideEffectTypes.has(key)) {
        sideEffectTypes.set(key, {
          name: effect.label,
          type: effect.type,
          file: effect.file,
          spanType: 'tool_call',
          risk: effect.type === 'payment' ? 'high' : 'medium',
          count: effect.count,
        });
      } else {
        sideEffectTypes.get(key).count += effect.count;
      }
    }
    agentEntries.push(...sideEffectTypes.values());

    // Always add a main entrypoint agent
    if (projectType.entrypoint) {
      agentEntries.unshift({
        name: `Main (${projectType.entrypoint})`,
        type: 'entrypoint',
        file: projectType.entrypoint,
        spanType: 'internal_step',
        risk: 'low',
        count: 1,
      });
    }

    // If no instrumentation points found, create a generic agent
    if (agentEntries.length === 0) {
      agentEntries.push({
        name: `Agent (${projectType.language})`,
        type: 'generic',
        file: projectType.entrypoint || 'unknown',
        spanType: 'internal_step',
        risk: 'low',
        count: 1,
      });
    }

    // Emit scenario start
    io.emit('live:scenario-start', {
      scenarioId: swarmId,
      isCustom: true,
      title: `Imported: ${repo.url.split('/').slice(-1)[0]}`,
      icon: '🐙',
      description: `GitHub import: ${projectType.language} / ${projectType.framework || 'custom'}`,
      steps: agentEntries.map(entry => ({
        agent: entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        description: `${entry.name} (${entry.spanType})`,
        icon: entry.spanType === 'llm_call' ? '🤖' : entry.spanType === 'tool_call' ? '🔧' : '⚙️',
      })),
    });

    // Register agents
    const agents = {};
    for (const entry of agentEntries) {
      const agentId = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      agents[agentId] = {
        swarmId,
        agentId,
        agentName: entry.name,
        status: 'idle',
        spanType: entry.spanType,
        risk: entry.risk,
        file: entry.file,
        tokenUsage: { total: 0, prompt: 0, completion: 0 },
        costUSD: 0,
        lastActivity: new Date().toISOString(),
      };
      io.emit('agent:update', agents[agentId]);
    }

    importJobStore.updateStatus(jobId, 'running');

    // Simulate execution
    for (let i = 0; i < agentEntries.length; i++) {
      const entry = agentEntries[i];
      const agentId = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Check if job was stopped
      const currentJob = importJobStore.getJob(jobId);
      if (!currentJob || currentJob.status === 'stopped') {
        console.log(`[GitHub Import] Job ${jobId} was stopped`);
        return;
      }

      // Processing
      agents[agentId].status = 'processing';
      agents[agentId].lastActivity = new Date().toISOString();
      io.emit('agent:update', agents[agentId]);

      io.emit('live:activity', {
        swarmId,
        id: `${swarmId}-step-${i}`,
        agentId,
        agentName: entry.name,
        type: entry.spanType,
        message: `Executing ${entry.name} from ${entry.file}`,
        timestamp: new Date().toISOString(),
      });

      io.emit('live:demo-step', { swarmId, step: i, status: 'running', output: null });

      // Approval for high-risk
      if (entry.risk === 'high') {
        io.emit('live:approval-added', {
          swarmId,
          id: `${swarmId}-approval-${i}`,
          agentId,
          agentName: entry.name,
          description: `High-risk side effect: ${entry.name} requires approval`,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      }

      // Execution time
      const execTime = entry.spanType === 'llm_call' ? 1500 + Math.random() * 2500 : 300 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, execTime));

      // Token usage for LLM agents
      if (entry.spanType === 'llm_call') {
        const promptTokens = 300 + Math.floor(Math.random() * 1000);
        const completionTokens = 150 + Math.floor(Math.random() * 500);
        agents[agentId].tokenUsage = {
          total: promptTokens + completionTokens,
          prompt: promptTokens,
          completion: completionTokens,
        };
        agents[agentId].costUSD = (promptTokens * 0.00001) + (completionTokens * 0.00003);
      }

      // Done
      agents[agentId].status = 'idle';
      agents[agentId].lastActivity = new Date().toISOString();
      io.emit('agent:update', agents[agentId]);

      io.emit('live:demo-step', {
        swarmId,
        step: i,
        status: 'done',
        output: `${entry.name} completed (${entry.count} call site${entry.count > 1 ? 's' : ''} instrumented)`,
      });

      // Handoff to next
      if (i < agentEntries.length - 1) {
        const nextId = agentEntries[i + 1].name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        io.emit('live:agent-handoff', {
          swarmId,
          from: agentId,
          to: nextId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Totals
    const totalTokens = Object.values(agents).reduce((sum, a) => sum + a.tokenUsage.total, 0);
    const totalCost = Object.values(agents).reduce((sum, a) => sum + a.costUSD, 0);

    io.emit('live:telemetry', { swarmId, totalTokens, totalCost, totalLatency: agentEntries.length * 1200 });
    io.emit('live:scenario-complete', {
      swarmId,
      totalTokens,
      totalCost,
      totalLatency: agentEntries.length * 1200,
      agentsUsed: Object.keys(agents).length,
    });

    importJobStore.updateStatus(jobId, 'completed');
    console.log(`[GitHub Import] Job ${jobId} completed. ${agentEntries.length} agents executed.`);

  } catch (err) {
    console.error(`[GitHub Import] Job ${jobId} failed:`, err.message);
    importJobStore.updateStatus(jobId, 'failed', err.message);
    io.emit('live:error', { swarmId, error: `GitHub import failed: ${err.message}` });
  }
}

module.exports = {
  previewGitHubRepo,
  executeGitHubImport,
  checkAllowlist,
  detectProjectType,
  scanForInstrumentationPoints,
  ALLOWED_REPOS,
};

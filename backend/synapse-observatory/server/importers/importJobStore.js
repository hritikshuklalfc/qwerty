// ═══════════════════════════════════════════════════════════
// IMPORT JOB STORE — In-memory store for import jobs
// Tracks import jobs from creation through execution lifecycle
// ═══════════════════════════════════════════════════════════

const crypto = require('crypto');

class ImportJobStore {
  constructor() {
    /** @type {Map<string, ImportJob>} */
    this.jobs = new Map();
  }

  /**
   * Create a new import job
   * @param {'n8n'|'github'} sourceType
   * @param {string} sourceUrl
   * @param {object} detectedSummary - Preview data from the importer
   * @returns {ImportJob}
   */
  createJob(sourceType, sourceUrl, detectedSummary = null) {
    const id = crypto.randomUUID();
    const swarmId = `import-${sourceType}-${id.slice(0, 8)}`;

    const job = {
      id,
      source_type: sourceType,
      source_url: sourceUrl,
      swarm_id: swarmId,
      status: 'pending',        // pending | instrumenting | running | failed | stopped
      detected_summary: detectedSummary,
      error_message: null,
      created_at: new Date().toISOString(),
      // Runtime references (not serialized)
      _process: null,            // ChildProcess reference for kill switch
      _tempDir: null,            // Temp directory path for cleanup
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Get a job by ID
   * @param {string} id
   * @returns {ImportJob|null}
   */
  getJob(id) {
    return this.jobs.get(id) || null;
  }

  /**
   * List all jobs, newest first
   * @returns {ImportJob[]}
   */
  listJobs() {
    return Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Update a job's status
   * @param {string} id
   * @param {string} status
   * @param {string|null} errorMessage
   */
  updateStatus(id, status, errorMessage = null) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = status;
    if (errorMessage) job.error_message = errorMessage;
  }

  /**
   * Attach a child process reference to a job (for kill switch)
   * @param {string} id
   * @param {import('child_process').ChildProcess} proc
   */
  attachProcess(id, proc) {
    const job = this.jobs.get(id);
    if (job) job._process = proc;
  }

  /**
   * Set the temp directory for a job (for cleanup)
   * @param {string} id
   * @param {string} tempDir
   */
  setTempDir(id, tempDir) {
    const job = this.jobs.get(id);
    if (job) job._tempDir = tempDir;
  }

  /**
   * Stop a job — kill its process and clean up
   * @param {string} id
   * @returns {boolean} success
   */
  stopJob(id) {
    const job = this.jobs.get(id);
    if (!job) return false;

    // Kill the child process if running
    if (job._process && !job._process.killed) {
      try {
        job._process.kill('SIGTERM');
        // Force kill after 5 seconds if SIGTERM doesn't work
        setTimeout(() => {
          if (job._process && !job._process.killed) {
            job._process.kill('SIGKILL');
          }
        }, 5000);
      } catch (err) {
        console.error(`[ImportJobStore] Failed to kill process for job ${id}:`, err.message);
      }
    }

    // Clean up temp directory
    if (job._tempDir) {
      const fs = require('fs');
      try {
        fs.rmSync(job._tempDir, { recursive: true, force: true });
        console.log(`[ImportJobStore] Cleaned up temp dir: ${job._tempDir}`);
      } catch (err) {
        console.error(`[ImportJobStore] Failed to clean up temp dir:`, err.message);
      }
    }

    job.status = 'stopped';
    job._process = null;
    job._tempDir = null;
    return true;
  }

  /**
   * Serialize a job for API responses (strips internal refs)
   * @param {ImportJob} job
   * @returns {object}
   */
  serialize(job) {
    if (!job) return null;
    const { _process, _tempDir, ...serializable } = job;
    return serializable;
  }
}

// Singleton
module.exports = new ImportJobStore();

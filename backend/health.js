/**
 * @file Service health monitoring utilities.
 * Track uptime, service status, and basic metrics.
 */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status - 'healthy' | 'unhealthy' | 'degraded'
 * @property {number} uptime - Seconds since startup
 * @property {Object} services - Status of each service
 * @property {Object} metrics - Basic performance metrics
 */

class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.services = new Map();
    this.metrics = {
      httpRequests: 0,
      mqttMessages: 0,
      dbQueries: 0,
      errors: 0
    };
  }

  /**
   * Register a service for health monitoring.
   * @param {string} name - Service name
   * @param {() => Promise<boolean>} healthCheck - Async health check function
   */
  registerService(name, healthCheck) {
    this.services.set(name, {
      name,
      healthCheck,
      status: 'unknown',
      lastCheck: null,
      error: null
    });
  }

  /**
   * Check health of all registered services.
   * @returns {Promise<HealthStatus>}
   */
  async checkHealth() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const serviceStatuses = {};
    let overallStatus = 'healthy';

    for (const [name, service] of this.services) {
      try {
        const isHealthy = await service.healthCheck();
        service.status = isHealthy ? 'healthy' : 'unhealthy';
        service.lastCheck = new Date().toISOString();
        service.error = null;

        if (!isHealthy) {
          overallStatus = 'degraded';
        }
      } catch (error) {
        service.status = 'unhealthy';
        service.lastCheck = new Date().toISOString();
        service.error = error.message;
        overallStatus = 'unhealthy';
      }

      serviceStatuses[name] = {
        status: service.status,
        lastCheck: service.lastCheck,
        error: service.error
      };
    }

    return {
      status: overallStatus,
      uptime,
      services: serviceStatuses,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Increment a metric counter.
   * @param {string} metric - Metric name
   * @param {number} [increment=1] - Increment value
   */
  incrementMetric(metric, increment = 1) {
    if (this.metrics.hasOwnProperty(metric)) {
      this.metrics[metric] += increment;
    }
  }

  /**
   * Get current metrics.
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics to zero.
   */
  resetMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
  }
}

/** Global health monitor instance */
export const healthMonitor = new HealthMonitor();

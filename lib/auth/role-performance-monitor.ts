/**
 * Performance Monitoring for Role-Based System
 * Tracks role detection, navigation rendering, and access control performance
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  roleDetectionTime: number;
  navigationRenderTime: number;
  accessControlCheckTime: number;
  profilePageLoadTime: number;
  totalRoleOperations: number;
  averageRoleDetectionTime: number;
  slowestRoleDetection: number;
  roleDetectionFailures: number;
}

class RolePerformanceMonitor {
  private metrics: PerformanceMetrics = {
    roleDetectionTime: 0,
    navigationRenderTime: 0,
    accessControlCheckTime: 0,
    profilePageLoadTime: 0,
    totalRoleOperations: 0,
    averageRoleDetectionTime: 0,
    slowestRoleDetection: 0,
    roleDetectionFailures: 0,
  };

  private roleDetectionStartTime: number = 0;
  private navigationRenderStartTime: number = 0;
  private accessControlStartTime: number = 0;
  private profileLoadStartTime: number = 0;

  // Role Detection Performance
  startRoleDetection() {
    this.roleDetectionStartTime = performance.now();
  }

  endRoleDetection(success: boolean = true) {
    if (this.roleDetectionStartTime > 0) {
      const duration = performance.now() - this.roleDetectionStartTime;
      this.metrics.roleDetectionTime = duration;
      this.metrics.totalRoleOperations++;

      if (!success) {
        this.metrics.roleDetectionFailures++;
      }

      // Update averages
      this.metrics.averageRoleDetectionTime =
        (this.metrics.averageRoleDetectionTime * (this.metrics.totalRoleOperations - 1) + duration) /
        this.metrics.totalRoleOperations;

      // Track slowest operation
      if (duration > this.metrics.slowestRoleDetection) {
        this.metrics.slowestRoleDetection = duration;
      }

      // Log performance warnings
      if (duration > 1000) { // > 1 second
        console.warn(`[RolePerformance] Slow role detection: ${duration.toFixed(2)}ms`);
      } else if (duration > 100) { // > 100ms
        console.info(`[RolePerformance] Role detection completed in ${duration.toFixed(2)}ms`);
      }

      this.roleDetectionStartTime = 0;
    }
  }

  // Navigation Rendering Performance
  startNavigationRender() {
    this.navigationRenderStartTime = performance.now();
  }

  endNavigationRender() {
    if (this.navigationRenderStartTime > 0) {
      const duration = performance.now() - this.navigationRenderStartTime;
      this.metrics.navigationRenderTime = duration;

      if (duration > 500) { // > 500ms
        console.warn(`[RolePerformance] Slow navigation render: ${duration.toFixed(2)}ms`);
      }

      this.navigationRenderStartTime = 0;
    }
  }

  // Access Control Performance
  startAccessControlCheck() {
    this.accessControlStartTime = performance.now();
  }

  endAccessControlCheck() {
    if (this.accessControlStartTime > 0) {
      const duration = performance.now() - this.accessControlStartTime;
      this.metrics.accessControlCheckTime = duration;

      if (duration > 100) { // > 100ms
        console.warn(`[RolePerformance] Slow access control check: ${duration.toFixed(2)}ms`);
      }

      this.accessControlStartTime = 0;
    }
  }

  // Profile Page Load Performance
  startProfilePageLoad() {
    this.profileLoadStartTime = performance.now();
  }

  endProfilePageLoad() {
    if (this.profileLoadStartTime > 0) {
      const duration = performance.now() - this.profileLoadStartTime;
      this.metrics.profilePageLoadTime = duration;

      if (duration > 2000) { // > 2 seconds
        console.warn(`[RolePerformance] Slow profile page load: ${duration.toFixed(2)}ms`);
      }

      this.profileLoadStartTime = 0;
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.metrics = {
      roleDetectionTime: 0,
      navigationRenderTime: 0,
      accessControlCheckTime: 0,
      profilePageLoadTime: 0,
      totalRoleOperations: 0,
      averageRoleDetectionTime: 0,
      slowestRoleDetection: 0,
      roleDetectionFailures: 0,
    };
  }

  // Performance health check
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check role detection performance
    if (this.metrics.averageRoleDetectionTime > 500) {
      issues.push(`High average role detection time: ${this.metrics.averageRoleDetectionTime.toFixed(2)}ms`);
      recommendations.push('Optimize role fetching from database');
    }

    if (this.metrics.slowestRoleDetection > 2000) {
      issues.push(`Very slow role detection: ${this.metrics.slowestRoleDetection.toFixed(2)}ms`);
      recommendations.push('Implement role caching or background prefetching');
    }

    // Check failure rate
    const failureRate = this.metrics.totalRoleOperations > 0
      ? (this.metrics.roleDetectionFailures / this.metrics.totalRoleOperations) * 100
      : 0;

    if (failureRate > 5) {
      issues.push(`High role detection failure rate: ${failureRate.toFixed(1)}%`);
      recommendations.push('Review error handling and fallback mechanisms');
    }

    // Check navigation performance
    if (this.metrics.navigationRenderTime > 1000) {
      issues.push(`Slow navigation rendering: ${this.metrics.navigationRenderTime.toFixed(2)}ms`);
      recommendations.push('Optimize navigation component rendering');
    }

    // Check profile page performance
    if (this.metrics.profilePageLoadTime > 3000) {
      issues.push(`Slow profile page load: ${this.metrics.profilePageLoadTime.toFixed(2)}ms`);
      recommendations.push('Implement lazy loading for role-specific content');
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }

  // Export metrics for monitoring systems
  exportMetrics(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      healthStatus: this.getHealthStatus(),
    };
  }
}

// Singleton instance
export const rolePerformanceMonitor = new RolePerformanceMonitor();

// React hook for component-level monitoring
export function useRolePerformance() {
  const monitorRef = useRef(rolePerformanceMonitor);

  return {
    monitor: monitorRef.current,
    startRoleDetection: () => monitorRef.current.startRoleDetection(),
    endRoleDetection: (success = true) => monitorRef.current.endRoleDetection(success),
    startNavigationRender: () => monitorRef.current.startNavigationRender(),
    endNavigationRender: () => monitorRef.current.endNavigationRender(),
    startAccessControlCheck: () => monitorRef.current.startAccessControlCheck(),
    endAccessControlCheck: () => monitorRef.current.endAccessControlCheck(),
    startProfilePageLoad: () => monitorRef.current.startProfilePageLoad(),
    endProfilePageLoad: () => monitorRef.current.endProfilePageLoad(),
    getMetrics: () => monitorRef.current.getMetrics(),
    getHealthStatus: () => monitorRef.current.getHealthStatus(),
  };
}

// Utility function for logging performance in development
export function logRolePerformance(operation: string, duration: number, threshold = 100) {
  if (process.env.NODE_ENV === 'development') {
    if (duration > threshold) {
      console.warn(`[RolePerformance] ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    } else {
      console.debug(`[RolePerformance] ${operation} completed in ${duration.toFixed(2)}ms`);
    }
  }
}
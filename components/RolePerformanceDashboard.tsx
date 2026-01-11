'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Clock, AlertTriangle, CheckCircle, Zap, Users, Shield } from 'lucide-react';
import { rolePerformanceMonitor } from '@/lib/auth/role-performance-monitor';

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

export function RolePerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    // Update metrics every 5 seconds
    const updateMetrics = () => {
      setMetrics(rolePerformanceMonitor.getMetrics());
      setHealthStatus(rolePerformanceMonitor.getHealthStatus());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics || !healthStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Role-Based System Performance</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(healthStatus.status)}`}>
          {getStatusIcon(healthStatus.status)}
          <span className="capitalize">{healthStatus.status}</span>
        </div>
      </div>

      {/* Health Issues */}
      {healthStatus.issues.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Performance Issues Detected</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {healthStatus.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthStatus.recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {healthStatus.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Role Detection</p>
              <p className="text-2xl font-bold text-blue-900">
                {metrics.averageRoleDetectionTime.toFixed(0)}ms
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Avg time • {metrics.totalRoleOperations} operations
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Navigation Render</p>
              <p className="text-2xl font-bold text-green-900">
                {metrics.navigationRenderTime.toFixed(0)}ms
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xs text-green-600 mt-2">
            Last render time
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Access Control</p>
              <p className="text-2xl font-bold text-purple-900">
                {metrics.accessControlCheckTime.toFixed(0)}ms
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Last check time
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Profile Page</p>
              <p className="text-2xl font-bold text-orange-900">
                {metrics.profilePageLoadTime.toFixed(0)}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-xs text-orange-600 mt-2">
            Last load time
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Operations</span>
              <span className="font-medium">{metrics.totalRoleOperations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Detection Failures</span>
              <span className={`font-medium ${metrics.roleDetectionFailures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.roleDetectionFailures}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Slowest Detection</span>
              <span className="font-medium">{metrics.slowestRoleDetection.toFixed(0)}ms</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="font-medium text-green-600">
                {metrics.totalRoleOperations > 0
                  ? ((1 - metrics.roleDetectionFailures / metrics.totalRoleOperations) * 100).toFixed(1)
                  : 100}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Health Status</span>
              <span className={`font-medium capitalize px-2 py-1 rounded text-xs ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="border-t pt-4 mt-4">
        <button
          onClick={() => {
            const data = rolePerformanceMonitor.exportMetrics();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `role-performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          Export Metrics
        </button>
      </div>
    </div>
  );
}
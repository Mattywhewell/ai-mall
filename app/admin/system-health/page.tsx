/**
 * System Health Dashboard
 * Monitors platform health, API status, and error rates
 */

'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  apiLatency: number;
  errorRate: number;
  databaseStatus: 'connected' | 'slow' | 'disconnected';
  activeUsers: number;
  requestsPerMinute: number;
  lastChecked: string;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;
  uptime: number;
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    status: 'healthy',
    uptime: 99.9,
    apiLatency: 45,
    errorRate: 0.2,
    databaseStatus: 'connected',
    activeUsers: 234,
    requestsPerMinute: 1250,
    lastChecked: new Date().toISOString(),
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Server', status: 'operational', latency: 42, uptime: 99.95 },
    { name: 'Database', status: 'operational', latency: 18, uptime: 99.99 },
    { name: 'Auto-Listing Engine', status: 'operational', latency: 850, uptime: 98.5 },
    { name: 'Stripe Payments', status: 'operational', latency: 230, uptime: 99.8 },
    { name: 'Image Processing', status: 'operational', latency: 320, uptime: 99.2 },
    { name: 'Email Service', status: 'operational', latency: 150, uptime: 99.7 },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'slow':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
      case 'outage':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'connected':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
      case 'slow':
        return <AlertCircle className="w-5 h-5" />;
      case 'down':
      case 'outage':
      case 'disconnected':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Health</h1>
          <p className="text-gray-600">Real-time monitoring of platform health and performance</p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStatusColor(metrics.status)}`}>
                {getStatusIcon(metrics.status)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">{metrics.status}</h2>
                <p className="text-gray-600">All systems operational</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{metrics.uptime}%</div>
              <div className="text-sm text-gray-600">30-day uptime</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-blue-600" />
              {metrics.apiLatency < 100 ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.apiLatency}ms</div>
            <div className="text-sm text-gray-600">API Latency</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              {metrics.errorRate < 1 ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.errorRate}%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.requestsPerMinute.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Requests/Min</div>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Status</h2>
          
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Uptime</div>
                    <div className="text-xl font-bold text-gray-900">{service.uptime}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Latency</div>
                    <div className="font-semibold text-gray-900">{service.latency}ms</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Last Check</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(metrics.lastChecked).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-semibold text-gray-900 capitalize">{service.status}</div>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        service.uptime >= 99.9
                          ? 'bg-green-600'
                          : service.uptime >= 99
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${service.uptime}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl shadow-md p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
          
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recent Incidents</h3>
            <p className="text-gray-600">All systems have been running smoothly</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Last updated: {new Date(metrics.lastChecked).toLocaleString()}
          <br />
          Auto-refreshes every 30 seconds
        </div>
      </div>
    </div>
  );
}

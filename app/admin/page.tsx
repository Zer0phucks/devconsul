'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ActivitySummary {
  total: number;
  byType: Record<string, number>;
  recentActivities: any[];
}

interface Stats {
  subscribers: number;
  blogPosts: number;
  newslettersSent: number;
}

export default function AdminDashboard() {
  const [activities, setActivities] = useState<ActivitySummary | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple auth check (in production, use proper auth)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadDashboardData();
      } else {
        alert('Invalid password');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load activities
      const activitiesRes = await fetch('/api/admin/activities');
      if (activitiesRes.ok) {
        setActivities(await activitiesRes.json());
      }

      // Load stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const triggerContentGeneration = async () => {
    if (!confirm('Generate content from recent activities?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Content generation started!');
        loadDashboardData();
      } else {
        alert('Failed to generate content');
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNewsletterNow = async () => {
    if (!confirm('Send newsletter to all subscribers now?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: process.env.NEXT_PUBLIC_ADMIN_KEY }),
      });

      if (response.ok) {
        alert('Newsletter sent successfully!');
        loadDashboardData();
      } else {
        alert('Failed to send newsletter');
      }
    } catch (error) {
      console.error('Newsletter error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2 border rounded-md mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Link
              href="/blog"
              className="text-blue-600 hover:text-blue-800"
            >
              View Blog →
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Subscribers</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.subscribers}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Blog Posts</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.blogPosts}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Newsletters Sent</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.newslettersSent}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={triggerContentGeneration}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Generate Blog Post
            </button>
            <button
              onClick={sendNewsletterNow}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send Newsletter Now
            </button>
            <Link
              href="/admin/posts"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Manage Posts
            </Link>
            <Link
              href="/admin/subscribers"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Manage Subscribers
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        {activities && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent GitHub Activities</h2>

            {/* Activity Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(activities.byType).map(([type, count]) => (
                <div key={type} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500 capitalize">{type}</p>
                  <p className="text-lg font-semibold">{count}</p>
                </div>
              ))}
            </div>

            {/* Activity List */}
            <div className="space-y-2">
              {activities.recentActivities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-gray-300 pl-4 py-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{activity.type}</span>
                      <span className="ml-2 text-gray-600">
                        by {activity.actor.login}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {activity.processed && (
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Processed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
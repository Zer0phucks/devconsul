'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    email: string;
    campaignName: string;
    projectName?: string;
  } | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadUnsubscribeInfo();
  }, [token]);

  async function loadUnsubscribeInfo() {
    try {
      const response = await fetch(`/api/unsubscribe/info?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid unsubscribe link');
        setLoading(false);
        return;
      }

      setInfo(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load unsubscribe information');
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to unsubscribe');
        setLoading(false);
        return;
      }

      setUnsubscribed(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to process unsubscribe request');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
            <Button
              onClick={() => router.push('/')}
              className="mt-4 w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You have been unsubscribed from {info?.campaignName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Email: <strong>{info?.email}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              You will no longer receive emails from this mailing list.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe from Emails</CardTitle>
          <CardDescription>
            We're sorry to see you go
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Email: <strong>{info?.email}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Campaign: <strong>{info?.campaignName}</strong>
            </p>
            {info?.projectName && (
              <p className="text-sm text-gray-600">
                Project: <strong>{info.projectName}</strong>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Reason for unsubscribing (optional)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Help us improve by telling us why you're unsubscribing..."
              rows={4}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full"
            variant="destructive"
          >
            {loading ? 'Processing...' : 'Confirm Unsubscribe'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By clicking "Confirm Unsubscribe", you will stop receiving emails from this mailing list.
            You can resubscribe at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

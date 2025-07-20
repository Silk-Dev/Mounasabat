
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  reportedByUser?: { name: string };
  assignedToUser?: { name: string };
  createdAt: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/api/issue');
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        setIssues(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  if (loading) {
    return <div>Loading issues...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Issue Tracker</h1>
      {issues.length === 0 ? (
        <p>No issues found.</p>
      ) : (
        <ul className="space-y-4">
          {issues.map((issue) => (
            <li key={issue.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{issue.title}</h2>
              <p>Status: {issue.status} | Priority: {issue.priority}</p>
              {issue.reportedByUser && <p>Reported By: {issue.reportedByUser.name}</p>}
              {issue.assignedToUser && <p>Assigned To: {issue.assignedToUser.name}</p>}
              <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
              <Link href={`/issues/${issue.id}`} className="text-indigo-600 hover:underline">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  reportedByUser?: { id: string; name: string };
  assignedToUser?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
}

export default function IssueDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchIssueAndUsers = async () => {
      try {
        // Fetch issue details
        const issueResponse = await fetch(`/api/issue/${id}`);
        if (!issueResponse.ok) {
          throw new Error('Failed to fetch issue');
        }
        const issueData = await issueResponse.json();
        setIssue(issueData);
        setStatus(issueData.status);
        setPriority(issueData.priority);
        setAssignedToUserId(issueData.assignedToUserId || '');

        // Fetch users for assignment
        const usersResponse = await fetch('/api/users'); // Assuming an API endpoint for users
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIssueAndUsers();
    }
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/issue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          assignedToUserId: assignedToUserId || null, // Send null if unassigned
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update issue');
      }

      const updatedIssue = await response.json();
      setIssue(updatedIssue);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!issue) {
    return <div>Issue not found.</div>;
  }

  return (
    <div>
      <Link href="/issues" className="text-indigo-600 hover:underline mb-4 block">
        &larr; Back to Issues
      </Link>
      <h1 className="text-3xl font-bold mb-4">Issue: {issue.title}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Details</h2>
          <p><strong>Description:</strong> {issue.description}</p>
          <p><strong>Reported By:</strong> {issue.reportedByUser?.name || 'N/A'}</p>
          <p><strong>Created At:</strong> {new Date(issue.createdAt).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> {new Date(issue.updatedAt).toLocaleString()}</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select id="assignedTo" value={assignedToUserId} onChange={(e) => setAssignedToUserId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Update Issue
          </button>
        </form>
      </div>
    </div>
  );
}

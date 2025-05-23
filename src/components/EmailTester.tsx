import React, { useState } from 'react';
import { emailService } from '../services/email';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EmailTester = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'organiser' | 'brand' | 'shopper'>('shopper');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [directStatus, setDirectStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string>('');
  const [bulkResult, setBulkResult] = useState<string>('');
  const [directResult, setDirectResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setResult('');

    try {
      const response = await emailService.sendWelcomeEmail({
        to: email,
        name: name || 'User',
        role: role,
        dashboardLink: `${window.location.origin}/dashboard`
      });

      if (response.success) {
        setStatus('success');
        setResult(`Email sent successfully! Message ID: ${response.messageId}`);
      } else {
        setStatus('error');
        setResult(`Failed to send email: ${response.error}`);
      }
    } catch (error) {
      setStatus('error');
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSendToAllUsers = async () => {
    setBulkStatus('sending');
    setBulkResult('');

    try {
      const response = await fetch(`${API_URL}/api/email/send-welcome-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setBulkStatus('success');
        setBulkResult(`${data.message}`);
      } else {
        setBulkStatus('error');
        setBulkResult(`Failed to start process: ${data.error}`);
      }
    } catch (error) {
      setBulkStatus('error');
      setBulkResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDirectEmailTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectStatus('sending');
    setDirectResult('');

    try {
      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: email })
      });

      const data = await response.json();

      if (data.success) {
        setDirectStatus('success');
        setDirectResult(`Direct test email sent successfully! Message ID: ${data.messageId}`);
      } else {
        setDirectStatus('error');
        setDirectResult(`Failed to send direct test email: ${data.error}`);
      }
    } catch (error) {
      setDirectStatus('error');
      setDirectResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Email Testing Tools</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Direct Test Email</h2>
        <p className="text-gray-600 mb-4">
          This sends a simple test email directly via the API, bypassing the template system.
        </p>
        
        <form onSubmit={handleDirectEmailTest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </label>
          </div>
          
          <button
            type="submit"
            disabled={directStatus === 'sending'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
          >
            {directStatus === 'sending' ? 'Sending...' : 'Send Direct Test Email'}
          </button>
        </form>
        
        {directResult && (
          <div className={`mt-4 p-3 rounded ${directStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {directResult}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Send Individual Welcome Email</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Optional"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="shopper">Shopper</option>
                <option value="brand">Brand</option>
                <option value="organiser">Organiser</option>
              </select>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {status === 'sending' ? 'Sending...' : 'Send Welcome Email'}
          </button>
        </form>
        
        {result && (
          <div className={`mt-4 p-3 rounded ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Send Welcome Emails to All Users</h2>
        <p className="text-gray-600 mb-4">
          This will send welcome emails to all users in the database. Use with caution!
        </p>
        
        <button
          onClick={handleSendToAllUsers}
          disabled={bulkStatus === 'sending'}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-300"
        >
          {bulkStatus === 'sending' ? 'Processing...' : 'Send to All Users'}
        </button>
        
        {bulkResult && (
          <div className={`mt-4 p-3 rounded ${bulkStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {bulkResult}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        <h3 className="font-bold mb-2">Debugging Information:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>API URL: {API_URL}</li>
          <li>VITE_API_URL: {import.meta.env.VITE_API_URL || 'Not set'}</li>
          <li>Server should be running at: http://localhost:3001</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTester; 
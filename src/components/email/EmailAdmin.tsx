import { useState, useEffect } from 'react';
import { emailServices, type EmailLogOptions, type EmailDiagnostics } from '@/services/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertCircle, Mail, Send } from 'lucide-react';

interface EmailLog {
  id: string;
  operation: string;
  status: string;
  to_email: string;
  subject?: string;
  template_id?: string;
  error_message?: string;
  message_id?: string;
  created_at: string;
}

interface EmailStats {
  total: number;
  byStatus: Record<string, number>;
  byOperation: Record<string, number>;
  byTemplate: Record<string, number>;
  recentErrors: EmailLog[];
}

// Define result interface to fix type issues
interface EmailResult {
  success: boolean;
  error: string;
  messageId: string;
}

export function EmailAdmin() {
  const [testEmail, setTestEmail] = useState('');
  const [templateId, setTemplateId] = useState('welcome');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [diagnostics, setDiagnostics] = useState<EmailDiagnostics | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  
  const [loading, setLoading] = useState({
    logs: false,
    stats: false,
    diagnostics: false,
    templates: false,
    testEmail: false,
    testTemplate: false
  });
  
  // Use the EmailResult interface to fix type issues
  const [result, setResult] = useState<{
    testEmail: EmailResult;
    testTemplate: EmailResult;
  }>({
    testEmail: { success: false, error: '', messageId: '' },
    testTemplate: { success: false, error: '', messageId: '' }
  });

  // Load data on component mount
  useEffect(() => {
    fetchTemplates();
    fetchStats();
    fetchLogs();
  }, []);

  // Fetch available templates
  const fetchTemplates = async () => {
    setLoading(prev => ({ ...prev, templates: true }));
    try {
      const templates = await emailServices.templates.fetch();
      setAvailableTemplates(Object.keys(templates));
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  // Fetch email logs
  const fetchLogs = async (options: EmailLogOptions = { limit: 20 }) => {
    setLoading(prev => ({ ...prev, logs: true }));
    try {
      const logsData = await emailServices.core.getLogs(options);
      setLogs(logsData.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  };

  // Fetch email stats
  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const statsData = await emailServices.core.getEmailStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Diagnose email issues
  const diagnoseIssues = async () => {
    setLoading(prev => ({ ...prev, diagnostics: true }));
    try {
      const diagnosticsData = await emailServices.diagnostics.diagnoseIssues();
      setDiagnostics(diagnosticsData);
    } catch (error) {
      console.error('Error diagnosing issues:', error);
    } finally {
      setLoading(prev => ({ ...prev, diagnostics: false }));
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(prev => ({ ...prev, testEmail: true }));
    try {
      const response = await emailServices.diagnostics.sendTestEmail(testEmail);
      // Create a properly typed result object
      const emailResult: EmailResult = {
        success: response.success,
        error: response.error || '',
        messageId: response.messageId || ''
      };
      setResult(prev => ({ ...prev, testEmail: emailResult }));
    } catch (error: any) {
      setResult(prev => ({ 
        ...prev, 
        testEmail: { 
          success: false, 
          error: error.message || 'Unknown error', 
          messageId: '' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, testEmail: false }));
    }
  };

  // Send test template email
  const sendTestTemplateEmail = async () => {
    if (!testEmail) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(prev => ({ ...prev, testTemplate: true }));
    try {
      const response = await emailServices.diagnostics.sendTestTemplateEmail(testEmail, templateId);
      // Create a properly typed result object
      const templateResult: EmailResult = {
        success: response.success,
        error: response.error || '',
        messageId: response.messageId || ''
      };
      setResult(prev => ({ ...prev, testTemplate: templateResult }));
    } catch (error: any) {
      setResult(prev => ({ 
        ...prev, 
        testTemplate: { 
          success: false, 
          error: error.message || 'Unknown error', 
          messageId: '' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, testTemplate: false }));
    }
  };

  // Render connection status
  const renderConnectionStatus = () => {
    if (!diagnostics) return null;

    if (diagnostics.connectionStatus) {
      return (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Connection Successful</AlertTitle>
          <AlertDescription>
            Email server connection is working ({diagnostics.connectionTime}ms)
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Connection Failed</AlertTitle>
          <AlertDescription>
            Unable to connect to the email server. Check your settings.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">Email System Administration</h2>

      <Tabs defaultValue="diagnostics">
        <TabsList className="mb-4">
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="test">Test Emails</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>Email System Diagnostics</CardTitle>
              <CardDescription>
                Check the status of your email system and diagnose any issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={diagnoseIssues}
                disabled={loading.diagnostics}
                className="mb-4"
              >
                {loading.diagnostics ? <Spinner className="mr-2" /> : null}
                Run Diagnostics
              </Button>

              {diagnostics && (
                <div className="mt-4 space-y-4">
                  {renderConnectionStatus()}

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">SMTP Settings</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Host:</div>
                      <div>{diagnostics.smtpSettings.host}</div>
                      <div>Port:</div>
                      <div>{diagnostics.smtpSettings.port}</div>
                      <div>Secure:</div>
                      <div>{diagnostics.smtpSettings.secure ? 'Yes' : 'No'}</div>
                      <div>User:</div>
                      <div>{diagnostics.smtpSettings.user}</div>
                    </div>
                  </div>

                  {diagnostics.templatesCount !== undefined && (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Templates</h3>
                      <p>{diagnostics.templatesCount} email templates found</p>
                    </div>
                  )}

                  {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {diagnostics.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnostics.recentErrors && diagnostics.recentErrors.length > 0 && (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Recent Errors</h3>
                      <div className="max-h-60 overflow-y-auto">
                        <ul className="space-y-2">
                          {diagnostics.recentErrors.map((error, index) => (
                            <li key={index} className="text-sm border-l-2 border-red-400 pl-3 py-1">
                              <div className="font-medium">{error.operation}</div>
                              <div className="text-gray-500">{error.timestamp}</div>
                              <div className="text-red-500">{error.error}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Emails Tab */}
        <TabsContent value="test">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>
                  Send a simple test email to verify your configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recipient Email
                    </label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={sendTestEmail}
                  disabled={loading.testEmail}
                  className="w-full"
                >
                  {loading.testEmail ? <Spinner className="mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Test Email
                </Button>
              </CardFooter>
              {result.testEmail.success || result.testEmail.error ? (
                <div className="px-6 pb-4">
                  {result.testEmail.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-600">Email Sent Successfully</AlertTitle>
                      <AlertDescription>
                        Message ID: {result.testEmail.messageId}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-600">Failed to Send Email</AlertTitle>
                      <AlertDescription>
                        {result.testEmail.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Template Email</CardTitle>
                <CardDescription>
                  Test a specific email template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recipient Email
                    </label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Template
                    </label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading.templates ? (
                          <div className="flex items-center justify-center p-2">
                            <Spinner />
                          </div>
                        ) : (
                          availableTemplates.map((template) => (
                            <SelectItem key={template} value={template}>
                              {template}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={sendTestTemplateEmail}
                  disabled={loading.testTemplate}
                  className="w-full"
                >
                  {loading.testTemplate ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Template Email
                </Button>
              </CardFooter>
              {result.testTemplate.success || result.testTemplate.error ? (
                <div className="px-6 pb-4">
                  {result.testTemplate.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-600">Template Email Sent</AlertTitle>
                      <AlertDescription>
                        Message ID: {result.testTemplate.messageId}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-600">Failed to Send Template</AlertTitle>
                      <AlertDescription>
                        {result.testTemplate.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                Recent email activity and operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button onClick={() => fetchLogs()} variant="outline" size="sm">
                  Refresh Logs
                </Button>
              </div>

              {loading.logs ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                        <th className="px-4 py-2 text-left font-medium">Operation</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Recipient</th>
                        <th className="px-4 py-2 text-left font-medium">Subject/Template</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                            No email logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-600">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {log.operation}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span 
                                className={`px-2 py-1 rounded-full text-xs ${
                                  log.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : log.status === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">{log.to_email}</td>
                            <td className="px-4 py-2">
                              {log.template_id ? (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  {log.template_id}
                                </span>
                              ) : (
                                log.subject
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Email Statistics</CardTitle>
              <CardDescription>
                Overview of email system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button onClick={fetchStats} variant="outline" size="sm">
                  Refresh Stats
                </Button>
              </div>

              {loading.stats ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : stats ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Status Breakdown</h3>
                    <ul className="space-y-2">
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <li key={status} className="flex justify-between">
                          <span className={`
                            px-2 py-1 rounded-full text-xs
                            ${status === 'success' ? 'bg-green-100 text-green-800' : 
                              status === 'error' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}
                          `}>
                            {status}
                          </span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Operation Types</h3>
                    <ul className="space-y-2">
                      {Object.entries(stats.byOperation).map(([operation, count]) => (
                        <li key={operation} className="flex justify-between">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {operation}
                          </span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Templates</h3>
                    <ul className="space-y-2">
                      {Object.entries(stats.byTemplate).length === 0 ? (
                        <li className="text-gray-500">No template data available</li>
                      ) : (
                        Object.entries(stats.byTemplate).map(([template, count]) => (
                          <li key={template} className="flex justify-between">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {template || 'direct'}
                            </span>
                            <span className="font-medium">{count}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No statistics available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
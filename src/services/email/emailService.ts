// API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EMAIL_API_URL = `${API_URL}/api/email`;

// Email service interfaces
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface TemplateEmailData {
  to: string;
  templateId: string;
  data: Record<string, any>;
  from?: string;
}

export interface EmailServiceConfig {
  apiUrl?: string;
}

export interface EmailLogOptions {
  status?: string;
  operation?: string;
  toEmail?: string;
  templateId?: string;
  limit?: number;
  offset?: number;
}

export interface EmailDiagnostics {
  connectionStatus: boolean;
  connectionTime?: number;
  smtpSettings: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
  };
  templatesCount?: number;
  recentErrors?: Array<{
    timestamp: string;
    operation: string;
    error: string;
    to?: string;
  }>;
  recommendations: string[];
}

// Welcome email interfaces
export interface WelcomeEmailData {
  to: string;
  name: string;
  role: 'organiser' | 'brand' | 'shopper';
  dashboardLink: string;
  from?: string;
}

// Exhibition reminder email interfaces
export interface ExhibitionReminderEmailData {
  to: string;
  name: string;
  user_role: string;
  exhibition_name: string;
  exhibition_date: string;
  exhibition_time: string;
  exhibition_location: string;
  exhibition_description: string;
  exhibition_link: string;
  exhibition_image?: string;
  days_until: number;
  stall_number?: string;
  role_is_organiser?: boolean;
  role_is_brand?: boolean;
  role_is_shopper?: boolean;
  from?: string;
}

// New exhibition notification email interfaces
export interface NewExhibitionEmailData {
  to: string;
  name: string;
  exhibition_name: string;
  exhibition_date: string;
  exhibition_time: string;
  exhibition_location: string;
  exhibition_description: string;
  exhibition_link: string;
  exhibition_image?: string;
  organizer_name: string;
  application_deadline?: string;
  categories?: string[];
  role: 'brand' | 'shopper';
  apply_link?: string;
  calendar_link?: string;
  unsubscribe_link: string;
  from?: string;
}

// Stall application status email interfaces
export interface StallStatusEmailData {
  to: string;
  brand_name: string;
  status: 'approved' | 'pending' | 'rejected';
  status_display?: string;
  exhibition_name: string;
  exhibition_date: string;
  exhibition_location: string;
  organizer_name: string;
  organizer_comments?: string;
  application_link: string;
  stall_number?: string;
  stall_size?: string;
  setup_date?: string;
  setup_time?: string;
  payment_required?: boolean;
  payment_deadline?: string;
  payment_amount?: string;
  payment_link?: string;
  browse_exhibitions_link?: string;
  from?: string;
}

/**
 * Email Service for sending emails via the API
 */
class EmailService {
  private apiUrl: string;

  constructor(config?: EmailServiceConfig) {
    this.apiUrl = config?.apiUrl || EMAIL_API_URL;
  }

  /**
   * Send an email immediately via the API
   * @param emailData - Email data
   * @returns Promise with send result
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending email via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an email using a template
   * @param templateData - Template email data
   * @returns Promise with send result
   */
  async sendTemplateEmail(templateData: TemplateEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send template email');
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending template email via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue an email for later delivery
   * @param emailData - Email data
   * @returns Promise with queue result
   */
  async queueEmail(emailData: EmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to queue email');
      }

      return { success: true, queueId: result.queueId };
    } catch (error: any) {
      console.error('Error queuing email via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue a template email for later delivery
   * @param templateData - Template email data
   * @returns Promise with queue result
   */
  async queueTemplateEmail(templateData: TemplateEmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/queue/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to queue template email');
      }

      return { success: true, queueId: result.queueId };
    } catch (error: any) {
      console.error('Error queuing template email via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process the email queue
   * @returns Promise with processing result
   */
  async processEmailQueue(): Promise<{ success: boolean; processed?: number; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/queue/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process email queue');
      }

      return { success: true, processed: result.processed };
    } catch (error: any) {
      console.error('Error processing email queue via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify SMTP connection
   * @returns Promise with verification result
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/check-connection`, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify SMTP connection');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying SMTP connection via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email logs
   * @param options - Log filtering options
   * @returns Promise with logs
   */
  async getLogs(options: EmailLogOptions = {}): Promise<any> {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      
      if (options.status) queryParams.append('status', options.status);
      if (options.operation) queryParams.append('operation', options.operation);
      if (options.toEmail) queryParams.append('toEmail', options.toEmail);
      if (options.templateId) queryParams.append('templateId', options.templateId);
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      
      const queryString = queryParams.toString();
      const url = `${this.apiUrl}/logs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get email logs');
      }

      return result.logs;
    } catch (error: any) {
      console.error('Error getting email logs via API:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   * @returns Promise with email statistics
   */
  async getEmailStats(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/stats`, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get email statistics');
      }

      return result.stats;
    } catch (error: any) {
      console.error('Error getting email statistics via API:', error);
      throw error;
    }
  }

  /**
   * Diagnose email issues
   * @returns Promise with diagnostics
   */
  async diagnoseEmailIssues(): Promise<EmailDiagnostics> {
    try {
      const response = await fetch(`${this.apiUrl}/diagnose`, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to diagnose email issues');
      }

      return result.diagnostics;
    } catch (error: any) {
      console.error('Error diagnosing email issues via API:', error);
      throw error;
    }
  }

  /**
   * Send a test email to verify connectivity
   * @param to - Recipient email address
   * @returns Promise with send result
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending test email via API:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a test template email to verify template system
   * @param to - Recipient email address
   * @param templateId - Template ID to test
   * @returns Promise with send result
   */
  async sendTestTemplateEmail(to: string, templateId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/test/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, templateId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test template email');
      }

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('Error sending test template email via API:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send a welcome email to a new user
   * @param data - Welcome email data
   * @returns Promise with send result
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Prepare template data with role flags for conditional rendering
      const templateData = {
        to: data.to,
        templateId: 'welcome',
        data: {
          ...data,
          role_is_organiser: data.role === 'organiser',
          role_is_brand: data.role === 'brand',
          role_is_shopper: data.role === 'shopper'
        },
        from: data.from
      };
      
      // Send welcome email using template
      return await this.sendTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send a welcome email to a new user
   * @param data - Welcome email data
   * @returns Promise with queue result
   */
  async queueWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Prepare template data with role flags for conditional rendering
      const templateData = {
        to: data.to,
        templateId: 'welcome',
        data: {
          ...data,
          role_is_organiser: data.role === 'organiser',
          role_is_brand: data.role === 'brand',
          role_is_shopper: data.role === 'shopper'
        },
        from: data.from
      };
      
      // Queue welcome email using template
      return await this.queueTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error queuing welcome email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send an exhibition reminder email
   * @param data - Exhibition reminder email data
   * @returns Promise with send result
   */
  async sendExhibitionReminderEmail(data: ExhibitionReminderEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Prepare template data
      const templateData = {
        to: data.to,
        templateId: 'exhibition-reminder',
        data: {
          ...data,
          // Default role flags if not provided
          role_is_organiser: data.role_is_organiser !== undefined ? data.role_is_organiser : data.user_role === 'organizing',
          role_is_brand: data.role_is_brand !== undefined ? data.role_is_brand : data.user_role === 'participating',
          role_is_shopper: data.role_is_shopper !== undefined ? data.role_is_shopper : data.user_role === 'attending'
        },
        from: data.from
      };
      
      // Send exhibition reminder email using template
      return await this.sendTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error sending exhibition reminder email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Queue an exhibition reminder email
   * @param data - Exhibition reminder email data
   * @returns Promise with queue result
   */
  async queueExhibitionReminderEmail(data: ExhibitionReminderEmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Prepare template data
      const templateData = {
        to: data.to,
        templateId: 'exhibition-reminder',
        data: {
          ...data,
          // Default role flags if not provided
          role_is_organiser: data.role_is_organiser !== undefined ? data.role_is_organiser : data.user_role === 'organizing',
          role_is_brand: data.role_is_brand !== undefined ? data.role_is_brand : data.user_role === 'participating',
          role_is_shopper: data.role_is_shopper !== undefined ? data.role_is_shopper : data.user_role === 'attending'
        },
        from: data.from
      };
      
      // Queue exhibition reminder email using template
      return await this.queueTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error queuing exhibition reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a new exhibition notification email
   * @param data - New exhibition email data
   * @returns Promise with send result
   */
  async sendNewExhibitionEmail(data: NewExhibitionEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Prepare template data with role flags for conditional rendering
      const templateData = {
        to: data.to,
        templateId: 'new-exhibition',
        data: {
          ...data,
          role_is_brand: data.role === 'brand',
          role_is_shopper: data.role === 'shopper'
        },
        from: data.from
      };
      
      // Send new exhibition email using template
      return await this.sendTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error sending new exhibition email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Queue a new exhibition notification email
   * @param data - New exhibition email data
   * @returns Promise with queue result
   */
  async queueNewExhibitionEmail(data: NewExhibitionEmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Prepare template data with role flags for conditional rendering
      const templateData = {
        to: data.to,
        templateId: 'new-exhibition',
        data: {
          ...data,
          role_is_brand: data.role === 'brand',
          role_is_shopper: data.role === 'shopper'
        },
        from: data.from
      };
      
      // Queue new exhibition email using template
      return await this.queueTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error queuing new exhibition email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send a stall application status email
   * @param data - Stall status email data
   * @returns Promise with send result
   */
  async sendStallStatusEmail(data: StallStatusEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Prepare status class and display text if not provided
      const statusClass = data.status;
      const statusDisplay = data.status_display || data.status.charAt(0).toUpperCase() + data.status.slice(1);
      
      // Prepare template data
      const templateData = {
        to: data.to,
        templateId: 'stall-status',
        data: {
          ...data,
          status_class: statusClass,
          status_display: statusDisplay,
          is_approved: data.status === 'approved',
          is_pending: data.status === 'pending',
          is_rejected: data.status === 'rejected'
        },
        from: data.from
      };
      
      // Send stall status email using template
      return await this.sendTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error sending stall status email:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Queue a stall application status email
   * @param data - Stall status email data
   * @returns Promise with queue result
   */
  async queueStallStatusEmail(data: StallStatusEmailData): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Prepare status class and display text if not provided
      const statusClass = data.status;
      const statusDisplay = data.status_display || data.status.charAt(0).toUpperCase() + data.status.slice(1);
      
      // Prepare template data
      const templateData = {
        to: data.to,
        templateId: 'stall-status',
        data: {
          ...data,
          status_class: statusClass,
          status_display: statusDisplay,
          is_approved: data.status === 'approved',
          is_pending: data.status === 'pending',
          is_rejected: data.status === 'rejected'
        },
        from: data.from
      };
      
      // Queue stall status email using template
      return await this.queueTemplateEmail(templateData);
    } catch (error: any) {
      console.error('Error queuing stall status email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new EmailService(); 
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async testConfiguration(): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/email/test`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test email configuration');
      }

      return data;
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 
// Import email service
import emailServiceDefault, { type EmailData, type EmailServiceConfig, type EmailLogOptions, type EmailDiagnostics, type TemplateEmailData } from './emailService';

// Import template compiler
import { compileTemplate, loadAndCompileTemplate } from './templateCompiler';

// Import application email service
import { 
  sendApplicationStatusEmail,
  sendPaymentReminderEmail 
} from './applicationEmailService';

// Import exhibition email service
import { 
  sendExhibitionCreatedEmail,
  sendExhibitionReminderEmails,
  sendExhibitionCancelledEmails 
} from './exhibitionEmailService';

// Export email service
export { 
  default as emailService,
  type EmailData, 
  type TemplateEmailData, 
  type EmailServiceConfig,
  type EmailLogOptions,
  type EmailDiagnostics
} from './emailService';

// Export template compiler
export { 
  compileTemplate, 
  compileEmailTemplate,
  fetchTemplates,
  getTemplate,
  setTemplateCache,
  getTemplateCache,
  clearTemplateCache
} from './templateCompiler';

// Export application email service
export { 
  sendApplicationStatusEmail,
  sendPaymentReminderEmail 
} from './applicationEmailService';

// Export exhibition email service
export { 
  sendExhibitionCreatedEmail,
  sendExhibitionReminderEmails,
  sendExhibitionCancelledEmails 
} from './exhibitionEmailService';

// Import types for internal use
import {
  compileTemplate as compileTemplateFunc,
  compileEmailTemplate as compileEmailTemplateFunc,
  fetchTemplates as fetchTemplatesFunc,
  getTemplate as getTemplateFunc,
  setTemplateCache as setTemplateCacheFunc,
  getTemplateCache as getTemplateCacheFunc,
  clearTemplateCache as clearTemplateCacheFunc
} from './templateCompiler';

// Export a unified API for all email services
export const emailServices = {
  // Core email service
  core: emailServiceDefault,
  
  // Template functions
  templates: {
    compile: compileTemplateFunc,
    compileEmail: compileEmailTemplateFunc,
    fetch: fetchTemplatesFunc,
    get: getTemplateFunc,
    setCache: setTemplateCacheFunc,
    getCache: getTemplateCacheFunc,
    clearCache: clearTemplateCacheFunc
  },
  
  // Application emails
  application: {
    sendStatusUpdate: sendApplicationStatusEmail,
    sendPaymentReminder: sendPaymentReminderEmail
  },
  
  // Exhibition emails
  exhibition: {
    sendCreatedNotification: sendExhibitionCreatedEmail,
    sendReminders: sendExhibitionReminderEmails,
    sendCancellationNotices: sendExhibitionCancelledEmails
  },
  
  // Testing and diagnostics
  diagnostics: {
    verifyConnection: () => emailServiceDefault.verifyConnection(),
    diagnoseIssues: () => emailServiceDefault.diagnoseEmailIssues(),
    getLogs: (options?: EmailLogOptions) => emailServiceDefault.getLogs(options),
    getStats: () => emailServiceDefault.getEmailStats(),
    sendTestEmail: (to: string) => emailServiceDefault.sendTestEmail(to),
    sendTestTemplateEmail: (to: string, templateId: string) => emailServiceDefault.sendTestTemplateEmail(to, templateId)
  }
}; 
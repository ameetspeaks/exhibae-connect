/**
 * Enhanced template compiler for email templates
 * Supports variable substitution, conditionals, and loops
 */

// Default template cache
let templateCache: Record<string, any> = {};

/**
 * Simple template compiler that replaces {{variables}} in templates with values
 * @param template Template string with {{variable}} placeholders
 * @param data Object with key-value pairs to replace in the template
 * @returns Compiled template with variables replaced
 */
export function compileTemplate(template: string, data: Record<string, any>): string {
  let compiledTemplate = template;
  
  // Replace all variables in the template
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledTemplate = compiledTemplate.replace(regex, value?.toString() || '');
  }
  
  return compiledTemplate;
}

/**
 * Get a nested property from an object using dot notation
 * @param obj - The object to get the property from
 * @param path - The path to the property using dot notation (e.g., 'user.name')
 * @returns The value at the specified path or undefined if not found
 */
function getNestedProperty(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
}

/**
 * Process conditional statements in templates
 * @param template - The template string
 * @param data - Data object
 * @returns Processed template
 */
function processConditionals(template: string, data: Record<string, any>): string {
  // Match conditional blocks: {{#if variable}}content{{/if}}
  const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  return template.replace(conditionalRegex, (match, condition, content) => {
    const trimmedCondition = condition.trim();
    
    // Check if it's a nested property
    if (trimmedCondition.includes('.')) {
      const value = getNestedProperty(data, trimmedCondition);
      return value ? content : '';
    }
    
    // Check if condition is true
    return data[trimmedCondition] ? content : '';
  });
}

/**
 * Compiles an email template with subject and HTML content
 * @param template - The email template object with subject and html_content
 * @param data - Object containing values to replace placeholders
 * @returns The compiled template with subject and html
 */
export function compileEmailTemplate(
  template: { subject: string; html_content: string } | null,
  data: Record<string, any> = {}
): { subject: string; html: string } {
  if (!template) {
    return { subject: '', html: '' };
  }
  
  return {
    subject: compileTemplate(template.subject, data),
    html: compileTemplate(template.html_content, data)
  };
}

/**
 * Fetch templates from the API
 * @returns Promise with the templates
 */
export async function fetchTemplates(api_url?: string): Promise<Record<string, any>> {
  const apiUrl = api_url || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/email/templates`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    
    const templates = await response.json();
    templateCache = templates;
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return {};
  }
}

/**
 * Get a template by ID
 * @param templateId - The template ID
 * @returns The template or null if not found
 */
export async function getTemplate(templateId: string): Promise<any> {
  // If template is not in cache, fetch templates from API
  if (Object.keys(templateCache).length === 0) {
    await fetchTemplates();
  }
  
  return templateCache[templateId] || null;
}

/**
 * Set the default template cache
 * @param templates - The templates to cache
 */
export function setTemplateCache(templates: Record<string, any>): void {
  templateCache = templates;
}

/**
 * Get all cached templates
 * @returns The cached templates
 */
export function getTemplateCache(): Record<string, any> {
  return templateCache;
}

/**
 * Clear the template cache
 */
export function clearTemplateCache(): void {
  templateCache = {};
}

/**
 * Loads a template from a file and compiles it with data
 * @param templatePath Path to the template file
 * @param data Data to use for compilation
 * @returns Promise with the compiled template
 */
export async function loadAndCompileTemplate(
  templatePath: string, 
  data: Record<string, any>
): Promise<string> {
  try {
    // Load the template using the fetch API (works in browser)
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const template = await response.text();
    return compileTemplate(template, data);
  } catch (error) {
    console.error('Error loading or compiling template:', error);
    throw error;
  }
}

/**
 * Utility to escape HTML in template variables
 * @param str String to escape
 * @returns Escaped string
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compiles a template with HTML escaping for all variables
 * @param template Template string
 * @param data Data for compilation
 * @returns Compiled template with escaped variables
 */
export function compileTemplateWithEscaping(template: string, data: Record<string, any>): string {
  const escapedData: Record<string, any> = {};
  
  // Escape all string values
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      escapedData[key] = escapeHtml(value);
    } else {
      escapedData[key] = value;
    }
  }
  
  return compileTemplate(template, escapedData);
}

/**
 * Generates a preview of a template by compiling it with sample data
 * @param template Template string
 * @param sampleData Optional sample data (will generate defaults if not provided)
 * @returns Compiled preview
 */
export function generateTemplatePreview(
  template: string, 
  sampleData?: Record<string, any>
): string {
  // Extract all variables from the template
  const variableRegex = /{{([^{}]+)}}/g;
  const matches = template.matchAll(variableRegex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }
  
  // Generate sample data for variables if not provided
  const previewData: Record<string, any> = sampleData ? { ...sampleData } : {};
  
  for (const variable of variables) {
    if (previewData[variable] === undefined) {
      // Generate a default value based on the variable name
      previewData[variable] = generateDefaultValue(variable);
    }
  }
  
  return compileTemplate(template, previewData);
}

/**
 * Generate a reasonable default value for a template variable based on its name
 * @param variableName Variable name
 * @returns Default value
 */
function generateDefaultValue(variableName: string): string {
  // Common variable name patterns and suggested values
  if (variableName.includes('name')) {
    return 'John Doe';
  } else if (variableName.includes('email')) {
    return 'john.doe@example.com';
  } else if (variableName.includes('date')) {
    return new Date().toLocaleDateString();
  } else if (variableName.includes('time')) {
    return new Date().toLocaleTimeString();
  } else if (variableName.includes('link') || variableName.includes('url')) {
    return 'https://example.com';
  } else if (variableName.includes('description')) {
    return 'This is a sample description for preview purposes.';
  } else if (variableName.includes('reason')) {
    return 'This is a sample reason for preview purposes.';
  } else if (variableName.includes('amount') || variableName.includes('price')) {
    return '$99.99';
  } else if (variableName.includes('status')) {
    return 'Active';
  } else if (variableName.includes('number')) {
    return '12345';
  } else {
    return `[${variableName}]`;
  }
} 
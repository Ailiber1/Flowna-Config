/**
 * Specification File Parser
 * Parses .txt and .md files to extract project information
 */

export interface ParsedSpec {
  title: string;
  description: string;
  features: string[];
  rawContent: string;
}

/**
 * Parse a specification file content to extract project information
 */
export function parseSpecFile(content: string, fileName: string): ParsedSpec {
  const lines = content.split('\n');
  let title = '';
  let description = '';
  const features: string[] = [];

  // Try to extract title from various formats
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Markdown header
    if (trimmedLine.startsWith('# ')) {
      title = trimmedLine.replace(/^#\s+/, '');
      break;
    }

    // Title: format
    if (trimmedLine.toLowerCase().startsWith('title:')) {
      title = trimmedLine.replace(/^title:\s*/i, '');
      break;
    }

    // Project Name: format
    if (trimmedLine.toLowerCase().startsWith('project name:') || trimmedLine.toLowerCase().startsWith('project:')) {
      title = trimmedLine.replace(/^project\s*(name)?:\s*/i, '');
      break;
    }

    // Name: format
    if (trimmedLine.toLowerCase().startsWith('name:')) {
      title = trimmedLine.replace(/^name:\s*/i, '');
      break;
    }

    // First non-empty line as fallback
    if (!title && trimmedLine.length > 0 && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
      title = trimmedLine;
    }
  }

  // If no title found, use filename
  if (!title) {
    title = fileName.replace(/\.(txt|md)$/i, '');
  }

  // Extract description (usually after title)
  let foundTitle = false;
  let descriptionLines: string[] = [];
  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.includes(title)) {
      foundTitle = true;
      continue;
    }

    if (foundTitle && trimmedLine.length > 0) {
      // Stop at next header or list
      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('## ')) {
        break;
      }
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        features.push(trimmedLine.replace(/^[-*]\s+/, ''));
      } else {
        descriptionLines.push(trimmedLine);
      }
    }
  }

  description = descriptionLines.slice(0, 3).join(' ').substring(0, 200);

  return {
    title: sanitizeProjectName(title),
    description,
    features,
    rawContent: content,
  };
}

/**
 * Sanitize project name for use in repository/project names
 */
function sanitizeProjectName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]/g, '-') // Allow Japanese chars
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Extract title only from spec content
 */
export function extractTitle(content: string): string {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Markdown header
    if (trimmedLine.startsWith('# ')) {
      return trimmedLine.replace(/^#\s+/, '').trim();
    }

    // Title: format
    if (trimmedLine.toLowerCase().startsWith('title:')) {
      return trimmedLine.replace(/^title:\s*/i, '').trim();
    }

    // First non-empty line
    if (trimmedLine.length > 0 && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
      return trimmedLine;
    }
  }

  return 'Untitled';
}

/**
 * @file Parse/validate MQTT topic → { homeId, deviceId } according to contract.
 */

/**
 * @typedef {import('../types.js').ParsedTopic} ParsedTopic
 */

/**
 * Build a topic parser for the given pattern.
 * @param {string} pattern - Topic pattern with placeholders (default: home/{homeId}/sensors/{deviceId}/reading)
 * @returns {(topic: string) => ParsedTopic} Parser function
 * @throws {Error} if pattern is invalid
 * @example
 * const parser = buildTopicParser();
 * const result = parser('home/house-001/sensors/temp-01/reading');
 * // result: { homeId: 'house-001', deviceId: 'temp-01' }
 */
export function buildTopicParser(pattern = 'home/{homeId}/sensors/{deviceId}/reading') {
  // Validate pattern input
  if (pattern === null || pattern === undefined) {
    throw new Error('Pattern is required');
  }

  if (typeof pattern !== 'string') {
    throw new Error('Pattern must be a string');
  }

  if (pattern.trim() === '') {
    throw new Error('Pattern is required and cannot be empty');
  }

  // Validate pattern format - must contain at least one placeholder
  const placeholderRegex = /{([^}]+)}/g;
  const placeholders = [];
  let match;

  while ((match = placeholderRegex.exec(pattern)) !== null) {
    placeholders.push(match[1]);
  }

  if (placeholders.length === 0) {
    throw new Error('Pattern is invalid: must contain at least one placeholder like {homeId}');
  }

  // Build regex from pattern
  // Escape special regex characters and replace placeholders
  let regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape special chars
    .replace(/\\{([^}]+)\\}/g, '([^/]*)'); // Replace placeholders with capture groups (allow empty for better error messages)

  // Anchor the pattern to match the entire string
  regexPattern = '^' + regexPattern + '$';

  const regex = new RegExp(regexPattern);

  // Return the parser function
  return function (topic) {
    // Validate null/undefined first
    if (topic === null || topic === undefined) {
      throw new Error('Topic is required');
    }

    // Validate input types
    if (typeof topic !== 'string') {
      throw new Error('Topic must be a string');
    }

    if (topic.trim() === '') {
      throw new Error('Invalid topic format: topic cannot be empty');
    }

    // Test against regex
    const match = regex.exec(topic);
    if (!match) {
      throw new Error(`Invalid topic format: expected ${pattern}`);
    }

    // Extract captured groups and map to placeholders
    const result = {};
    for (let i = 0; i < placeholders.length; i++) {
      const value = match[i + 1]; // Skip the full match at index 0
      const placeholderName = placeholders[i];

      // Validate ID constraints from contract - empty first
      if (!value || value.length === 0 || value.trim() === '') {
        throw new Error(`Empty ID: ${placeholderName} cannot be empty`);
      }

      // Check length constraints (1-50 characters as per contract)
      if (value.length > 50) {
        throw new Error(`ID too long: ${placeholderName} exceeds 50 characters`);
      }

      // Check valid characters: alphanumeric, hyphens, underscores
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        throw new Error(`Invalid ${placeholderName}: contains invalid characters`);
      }

      result[placeholders[i]] = value;
    }

    return result;
  };
}

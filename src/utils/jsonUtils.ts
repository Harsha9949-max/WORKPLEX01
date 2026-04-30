/**
 * Safe JSON stringification that handles circular references and Firebase types.
 */
export function safeStringify(obj: any, indent: number = 2): string {
  const cache = new Set();
  
  try {
    const result = JSON.stringify(obj, (key, value) => {
      // 1. Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        return undefined;
      }

      // 2. Handle Circular References
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }

      // 3. Handle Firebase Timestamps
      if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        return new Date(value.seconds * 1000).toISOString();
      }

      // 4. Handle Firebase DocumentReference / Firestore instances (minified as Y2/Ka often)
      // These usually have a 'path' or 'id' property if they are references
      if (value && typeof value === 'object' && ('_key' in value || 'path' in value) && 'firestore' in value) {
        return `[FirestoreReference: ${value.path || 'unknown'}]`;
      }

      return value;
    }, indent);

    cache.clear();
    return result;
  } catch (err) {
    cache.clear();
    return `[Unstringifiable JSON: ${err instanceof Error ? err.message : String(err)}]`;
  }

}

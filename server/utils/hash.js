import crypto from 'crypto';
import path from 'path';

export function getPossibleHashes(projectPath) {
  const p = path.resolve(projectPath);
  const variants = [
    p, 
    p.toLowerCase(), 
    p.replace(/\\/g, '/'), 
    p.toLowerCase().replace(/\\/g, '/')
  ];
  return [...new Set(variants)].map(v => 
    crypto.createHash('sha256').update(v).digest('hex')
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Publication } from '../components/Editor';

export interface ParsedBibEntry {
  type: string;
  citeKey: string;
  title?: string;
  authors?: string;
  journal?: string;
  year?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  codeUrl?: string;
  abstract?: string;
  bibtex?: string;
}

/**
 * Parses raw BibTeX text into a list of partial Publication objects
 */
export function parseBibTeX(bibText: string): Partial<Publication>[] {
  if (!bibText || !bibText.trim()) return [];

  // Match each entry starting with @entryType{citeKey,
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)(?=\n@|\n*$)/g;
  const results: Partial<Publication>[] = [];
  let match;

  while ((match = entryRegex.exec(bibText)) !== null) {
    const rawType = match[1].toLowerCase();
    const citeKey = match[2];
    const body = match[3];
    const rawEntry = match[0];

    // Map BibTeX type to publication type
    let type: Publication['type'] = 'journal';
    if (rawType.includes('inproceedings') || rawType.includes('conference')) {
      type = 'conference';
    } else if (rawType.includes('article')) {
      type = 'journal';
    } else if (rawType.includes('techreport') || rawType.includes('preprint') || rawType.includes('unpublished')) {
      type = 'preprint';
    } else if (rawType.includes('book') || rawType.includes('incollection')) {
      type = 'book';
    } else if (rawType.includes('patent')) {
      type = 'patent';
    } else if (rawType.includes('workshop')) {
      type = 'workshop';
    }

    const fields: Record<string, string> = {};

    // Parse key = {value} or key = "value" or key = number
    const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*(\{[\s\S]*?\}|"[^"]*"|\d+)/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const key = fieldMatch[1].toLowerCase();
      let value = fieldMatch[2].trim();

      // Strip enclosing braces or quotes
      if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1).trim();
      }

      // Clean up whitespace & linebreaks
      value = value.replace(/\s+/g, ' ');

      fields[key] = value;
    }

    // Format authors: "Morgan, Alex and Chen, Lin" -> "Alex Morgan, Lin Chen"
    let authorsStr = fields['author'] || fields['authors'] || '';
    if (authorsStr) {
      authorsStr = authorsStr
        .split(/\s+and\s+/i)
        .map(a => {
          const parts = a.trim().split(',');
          if (parts.length === 2) {
            return `${parts[1].trim()} ${parts[0].trim()}`;
          }
          return a.trim();
        })
        .join(', ');
    }

    const title = fields['title']?.replace(/[{}]/g, '') || 'Untitled Publication';
    const journal = fields['journal'] || fields['booktitle'] || fields['publisher'] || fields['school'] || fields['institution'] || fields['archiveprefix'] || 'Academic Venue';
    const year = fields['year'] || new Date().getFullYear().toString();
    const doi = fields['doi'] || '';
    const url = fields['url'] || (doi ? `https://doi.org/${doi}` : '');
    const pdfUrl = fields['pdf'] || fields['pdfurl'] || fields['eprint'] ? (fields['eprint'] ? `https://arxiv.org/pdf/${fields['eprint']}.pdf` : '') : '';
    const codeUrl = fields['code'] || fields['codeurl'] || fields['repository'] || '';
    const abstract = fields['abstract'] || '';

    results.push({
      title,
      authors: authorsStr,
      journal,
      year,
      doi,
      url,
      pdfUrl,
      codeUrl,
      abstract,
      bibtex: rawEntry,
      type
    });
  }

  return results;
}

/**
 * Converts an array of Publication objects into standard BibTeX string
 */
export function generateBibTeX(publications: Publication[]): string {
  return publications.map((pub, idx) => {
    const citeKey = pub.doi ? pub.doi.replace(/[^a-zA-Z0-9]/g, '_') : `pub_${pub.year || '2025'}_${idx + 1}`;
    const typeStr = pub.type === 'conference' ? 'inproceedings' : (pub.type === 'book' ? 'book' : 'article');
    
    let entry = `@${typeStr}{${citeKey},\n`;
    entry += `  title = {${pub.title}},\n`;
    if (pub.authors) entry += `  author = {${pub.authors}},\n`;
    if (pub.journal) entry += `  ${typeStr === 'inproceedings' ? 'booktitle' : 'journal'} = {${pub.journal}},\n`;
    if (pub.year) entry += `  year = {${pub.year}},\n`;
    if (pub.doi) entry += `  doi = {${pub.doi}},\n`;
    if (pub.url) entry += `  url = {${pub.url}},\n`;
    if (pub.pdfUrl) entry += `  pdf = {${pub.pdfUrl}},\n`;
    if (pub.codeUrl) entry += `  code = {${pub.codeUrl}},\n`;
    if (pub.abstract) entry += `  abstract = {${pub.abstract}},\n`;
    entry += `}`;
    return entry;
  }).join('\n\n');
}

/**
 * Generates formatted citation strings (APA / IEEE)
 */
export function formatCitation(pub: Publication, format: 'APA' | 'IEEE' | 'apa' | 'ieee' = 'APA'): string {
  const fmt = format.toUpperCase();
  if (fmt === 'IEEE') {
    return `${pub.authors || 'Author'}, "${pub.title}," ${pub.journal || 'Venue'}, ${pub.year || 'n.d.'}${pub.doi ? `, doi: ${pub.doi}` : ''}.`;
  }
  // APA default
  return `${pub.authors || 'Author'} (${pub.year || 'n.d.'}). ${pub.title}. ${pub.journal || 'Venue'}.${pub.doi ? ` https://doi.org/${pub.doi}` : ''}`;
}

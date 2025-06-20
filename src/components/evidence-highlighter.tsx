
"use client";

import React from 'react';

interface EvidenceHighlighterProps {
  text: string;
  evidence: string[]; // This prop is currently always passed as []
}

export function EvidenceHighlighter({ text, evidence }: EvidenceHighlighterProps) {
  // Ensure text is a string and replace literal "\\n" with actual newline characters ('\n') for rendering.
  const processedText = String(text || "").replace(/\\n/g, '\n');

  // Since the `evidence` prop is always `[]` in the current app structure (errorCase.evidence was removed),
  // the highlighting logic below is not active. The component effectively just renders `processedText`.
  if (!evidence || evidence.length === 0) {
    return <p className="whitespace-pre-wrap leading-relaxed">{processedText}</p>;
  }

  // The following code for highlighting is kept for completeness.
  // If highlighting were to be re-enabled, this logic would apply.
  // It's important to consider whether `evidence` strings would also contain "\\n"
  // and how they should be matched against `processedText`.

  const sortedEvidence = [...evidence].sort((a, b) => b.length - a.length);
  // Escape regex special characters in evidence strings
  const escapedEvidence = sortedEvidence.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  // If, after processing, there's no evidence to highlight (e.g., all evidence strings were empty or invalid)
  if (escapedEvidence.length === 0 || escapedEvidence.every(e => e === "")) {
     return <p className="whitespace-pre-wrap leading-relaxed">{processedText}</p>;
  }

  // Regex to find any of the evidence strings. Added 'i' for case-insensitive matching.
  const regex = new RegExp(`(${escapedEvidence.join('|')})`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  // Use `processedText` for matching and slicing, so highlighting works with the text that includes actual newlines.
  while ((match = regex.exec(processedText)) !== null) {
    // Add text part before the match
    if (match.index > lastIndex) {
      parts.push(processedText.substring(lastIndex, match.index));
    }
    // Add the highlighted match
    parts.push(
      <mark
        key={`evidence-${match.index}-${match[0].length}`}
        className="bg-accent/30 text-accent-foreground p-0.5 rounded mx-px transition-all duration-300"
      >
        {match[0]}
      </mark>
    );
    lastIndex = regex.lastIndex;
  }

  // Add any remaining text part after the last match
  if (lastIndex < processedText.length) {
    parts.push(processedText.substring(lastIndex));
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => (
        <React.Fragment key={i}>{part}</React.Fragment>
      ))}
    </p>
  );
}

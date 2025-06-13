"use client";

import React from 'react';

interface EvidenceHighlighterProps {
  text: string;
  evidence: string[];
}

export function EvidenceHighlighter({ text, evidence }: EvidenceHighlighterProps) {
  if (!evidence || evidence.length === 0) {
    return <>{text}</>;
  }

  // Escape regex special characters in evidence strings and sort by length descending to match longer evidence first.
  const sortedEvidence = [...evidence].sort((a, b) => b.length - a.length);
  const escapedEvidence = sortedEvidence.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  if (escapedEvidence.length === 0) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${escapedEvidence.join('|')})`, 'g');

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
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

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => (
        <React.Fragment key={i}>{part}</React.Fragment>
      ))}
    </p>
  );
}

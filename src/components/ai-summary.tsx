"use client";

import React, { useState, useEffect } from 'react';
import { summarizeLLMAnswer } from '@/ai/flows/summarize-llm-answer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AISummaryProps {
  llmAnswer: string;
  diagnosis: string;
  internalId: string; // Changed from champsid to the unique internal ID
}

export function AISummary({ llmAnswer, diagnosis, internalId }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset summary when internalId changes, indicating a new case
    setSummary(null);
    setError(null);
    setIsLoading(true);

    const fetchSummary = async () => {
      try {
        const result = await summarizeLLMAnswer({ llmAnswer, diagnosis });
        setSummary(result.summary);
      } catch (e) {
        console.error("Error fetching AI summary:", e);
        setError("Failed to generate summary. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (llmAnswer && diagnosis) {
      fetchSummary();
    } else {
      setIsLoading(false);
      // Do not set an error if llmAnswer or diagnosis is simply not provided yet.
      // Let the UI show "No data provided" in that case.
      if (!llmAnswer || !diagnosis) {
         setSummary(null); // Ensure summary is cleared if inputs are missing
      }
    }
  }, [llmAnswer, diagnosis, internalId]); // Use internalId in dependency array

  return (
    <Card className="w-full"> {/* Make card take full width of its container */}
      <CardHeader>
        <CardTitle className="font-headline text-lg">AI-Powered Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {error && !isLoading && (
           <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
        )}
        {!isLoading && !error && summary && <p className="text-sm">{summary}</p>}
        {!isLoading && !error && !summary && (llmAnswer && diagnosis) && (
            <p className="text-sm text-muted-foreground">Generating summary...</p> 
        )}
        {!isLoading && !error && !summary && (!llmAnswer || !diagnosis) && (
            <p className="text-sm text-muted-foreground">Not enough data to generate summary (missing LLM answer or diagnosis).</p>
        )}
      </CardContent>
    </Card>
  );
}

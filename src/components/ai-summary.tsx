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
  champsid: string; // Add champsid to reset summary on case change
}

export function AISummary({ llmAnswer, diagnosis, champsid }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset summary when champsid changes, indicating a new case
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
      setError("Missing LLM answer or diagnosis for summary generation.");
    }
  }, [llmAnswer, diagnosis, champsid]); // Add champsid to dependency array

  return (
    <Card>
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
        {!isLoading && !error && !summary && !llmAnswer && !diagnosis && (
            <p className="text-sm text-muted-foreground">No data provided for summary.</p>
        )}
      </CardContent>
    </Card>
  );
}

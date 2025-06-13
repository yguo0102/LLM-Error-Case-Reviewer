
"use client";

import type { ErrorCase } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvidenceHighlighter } from './evidence-highlighter';
// AISummary is no longer used in this card, but might be used elsewhere. Keeping import for now if other plans exist.
// import { AISummary } from './ai-summary'; 
import { ScrollArea } from './ui/scroll-area';

interface ErrorCaseDisplayProps {
  errorCase: ErrorCase | null;
}

export function ErrorCaseDisplay({ errorCase }: ErrorCaseDisplayProps) {
  if (!errorCase) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select an error case to view details.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-1">
      <div className="space-y-6 p-4 md:p-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl">Case ID: {errorCase.champsid}</CardTitle>
                <CardDescription>Error Type: <Badge variant="destructive" className="ml-1">{errorCase.error_type}</Badge></CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-headline text-lg font-semibold mb-1">Full Text:</h3>
              <EvidenceHighlighter text={errorCase.text} evidence={errorCase.evidence} />
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold mb-1">LLM Answer:</h3>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{errorCase.llmAnswer}</p>
            </div>
             <div>
              <h3 className="font-headline text-lg font-semibold mb-1">Diagnosis:</h3>
              <p className="text-sm whitespace-pre-wrap bg-destructive/10 p-3 rounded-md">{errorCase.diagnosis}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">LLM Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Evidence Used by LLM:</h4>
              {errorCase.evidence.length > 0 ? (
                 <ul className="list-disc list-inside pl-4 space-y-1">
                  {errorCase.evidence.map((ev, index) => (
                    <li key={index} className="text-sm bg-accent/10 p-2 rounded-md">
                      <span className="italic">{ev}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific evidence cited by LLM.</p>
              )}
            </div>
          </CardContent>
          {/* 
          AISummary related to llmAnswer and diagnosis was here.
          <CardFooter>
            <AISummary llmAnswer={errorCase.llmAnswer} diagnosis={errorCase.diagnosis} champsid={errorCase.champsid} />
          </CardFooter> 
          */}
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Code Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Code:</h4>
              <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto font-code"><code>{errorCase.code}</code></pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Code Description:</h4>
              <p className="text-sm whitespace-pre-wrap">{errorCase.code_description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

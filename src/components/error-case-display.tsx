
"use client";

import type { ErrorCase } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvidenceHighlighter } from './evidence-highlighter';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <Card className="shadow-lg">
              <AccordionTrigger className="hover:no-underline">
                <CardHeader className="flex-1 p-6 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-2xl">Case ID: {errorCase.champsid}</CardTitle>
                      <CardDescription>Error Type: <Badge variant="destructive" className="ml-1">{errorCase.error_type}</Badge></CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <h3 className="font-headline text-lg font-semibold mb-1">Full Text:</h3>
                    <EvidenceHighlighter text={errorCase.text} evidence={[]} />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-semibold mb-1">LLM Answer:</h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{errorCase.llmAnswer}</p>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Code Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Groundtruth Code:</h4>
              <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto font-code"><code>{errorCase.groundtruth_code_list}</code></pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">LLM Predicted Code:</h4>
              <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto font-code"><code>{errorCase.llm_predicted_code}</code></pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

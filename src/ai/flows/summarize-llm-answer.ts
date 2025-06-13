'use server';

/**
 * @fileOverview Summarizes the LLM's answer and diagnosis for quick review.
 *
 * - summarizeLLMAnswer - A function that summarizes the LLM's answer and diagnosis.
 * - SummarizeLLMAnswerInput - The input type for the summarizeLLMAnswer function.
 * - SummarizeLLMAnswerOutput - The return type for the summarizeLLMAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLLMAnswerInputSchema = z.object({
  llmAnswer: z.string().describe('The LLM answer to summarize.'),
  diagnosis: z.string().describe('The diagnosis to summarize.'),
});
export type SummarizeLLMAnswerInput = z.infer<typeof SummarizeLLMAnswerInputSchema>;

const SummarizeLLMAnswerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the LLM answer and diagnosis.'),
});
export type SummarizeLLMAnswerOutput = z.infer<typeof SummarizeLLMAnswerOutputSchema>;

export async function summarizeLLMAnswer(input: SummarizeLLMAnswerInput): Promise<SummarizeLLMAnswerOutput> {
  return summarizeLLMAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLLMAnswerPrompt',
  input: {schema: SummarizeLLMAnswerInputSchema},
  output: {schema: SummarizeLLMAnswerOutputSchema},
  prompt: `Summarize the following LLM answer and diagnosis in a concise manner for a quick overview.\n\nLLM Answer: {{{llmAnswer}}}\nDiagnosis: {{{diagnosis}}}`,
});

const summarizeLLMAnswerFlow = ai.defineFlow(
  {
    name: 'summarizeLLMAnswerFlow',
    inputSchema: SummarizeLLMAnswerInputSchema,
    outputSchema: SummarizeLLMAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

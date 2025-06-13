export interface ErrorCase {
  internalId: string; // Added for unique identification within the app
  champsid: string;
  text: string;
  code: string;
  code_description: string;
  diagnosis: string;
  error_type: string;
  llmAnswer: string; // Renamed from "llm answer"
  evidence: string[];
}

export interface Filters {
  error_type: string;
  code: string;
  champsid: string;
}

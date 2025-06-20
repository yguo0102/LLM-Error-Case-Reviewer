export interface ErrorCase {
  internalId: string; // Added for unique identification within the app
  champsid: string;
  text: string;
  groundtruth_code_list: string; // New field
  llm_predicted_code: string; // Replaces 'code'
  error_type: string;
  llmAnswer: string; 
}

export interface Filters {
  error_type: string;
  code: string; // This will now filter on 'llm_predicted_code'
  champsid: string;
}

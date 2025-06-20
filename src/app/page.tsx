
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ErrorCase, Filters } from '@/types';
import { mockErrorCases } from '@/data/mock-data';
import { ErrorCaseDisplay } from '@/components/error-case-display';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Filter, ListFilter, ChevronLeft, ChevronRight, Search, FileText, SlidersHorizontal, FileUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";

const ALL_FILTER_VALUE = "__ALL_OPTIONS__";

// Helper function to parse a CSV line, handles quoted fields and escaped quotes
function csvLineToArray(text: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuotes && i + 1 < text.length && text[i+1] === '"') { // Handle "" as escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim()); // Add the last field
    return result;
}

// Helper function to extract the next logical CSV line, handling newlines within quoted fields.
function extractNextLogicalLine(text: string, startIndex: number): { line: string; nextIndex: number } {
  let inQuotes = false;
  let endIndex = startIndex;
  while (endIndex < text.length) {
    const char = text[endIndex];
    if (char === '"') {
      // Check for escaped quote ("")
      if (inQuotes && endIndex + 1 < text.length && text[endIndex + 1] === '"') {
        endIndex++; 
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      break;
    }
    endIndex++;
  }
  const line = text.substring(startIndex, endIndex); 
  return { line, nextIndex: endIndex < text.length ? endIndex + 1 : text.length }; 
}


export default function HomePage() {
  const [allCases, setAllCases] = useState<ErrorCase[]>(
    mockErrorCases.map((c, index) => ({
      ...c,
      internalId: `mock-${index}-${c.champsid}`, 
    }))
  );
  const [filteredCases, setFilteredCases] = useState<ErrorCase[]>(allCases);
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>({ error_type: '', code: '', champsid: '' });
  const { toast } = useToast();

  const uniqueErrorTypes = useMemo(() => Array.from(new Set(allCases.map(c => c.error_type))), [allCases]);
  const uniqueCodes = useMemo(() => Array.from(new Set(allCases.map(c => c.llm_predicted_code))), [allCases]);

  useEffect(() => {
    let cases = allCases;
    if (filters.error_type && filters.error_type !== ALL_FILTER_VALUE) {
      cases = cases.filter(c => c.error_type === filters.error_type);
    }
    if (filters.code && filters.code !== ALL_FILTER_VALUE) {
      cases = cases.filter(c => c.llm_predicted_code === filters.code);
    }
    if (filters.champsid) {
      cases = cases.filter(c => c.champsid.toLowerCase().includes(filters.champsid.toLowerCase()));
    }
    setFilteredCases(cases);
    setCurrentCaseIndex(0); 
  }, [filters, allCases]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === ALL_FILTER_VALUE ? '' : value }));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentCaseIndex > 0) {
      setCurrentCaseIndex(prev => prev - 1);
    } else if (direction === 'next' && currentCaseIndex < filteredCases.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    }
  };
  
  const handleSelectCase = (internalId: string) => {
    const index = filteredCases.findIndex(c => c.internalId === internalId);
    if (index !== -1) {
      setCurrentCaseIndex(index);
    }
  };

  const parseCSVAndSetCases = (csvFullText: string) => {
    const trimmedCsvText = csvFullText.trim(); 
    if (!trimmedCsvText) {
      toast({ title: "Error parsing CSV", description: "CSV file is empty or contains only whitespace.", variant: "destructive" });
      return;
    }

    let currentIndex = 0;
    
    const { line: headerCsvLine, nextIndex: headerEndIndex } = extractNextLogicalLine(trimmedCsvText, currentIndex);
    currentIndex = headerEndIndex;

    if (!headerCsvLine.trim()) {
        toast({ title: "Error parsing CSV", description: "CSV file is missing a header row.", variant: "destructive" });
        return;
    }
    
    const parsedHeaders = csvLineToArray(headerCsvLine.trim());
    const headers = parsedHeaders.map(h => h.toLowerCase().trim());
    const requiredHeaders = ['champsid', 'text', 'groundtruth_code_list', 'llm_predicted_code', 'llmanswer', 'error_type'];
    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
    
    if (missingHeaders.length > 0) {
      toast({ 
        title: "Error parsing CSV Headers", 
        description: `Missing required headers: ${missingHeaders.join(', ')}. Found headers in your file: ${parsedHeaders.join(', ')}. Ensure headers are correct and try again. Case-insensitive and trimmed.`, 
        variant: "destructive" 
      });
      return;
    }

    const newCases: ErrorCase[] = [];
    let logicalRowNumber = 1; 

    while (currentIndex < trimmedCsvText.length) {
        logicalRowNumber++;
        const { line: dataCsvLine, nextIndex: dataEndIndex } = extractNextLogicalLine(trimmedCsvText, currentIndex);
        currentIndex = dataEndIndex;

        const lineContentForParsing = dataCsvLine.trim();
        if (!lineContentForParsing) continue; 

        const values = csvLineToArray(lineContentForParsing);

        if (values.length !== headers.length) {
            const lineSnippet = lineContentForParsing.substring(0, 70) + (lineContentForParsing.length > 70 ? '...' : '');
            toast({ 
            title: "Warning parsing CSV row", 
            description: `Row ${logicalRowNumber} (starts with: "${lineSnippet}") has ${values.length} columns, expected ${headers.length}. Skipping this row. Check for unquoted commas or formatting issues. Newlines in quoted fields are supported.`, 
            variant: "destructive" 
            });
            continue;
        }

        const entry: any = {};
        headers.forEach((header, index) => {
            entry[header] = values[index] || ""; 
        });
        
        const errorCase: ErrorCase = {
            internalId: `csv-${logicalRowNumber}-${Date.now()}-${entry.champsid || 'no_id'}`, 
            champsid: entry.champsid || `GEN_ID_${Date.now()}_${logicalRowNumber}`,
            text: entry.text || "",
            groundtruth_code_list: entry.groundtruth_code_list || "",
            llm_predicted_code: entry.llm_predicted_code || "",
            error_type: entry.error_type || "",
            llmAnswer: entry.llmanswer || "", 
        };
        newCases.push(errorCase);
    }

    if (newCases.length > 0) {
      setAllCases(newCases);
      setCurrentCaseIndex(0);
      setFilters({ error_type: '', code: '', champsid: '' }); 
      toast({ title: "CSV data loaded successfully!", description: `${newCases.length} cases loaded.` });
    } else { 
      if (headerCsvLine.trim()) { 
        setAllCases([]); 
        setCurrentCaseIndex(0);
        setFilters({ error_type: '', code: '', champsid: '' });
        toast({ title: "No data loaded", description: "No valid data rows found in the CSV. This can happen if all data rows were empty or had parsing issues (e.g., column count mismatch for all rows). Please check individual row warnings.", variant: "default" });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv") {
        toast({ title: "Invalid file type", description: "Please upload a .csv file.", variant: "destructive" });
        event.target.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          parseCSVAndSetCases(text);
        } else {
          toast({ title: "Error reading file", description: "Could not read file content.", variant: "destructive" });
        }
        event.target.value = ""; 
      };
      reader.onerror = () => {
        toast({ title: "Error reading file", description: "An error occurred while trying to read the file.", variant: "destructive" });
        event.target.value = ""; 
      };
      reader.readAsText(file);
    }
  };

  const currentCase = filteredCases[currentCaseIndex] || null;

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="font-headline text-xl font-semibold group-data-[collapsible=icon]:hidden">LLM Reviewer</h1>
            </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-4 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  Upload Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label htmlFor="csv_upload">Upload CSV File</Label>
                  <Input
                    id="csv_upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-1 file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Headers (case-insensitive, trimmed): champsid, text, groundtruth_code_list, llm_predicted_code, llmanswer, error_type. Fields can contain newlines if properly quoted.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Separator />
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-primary" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="error_type_filter">Error Type</Label>
                  <Select 
                    value={filters.error_type || ALL_FILTER_VALUE} 
                    onValueChange={value => handleFilterChange('error_type', value)}
                    disabled={allCases.length === 0}
                  >
                    <SelectTrigger id="error_type_filter">
                      <SelectValue placeholder="All Error Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All Error Types</SelectItem>
                      {uniqueErrorTypes.map(et => <SelectItem key={et} value={et}>{et}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="code_filter">LLM Predicted Code</Label>
                  <Select 
                    value={filters.code || ALL_FILTER_VALUE} 
                    onValueChange={value => handleFilterChange('code', value)}
                    disabled={allCases.length === 0}
                  >
                    <SelectTrigger id="code_filter">
                      <SelectValue placeholder="All Codes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All Codes</SelectItem>
                      {uniqueCodes.map((code, i) => (
                        <SelectItem key={`${code}-${i}`} value={code || `_EMPTY_CODE_${i}`}>
                          <span className="font-code truncate block max-w-xs">
                            {code ? (code.split('\n')[0] + (code.includes('\n') || code.length > 30 ? '...' : '')) : '(Empty Code)'}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="champsid_filter">Case ID</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="champsid_filter"
                      type="text" 
                      placeholder="Search by Case ID..." 
                      value={filters.champsid}
                      onChange={e => handleFilterChange('champsid', e.target.value)}
                      className="pl-8"
                      disabled={allCases.length === 0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Case Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                  <Label htmlFor="case_selector">Go to Case</Label>
                  <Select 
                    value={currentCase?.internalId || ""} 
                    onValueChange={handleSelectCase} 
                    disabled={filteredCases.length === 0}
                  >
                    <SelectTrigger id="case_selector" >
                      <SelectValue placeholder="Select a case ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCases.map(c => (
                        <SelectItem key={c.internalId} value={c.internalId}>{c.champsid} {c.internalId.startsWith('csv-') ? `(CSV Row ${c.internalId.split('-')[1]})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <Button onClick={() => handleNavigate('prev')} disabled={currentCaseIndex <= 0 || filteredCases.length === 0} variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {filteredCases.length > 0 ? `${currentCaseIndex + 1} of ${filteredCases.length}` : '0 of 0'}
                  </span>
                  <Button onClick={() => handleNavigate('next')} disabled={currentCaseIndex >= filteredCases.length - 1 || filteredCases.length === 0} variant="outline" size="sm">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">Total Cases: {allCases.length}</p>
          <p className="text-xs text-muted-foreground">Filtered: {filteredCases.length}</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="h-screen"> 
          <ErrorCaseDisplay errorCase={currentCase} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
    

    


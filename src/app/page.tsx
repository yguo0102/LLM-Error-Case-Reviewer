
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


export default function HomePage() {
  const [allCases, setAllCases] = useState<ErrorCase[]>(mockErrorCases);
  const [filteredCases, setFilteredCases] = useState<ErrorCase[]>(allCases);
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>({ error_type: '', code: '', champsid: '' });
  const { toast } = useToast();

  const uniqueErrorTypes = useMemo(() => Array.from(new Set(allCases.map(c => c.error_type))), [allCases]);
  const uniqueCodes = useMemo(() => Array.from(new Set(allCases.map(c => c.code))), [allCases]);

  useEffect(() => {
    let cases = allCases;
    if (filters.error_type) {
      cases = cases.filter(c => c.error_type === filters.error_type);
    }
    if (filters.code) {
      cases = cases.filter(c => c.code === filters.code);
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
  
  const handleSelectCase = (champsid: string) => {
    const index = filteredCases.findIndex(c => c.champsid === champsid);
    if (index !== -1) {
      setCurrentCaseIndex(index);
    }
  };

  const parseCSVAndSetCases = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      toast({ title: "Error parsing CSV", description: "CSV file must have a header and at least one data row.", variant: "destructive" });
      return;
    }

    const headers = csvLineToArray(lines[0]).map(h => h.toLowerCase());
    const requiredHeaders = ['champsid', 'text', 'code', 'code_description', 'diagnosis', 'error_type', 'llmanswer', 'evidence'];
    const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh.toLowerCase()));
    
    if (missingHeaders.length > 0) {
      toast({ title: "Error parsing CSV", description: `Missing required headers: ${missingHeaders.join(', ')}. Note: 'llmAnswer' in type is 'llmanswer' in CSV header.`, variant: "destructive" });
      return;
    }

    const newCases: ErrorCase[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = csvLineToArray(line);

      if (values.length !== headers.length) {
        toast({ title: "Warning parsing CSV", description: `Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`, variant: "default" });
        continue;
      }

      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      
      let evidenceArray: string[] = [];
      const evidenceRaw = entry.evidence || "";
      if (evidenceRaw && evidenceRaw.trim() !== "") {
          try {
              const parsed = JSON.parse(evidenceRaw);
              if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                  evidenceArray = parsed;
              } else {
                  console.warn(`Evidence for ${entry.champsid} is not a valid JSON array of strings. Found:`, evidenceRaw);
                  toast({ title: "Warning parsing CSV", description: `Evidence for ${entry.champsid || `Row ${i+1}`} is not a valid JSON array. Using empty array.`, variant: "default" });
              }
          } catch (jsonError) {
              console.warn(`Failed to parse evidence as JSON for ${entry.champsid}:`, evidenceRaw, jsonError);
              toast({ title: "Warning parsing CSV", description: `Malformed JSON in 'evidence' for ${entry.champsid || `Row ${i+1}`}. Using empty array.`, variant: "default" });
          }
      }

      const errorCase: ErrorCase = {
        champsid: entry.champsid || `GEN_ID_${Date.now()}_${i}`,
        text: entry.text || "",
        code: entry.code || "",
        code_description: entry.code_description || "",
        diagnosis: entry.diagnosis || "",
        error_type: entry.error_type || "",
        llmAnswer: entry.llmanswer || "", // CSV header is 'llmanswer'
        evidence: evidenceArray,
      };

      if (!errorCase.champsid) {
          toast({ title: "Warning parsing CSV", description: `Row ${i+1} is missing champsid. Skipping.`, variant: "default" });
          continue;
      }
      newCases.push(errorCase);
    }

    if (newCases.length > 0) {
      setAllCases(newCases);
      setCurrentCaseIndex(0);
      setFilters({ error_type: '', code: '', champsid: '' });
      toast({ title: "CSV data loaded successfully!", description: `${newCases.length} cases loaded.` });
    } else if (lines.length > 1) {
        toast({ title: "No data loaded", description: "No valid data rows found in the CSV.", variant: "default" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv") {
        toast({ title: "Invalid file type", description: "Please upload a .csv file.", variant: "destructive" });
        event.target.value = ""; // Reset file input
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
        event.target.value = ""; // Reset file input after processing
      };
      reader.onerror = () => {
        toast({ title: "Error reading file", description: "An error occurred while trying to read the file.", variant: "destructive" });
        event.target.value = ""; // Reset file input
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
                    Headers (case-insensitive): champsid, text, code, code_description, diagnosis, error_type, llmanswer, evidence.
                    'evidence' column must be a JSON string array (e.g., `["item1", "item2"]`).
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
                  <Label htmlFor="code_filter">Code Snippet</Label>
                  <Select 
                    value={filters.code || ALL_FILTER_VALUE} 
                    onValueChange={value => handleFilterChange('code', value)}
                  >
                    <SelectTrigger id="code_filter">
                      <SelectValue placeholder="All Codes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All Codes</SelectItem>
                      {uniqueCodes.map((code, i) => (
                        <SelectItem key={i} value={code}>
                          <span className="font-code truncate block max-w-xs">{code.split('\n')[0]}...</span>
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
                  <Select value={currentCase?.champsid || ""} onValueChange={handleSelectCase} disabled={filteredCases.length === 0}>
                    <SelectTrigger id="case_selector" >
                      <SelectValue placeholder="Select a case ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCases.map(c => (
                        <SelectItem key={c.champsid} value={c.champsid}>{c.champsid}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <Button onClick={() => handleNavigate('prev')} disabled={currentCaseIndex <= 0} variant="outline" size="sm">
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
        <div className="h-screen"> {/* Ensure SidebarInset's child takes full height */}
          <ErrorCaseDisplay errorCase={currentCase} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


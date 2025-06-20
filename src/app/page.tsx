
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
import { ListFilter, ChevronLeft, ChevronRight, Search, FileText, SlidersHorizontal, FileUp, Code2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const ALL_FILTER_VALUE = "__ALL_OPTIONS__";

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

  useEffect(() => {
    let cases = allCases;
    if (filters.error_type && filters.error_type !== ALL_FILTER_VALUE) {
      cases = cases.filter(c => c.error_type === filters.error_type);
    }
    if (filters.code) { // Search by LLM predicted code
      cases = cases.filter(c => c.llm_predicted_code.toLowerCase().includes(filters.code.toLowerCase()));
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

  const parseExcelDataAndSetCases = (jsonData: any[][]) => {
    if (!jsonData || jsonData.length < 1) {
      toast({ title: "Error parsing Excel", description: "Excel file is empty or contains no data.", variant: "destructive" });
      setAllCases([]);
      return;
    }

    const headerRow = jsonData[0];
    if (!headerRow || headerRow.length === 0) {
        toast({ title: "Error parsing Excel", description: "Excel file is missing a header row.", variant: "destructive" });
        setAllCases([]);
        return;
    }
    
    const parsedHeaders = headerRow.map(h => String(h !== undefined ? h : "").toLowerCase().trim());
    const requiredHeaders = ['champsid', 'text', 'groundtruth_code_list', 'llm_predicted_code', 'llmanswer', 'error_type'];
    const missingHeaders = requiredHeaders.filter(rh => !parsedHeaders.includes(rh));
    
    if (missingHeaders.length > 0) {
      toast({ 
        title: "Error parsing Excel Headers", 
        description: `Missing required headers: ${missingHeaders.join(', ')}. Found headers in your file: ${parsedHeaders.join(', ')}. Ensure headers are correct and try again. Case-insensitive and trimmed.`, 
        variant: "destructive" 
      });
      setAllCases([]);
      return;
    }

    const newCases: ErrorCase[] = [];
    const dataRows = jsonData.slice(1);

    dataRows.forEach((row, rowIndex) => {
        if (!row || row.every(cell => cell === undefined || String(cell).trim() === "")) {
            return;
        }

        if (row.length !== parsedHeaders.length && row.length > 0) {
            const rowSnippet = row.slice(0, 5).map(c => String(c !== undefined ? c : "").substring(0,10)).join(', ') + (row.length > 5 || row.some(c => String(c).length > 10) ? '...' : '');
            toast({ 
            title: "Warning parsing Excel row", 
            description: `Row ${rowIndex + 2} (starts with: "${rowSnippet}") has ${row.length} columns, expected ${parsedHeaders.length}. Skipping this row.`, 
            variant: "destructive" 
            });
            return;
        }
        
        const entry: any = {};
        parsedHeaders.forEach((header, index) => {
            entry[header] = String(row[index] !== undefined ? row[index] : ""); 
        });
        
        const errorCase: ErrorCase = {
            internalId: `excel-${rowIndex + 2}-${Date.now()}-${entry.champsid || 'no_id'}`, 
            champsid: entry.champsid || `GEN_ID_${Date.now()}_${rowIndex + 2}`,
            text: entry.text || "",
            groundtruth_code_list: entry.groundtruth_code_list || "",
            llm_predicted_code: entry.llm_predicted_code || "",
            error_type: entry.error_type || "",
            llmAnswer: entry.llmanswer || "", 
        };
        newCases.push(errorCase);
    });

    if (newCases.length > 0) {
      setAllCases(newCases);
      setCurrentCaseIndex(0);
      setFilters({ error_type: '', code: '', champsid: '' }); 
      toast({ title: "Excel data loaded successfully!", description: `${newCases.length} cases loaded.` });
    } else { 
      setAllCases([]); 
      setCurrentCaseIndex(0);
      setFilters({ error_type: '', code: '', champsid: '' });
      if (jsonData.length > 1) { 
        toast({ title: "No data loaded", description: "No valid data rows found in the Excel file. This can happen if all data rows were empty or had parsing issues (e.g., column count mismatch for all rows). Please check individual row warnings.", variant: "default" });
      } else { 
         toast({ title: "No data loaded", description: "Excel file contained no data rows.", variant: "default" });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
      if (!validTypes.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please upload an .xlsx or .xls file.", variant: "destructive" });
        event.target.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            toast({ title: "Error reading Excel", description: "No sheets found in the Excel file.", variant: "destructive" });
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
          parseExcelDataAndSetCases(jsonData);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          toast({ title: "Error processing Excel file", description: "Could not process the file. Ensure it is a valid Excel file.", variant: "destructive" });
        }
        event.target.value = ""; 
      };
      reader.onerror = () => {
        toast({ title: "Error reading file", description: "An error occurred while trying to read the file.", variant: "destructive" });
        event.target.value = ""; 
      };
      reader.readAsArrayBuffer(file);
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
                  <Label htmlFor="excel_upload">Upload Excel File</Label>
                  <Input
                    id="excel_upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="mt-1 file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    First sheet used. Headers (case-insensitive, trimmed): champsid, text, groundtruth_code_list, llm_predicted_code, llmanswer, error_type.
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
                  <Label htmlFor="code_filter">Search LLM Predicted Code</Label>
                  <div className="relative">
                    <Code2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="code_filter"
                      type="text" 
                      placeholder="Search in predicted code..." 
                      value={filters.code}
                      onChange={e => handleFilterChange('code', e.target.value)}
                      className="pl-8"
                      disabled={allCases.length === 0}
                    />
                  </div>
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
                        <SelectItem key={c.internalId} value={c.internalId}>{c.champsid} {c.internalId.startsWith('excel-') ? `(Excel Row ${c.internalId.split('-')[1]})` : (c.internalId.startsWith('mock-') ? `(Mock ${c.internalId.split('-')[1]})` : '')}</SelectItem>
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


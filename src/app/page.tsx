
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
import { Filter, ListFilter, ChevronLeft, ChevronRight, Search, FileText, SlidersHorizontal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ALL_FILTER_VALUE = "__ALL_OPTIONS__";

export default function HomePage() {
  const [allCases] = useState<ErrorCase[]>(mockErrorCases);
  const [filteredCases, setFilteredCases] = useState<ErrorCase[]>(allCases);
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>({ error_type: '', code: '', champsid: '' });

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
                  <Select value={currentCase?.champsid || ""} onValueChange={handleSelectCase}>
                    <SelectTrigger id="case_selector" disabled={filteredCases.length === 0}>
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

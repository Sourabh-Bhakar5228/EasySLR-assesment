'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown,
  BookOpen, 
  Check, 
  AlertCircle,
  FileText,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Download,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleStatus, Priority } from '@prisma/client';
import { Modal } from '@/components/ui/modal';

// Import Server Actions
import { 
  updateArticleStatus, 
  updateArticlePriority, 
  updateArticleNotes,
  bulkUpdateArticleStatus,
  bulkDeleteArticles,
  exportArticlesCSV
} from '@/actions/articles';

interface Article {
  id: string;
  pmid: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  publicationYear: number | null;
  doi: string | null;
  status: ArticleStatus;
  priority: Priority;
  notes: string | null;
  createdAt: Date;
  projectId: string;
  project: {
    name: string;
    members?: { role: string }[];
  };
}

interface SavedFilter {
  id: string;
  name: string;
  search: string;
  status: string;
  priority: string;
  projectId: string;
  year: string;
}

interface ReviewTableProps {
  initialArticles: Article[];
  totalCount: number;
  userProjects: { id: string; name: string }[];
  years: number[];
  currentFilters: {
    page: number;
    search: string;
    status: string;
    priority: string;
    projectId: string;
    year: string;
    sortBy: string;
    sortOrder: string;
  };
}

type SortField = 'title' | 'year' | 'createdAt';

export default function ReviewTable({ 
  initialArticles, 
  totalCount, 
  userProjects, 
  years, 
  currentFilters 
}: ReviewTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Client-side state for optimistic updates
  const [articles, setArticles] = React.useState<Article[]>(initialArticles);
  
  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Search input local state (to avoid lag on typing)
  const [searchQuery, setSearchQuery] = React.useState<string>(currentFilters.search);

  // Saved Filters state
  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>([]);
  const [newFilterName, setNewFilterName] = React.useState<string>('');
  const [showSaveViewModal, setShowSaveViewModal] = React.useState<boolean>(false);

  // Notes Modal state
  const [editingNotesArticle, setEditingNotesArticle] = React.useState<Article | null>(null);
  const [notesDraft, setNotesDraft] = React.useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = React.useState<boolean>(false);

  // Export CSV state
  const [isExporting, setIsExporting] = React.useState<boolean>(false);

  // Bulk actions triggers state
  const [isBulkUpdating, setIsBulkUpdating] = React.useState<boolean>(false);

  // Page constants
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = currentFilters.page;

  // Sync state when page results change
  React.useEffect(() => {
    setArticles(initialArticles);
    // Retain only selected IDs that are present on the current screen (or persist across pages)
    // Persisting across pages is better, so we don't clear selectedIds here.
  }, [initialArticles]);

  // Load Saved Filters from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('easyslr_saved_filters');
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

  // General URL parameter router state sync
  const updateQueryParams = React.useCallback((newParams: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams();
    
    // Merge parameters with current active filters
    const merged = {
      page: currentFilters.page,
      search: currentFilters.search,
      status: currentFilters.status,
      priority: currentFilters.priority,
      projectId: currentFilters.projectId,
      year: currentFilters.year,
      sortBy: currentFilters.sortBy,
      sortOrder: currentFilters.sortOrder,
      ...newParams
    };

    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
        params.set(key, String(value));
      }
    });

    startTransition(() => {
      router.push(`/dashboard/articles?${params.toString()}`);
    });
  }, [currentFilters, router]);

  // Debounced search query sync
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== currentFilters.search) {
        updateQueryParams({ search: searchQuery, page: 1 });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, currentFilters.search, updateQueryParams]);

  // Sync local search query state with currentFilters search prop
  React.useEffect(() => {
    setSearchQuery(currentFilters.search);
  }, [currentFilters.search]);

  // Handle row selection
  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = (currentPageArticles: Article[]) => {
    const allSelectedOnPage = currentPageArticles.every(a => selectedIds.has(a.id));
    const newSet = new Set(selectedIds);
    
    currentPageArticles.forEach(a => {
      if (allSelectedOnPage) {
        newSet.delete(a.id);
      } else {
        newSet.add(a.id);
      }
    });
    
    setSelectedIds(newSet);
  };

  // Status transition triggers (optimistic update, then database action)
  const handleStatusChange = async (articleId: string, status: ArticleStatus) => {
    const previousArticles = [...articles];
    // Optimistic state change
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, status } : a));

    const toastId = toast.loading(`Transitioning status to ${status}...`);
    try {
      const res = await updateArticleStatus(articleId, status);
      if (res.success) {
        toast.success(`Article status updated to ${status}`, { id: toastId });
      }
    } catch (err: any) {
      // Revert state on error
      setArticles(previousArticles);
      toast.error(err.message || 'Failed to update status', { id: toastId });
    }
  };

  // Priority transition triggers (optimistic update, then database action)
  const handlePriorityChange = async (articleId: string, priority: Priority) => {
    const previousArticles = [...articles];
    // Optimistic state change
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, priority } : a));

    const toastId = toast.loading(`Changing priority to ${priority}...`);
    try {
      const res = await updateArticlePriority(articleId, priority);
      if (res.success) {
        toast.success(`Priority updated to ${priority}`, { id: toastId });
      }
    } catch (err: any) {
      // Revert state on error
      setArticles(previousArticles);
      toast.error(err.message || 'Failed to update priority', { id: toastId });
    }
  };

  // Notes Modal editing
  const openNotesModal = (article: Article) => {
    setEditingNotesArticle(article);
    setNotesDraft(article.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!editingNotesArticle) return;
    setIsSavingNotes(true);
    const toastId = toast.loading('Saving reviewer notes...');
    try {
      const res = await updateArticleNotes(editingNotesArticle.id, notesDraft);
      if (res.success) {
        setArticles(prev => prev.map(a => a.id === editingNotesArticle.id ? { ...a, notes: notesDraft || null } : a));
        toast.success('Notes saved successfully', { id: toastId });
        setEditingNotesArticle(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes', { id: toastId });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Bulk Status Update Trigger
  const handleBulkStatusUpdate = async (status: ArticleStatus) => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    const toastId = toast.loading(`Bulk updating ${selectedIds.size} articles to ${status}...`);

    try {
      // Group selected IDs by projectId to respect authorization scoping
      const grouped = new Map<string, string[]>();
      articles.forEach(a => {
        if (selectedIds.has(a.id)) {
          const list = grouped.get(a.projectId) || [];
          list.push(a.id);
          grouped.set(a.projectId, list);
        }
      });

      // Execute bulk status changes per project group
      let successCount = 0;
      for (const [projectId, ids] of grouped.entries()) {
        const res = await bulkUpdateArticleStatus(ids, status, projectId);
        if (res.success) {
          successCount += res.count;
        }
      }

      // Update local state optimistically
      setArticles(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status } : a));
      setSelectedIds(new Set());
      toast.success(`Successfully updated ${successCount} articles to ${status}!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Bulk status update failed.', { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Bulk Delete Trigger
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} articles permanently? This cannot be undone.`)) return;
    
    setIsBulkUpdating(true);
    const toastId = toast.loading(`Deleting ${selectedIds.size} articles...`);

    try {
      // Group selected IDs by projectId
      const grouped = new Map<string, string[]>();
      articles.forEach(a => {
        if (selectedIds.has(a.id)) {
          const list = grouped.get(a.projectId) || [];
          list.push(a.id);
          grouped.set(a.projectId, list);
        }
      });

      // Execute bulk deletes per project group
      let successCount = 0;
      for (const [projectId, ids] of grouped.entries()) {
        const res = await bulkDeleteArticles(ids, projectId);
        if (res.success) {
          successCount += res.count;
        }
      }

      // Update local state optimistically and reload page data
      setArticles(prev => prev.filter(a => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast.success(`Successfully deleted ${successCount} articles.`, { id: toastId });
      updateQueryParams({ page: 1 }); // refresh
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Bulk delete failed.', { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    updateQueryParams({
      page: 1,
      search: '',
      status: 'ALL',
      priority: 'ALL',
      projectId: 'ALL',
      year: 'ALL',
    });
  };

  // Handle CSV Export
  const handleExportCSV = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating CSV file...');
    try {
      const activeIds = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      const res = await exportArticlesCSV({
        articleIds: activeIds,
        search: currentFilters.search,
        status: currentFilters.status,
        priority: currentFilters.priority,
        projectId: currentFilters.projectId,
        year: currentFilters.year,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
      });

      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const fileName = activeIds 
          ? `selected_articles_${new Date().toISOString().slice(0, 10)}.csv`
          : `filtered_articles_${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV downloaded successfully!', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to export CSV.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Save current view filter
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast.error('Please enter a name for the filter view.');
      return;
    }

    const newFilter: SavedFilter = {
      id: Math.random().toString(36).substring(2, 9),
      name: newFilterName.trim(),
      search: searchQuery,
      status: currentFilters.status,
      priority: currentFilters.priority,
      projectId: currentFilters.projectId,
      year: currentFilters.year,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('easyslr_saved_filters', JSON.stringify(updated));
    setNewFilterName('');
    setShowSaveViewModal(false);
    toast.success(`Filter view "${newFilter.name}" saved!`);
  };

  // Apply saved view
  const handleApplyFilter = (filter: SavedFilter) => {
    setSearchQuery(filter.search);
    updateQueryParams({
      page: 1,
      search: filter.search,
      status: filter.status,
      priority: filter.priority,
      projectId: filter.projectId,
      year: filter.year,
    });
    toast.success(`Applied view: ${filter.name}`);
  };

  // Delete saved view
  const handleDeleteFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('easyslr_saved_filters', JSON.stringify(updated));
    toast.success('Saved view deleted.');
  };

  // Sorting
  const handleSort = (field: SortField) => {
    const isCurrentField = currentFilters.sortBy === field;
    const newOrder = isCurrentField && currentFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateQueryParams({
      sortBy: field,
      sortOrder: newOrder,
      page: 1,
    });
  };

  const renderSortArrow = (field: SortField) => {
    if (currentFilters.sortBy !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-500" />;
    }
    return currentFilters.sortOrder === 'asc'
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 text-primary-500 font-bold" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 text-primary-500 font-bold" />;
  };

  // Authorization checks for selected rows
  const canBulkStatusUpdate = React.useMemo(() => {
    if (selectedIds.size === 0) return false;
    for (const article of articles) {
      if (selectedIds.has(article.id)) {
        const role = article.project.members?.[0]?.role;
        if (!role) return false;
      }
    }
    return true;
  }, [selectedIds, articles]);

  const canBulkDelete = React.useMemo(() => {
    if (selectedIds.size === 0) return false;
    for (const article of articles) {
      if (selectedIds.has(article.id)) {
        const role = article.project.members?.[0]?.role;
        if (role !== 'OWNER') return false;
      }
    }
    return true;
  }, [selectedIds, articles]);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Title, Author, PMID, DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
              />
            </div>

            {/* Project Filter */}
            <div>
              <select
                value={currentFilters.projectId}
                onChange={(e) => updateQueryParams({ projectId: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">All Projects</option>
                {userProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={currentFilters.status}
                onChange={(e) => updateQueryParams({ status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value={ArticleStatus.PENDING}>Pending</option>
                <option value={ArticleStatus.INCLUDED}>Included</option>
                <option value={ArticleStatus.EXCLUDED}>Excluded</option>
                <option value={ArticleStatus.MAYBE}>Maybe</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={currentFilters.priority}
                onChange={(e) => updateQueryParams({ priority: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">All Priorities</option>
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={currentFilters.year}
                onChange={(e) => updateQueryParams({ year: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
              >
                <option value="ALL">All Years</option>
                {years.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filter Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Saved Views:
              </span>
              
              {savedFilters.length > 0 ? (
                <select
                  onChange={(e) => {
                    const filter = savedFilters.find(f => f.id === e.target.value);
                    if (filter) handleApplyFilter(filter);
                  }}
                  value=""
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
                >
                  <option value="" disabled>-- Apply View --</option>
                  {savedFilters.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-400 italic">No saved views</span>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 h-7 gap-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/20"
                onClick={() => setShowSaveViewModal(true)}
              >
                <Plus className="h-3.5 w-3.5 text-primary-500" />
                Save Current View
              </Button>

              {/* Badges list */}
              {savedFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                  {savedFilters.map(f => (
                    <span 
                      key={f.id} 
                      onClick={() => handleApplyFilter(f)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer hover:bg-primary-50 hover:text-primary-750 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFilter(f.id, e)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Export CSV Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="text-xs px-3 h-8 gap-1.5 border-emerald-250 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-colors font-semibold"
                onClick={handleExportCSV}
              >
                <Download className="h-3.5 w-3.5 text-emerald-500" />
                {selectedIds.size > 0 ? `Export CSV (${selectedIds.size})` : 'Export CSV'}
              </Button>

              {/* Clear Filters Button */}
              {(currentFilters.search || currentFilters.status !== 'ALL' || currentFilters.priority !== 'ALL' || currentFilters.projectId !== 'ALL' || currentFilters.year !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:hover:text-white px-2.5 h-8 font-semibold"
                  onClick={handleResetFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel */}
      {selectedIds.size > 0 && (
        <Card className="border-primary-100 bg-primary-50/20 dark:border-primary-950/40 dark:bg-primary-950/5 border shadow-sm animate-slide-up">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-5.5 w-5.5 rounded bg-primary-500 text-white flex items-center justify-center font-bold text-xs">
                {selectedIds.size}
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Articles Selected
              </span>
            </div>

            {canBulkStatusUpdate ? (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">Bulk:</span>
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
                    onClick={() => handleBulkStatusUpdate(ArticleStatus.PENDING)}
                    disabled={isBulkUpdating}
                  >
                    Pending
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50"
                    onClick={() => handleBulkStatusUpdate(ArticleStatus.INCLUDED)}
                    disabled={isBulkUpdating}
                  >
                    Include
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-100/50"
                    onClick={() => handleBulkStatusUpdate(ArticleStatus.EXCLUDED)}
                    disabled={isBulkUpdating}
                  >
                    Exclude
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
                    onClick={() => handleBulkStatusUpdate(ArticleStatus.MAYBE)}
                    disabled={isBulkUpdating}
                  >
                    Maybe
                  </Button>
                </div>
                
                {canBulkDelete && (
                  <Button
                    size="sm"
                    disabled={isBulkUpdating}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 shadow-sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic border-l border-slate-200 dark:border-slate-800 pl-4 py-1.5">
                Bulk status updates require project membership for all selected articles.
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Articles Listing Table */}
      <Card className="border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40 overflow-hidden shadow-sm relative">
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] z-20 flex items-center justify-center transition-all duration-200">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-md dark:border-slate-850 dark:bg-slate-900">
              <div className="inline-block border-2 border-primary-500 border-t-transparent animate-spin rounded-full h-4 w-4" />
              <span className="text-xs font-semibold text-slate-500">Querying Postgres...</span>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {articles.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
              <CardTitle className="text-sm font-semibold">No Articles Found</CardTitle>
              <CardDescription className="text-xs max-w-xs mx-auto">
                No articles match your current search queries or filter selections. Try clearing your filters.
              </CardDescription>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-950/25">
                  <TableRow>
                    {/* Checkbox Column */}
                    <TableHead className="w-[48px]">
                      <input
                        type="checkbox"
                        checked={articles.length > 0 && articles.every(a => selectedIds.has(a.id))}
                        onChange={() => handleSelectAll(articles)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">PMID</TableHead>
                    {/* Sortable headers */}
                    <TableHead className="min-w-[280px]">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center group font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      >
                        Title {renderSortArrow('title')}
                      </button>
                    </TableHead>
                    <TableHead>Authors</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead className="w-[100px]">
                      <button
                        onClick={() => handleSort('year')}
                        className="flex items-center group font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      >
                        Year {renderSortArrow('year')}
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[110px]">Priority</TableHead>
                    <TableHead className="w-[90px]">Notes</TableHead>
                    <TableHead className="w-[130px]">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center group font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      >
                        Imported {renderSortArrow('createdAt')}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((art) => {
                    const userRole = art.project.members?.[0]?.role;
                    const canEdit = !!userRole;

                    return (
                      <TableRow 
                        key={art.id} 
                        className={`${selectedIds.has(art.id) ? 'bg-primary-500/5 dark:bg-primary-500/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(art.id)}
                            onChange={() => handleSelectRow(art.id)}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                          />
                        </TableCell>

                        {/* PMID */}
                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {art.pmid || 'N/A'}
                        </TableCell>

                        {/* Title & Project name subtag */}
                        <TableCell className="max-w-[400px]">
                          <div className="space-y-1.5">
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block leading-snug">
                              {art.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350">
                                {art.project.name}
                              </span>
                              {art.doi && (
                                <a 
                                  href={`https://doi.org/${art.doi}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary-550 dark:text-primary-400 hover:underline font-mono"
                                >
                                  doi:{art.doi}
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Authors */}
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={art.authors || ''}>
                          {art.authors || 'N/A'}
                        </TableCell>

                        {/* Journal */}
                        <TableCell className="text-xs text-slate-650 dark:text-slate-400 max-w-[150px] truncate" title={art.journal || ''}>
                          {art.journal || 'N/A'}
                        </TableCell>

                        {/* Year */}
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {art.publicationYear || 'N/A'}
                        </TableCell>

                        {/* Status (Select Dropdown) */}
                        <TableCell>
                          {canEdit ? (
                            <select
                              value={art.status}
                              onChange={(e) => handleStatusChange(art.id, e.target.value as ArticleStatus)}
                              className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary-500 outline-none select-clean transition-colors ${
                                art.status === ArticleStatus.INCLUDED 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                                  : art.status === ArticleStatus.EXCLUDED
                                  ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                  : art.status === ArticleStatus.MAYBE
                                  ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                                  : 'bg-slate-50 text-slate-700 border-slate-250 dark:bg-slate-900/40 dark:text-slate-350 dark:border-slate-800'
                              }`}
                            >
                              <option value={ArticleStatus.PENDING}>Pending</option>
                              <option value={ArticleStatus.INCLUDED}>Included</option>
                              <option value={ArticleStatus.EXCLUDED}>Excluded</option>
                              <option value={ArticleStatus.MAYBE}>Maybe</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                              art.status === ArticleStatus.INCLUDED 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400' 
                                : art.status === ArticleStatus.EXCLUDED
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-400'
                                : art.status === ArticleStatus.MAYBE
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400'
                                : 'bg-slate-50 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400'
                            }`}>
                              {art.status}
                            </span>
                          )}
                        </TableCell>

                        {/* Priority (Select Dropdown) */}
                        <TableCell>
                          {canEdit ? (
                            <select
                              value={art.priority}
                              onChange={(e) => handlePriorityChange(art.id, e.target.value as Priority)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary-500 outline-none select-clean transition-colors ${
                                art.priority === Priority.HIGH 
                                  ? 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'
                                  : art.priority === Priority.MEDIUM
                                  ? 'bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50'
                                  : 'bg-slate-50 text-slate-705 border-slate-250 dark:bg-slate-900/40 dark:text-slate-350 dark:border-slate-800'
                              }`}
                            >
                              <option value={Priority.LOW}>Low</option>
                              <option value={Priority.MEDIUM}>Medium</option>
                              <option value={Priority.HIGH}>High</option>
                            </select>
                          ) : (
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {art.priority}
                            </span>
                          )}
                        </TableCell>

                        {/* Reviewer Notes (Modal trigger button) */}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs flex items-center gap-1 ${
                              art.notes 
                                ? 'text-primary-650 bg-primary-50 dark:text-primary-400 dark:bg-primary-950/20 font-semibold' 
                                : 'text-slate-450 dark:text-slate-500'
                            }`}
                            onClick={() => openNotesModal(art)}
                          >
                            <Edit2 className="h-3 w-3" />
                            {art.notes ? 'Notes' : 'Add'}
                          </Button>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-slate-450 dark:text-slate-500">
                          {new Date(art.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => updateQueryParams({ page: Math.max(currentPage - 1, 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => updateQueryParams({ page: Math.min(currentPage + 1, totalPages) })}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-450">
                Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                <span className="font-semibold">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md border-slate-200 dark:border-slate-800"
                  disabled={currentPage === 1}
                  onClick={() => updateQueryParams({ page: Math.max(currentPage - 1, 1) })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {(() => {
                  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage > 3) {
                      pages.push('ellipsis-start');
                    }
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (currentPage < totalPages - 2) {
                      pages.push('ellipsis-end');
                    }
                    pages.push(totalPages);
                  }

                  return pages.map((pg, idx) => {
                    if (pg === 'ellipsis-start' || pg === 'ellipsis-end') {
                      return (
                        <span
                          key={pg}
                          className="relative inline-flex items-center px-3 py-1.5 border border-slate-200 bg-white text-xs text-slate-400 dark:bg-slate-950 dark:border-slate-800"
                        >
                          …
                        </span>
                      );
                    }
                    const isCurrent = currentPage === pg;
                    return (
                      <button
                        key={pg}
                        onClick={() => updateQueryParams({ page: pg })}
                        className={`relative inline-flex items-center px-3.5 py-1.5 border text-xs font-semibold ${
                          isCurrent
                            ? 'z-10 bg-primary-500 border-primary-500 text-white'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  });
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md border-slate-200 dark:border-slate-800"
                  disabled={currentPage === totalPages}
                  onClick={() => updateQueryParams({ page: Math.min(currentPage + 1, totalPages) })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Save View Modal */}
      <Modal
        isOpen={showSaveViewModal}
        onClose={() => setShowSaveViewModal(false)}
        title="Save Current Filter View"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Save the current search query and active filter criteria to quickly load them later.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              View Name
            </label>
            <input
              type="text"
              placeholder="e.g. Heart Disease Pending"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-white text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/85">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSaveViewModal(false)}>
              Cancel
            </Button>
            <Button size="sm" className="font-semibold" onClick={handleSaveFilter}>
              Save View
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reusable modal for Reviewer Notes */}
      {editingNotesArticle && (
        <Modal
          isOpen={!!editingNotesArticle}
          onClose={() => setEditingNotesArticle(null)}
          title="Reviewer Notes"
        >
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                {editingNotesArticle.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                PMID: {editingNotesArticle.pmid || 'N/A'} | Authors: {editingNotesArticle.authors || 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Notes & Comments
              </label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Write reasons to include, exclude, labels, study design, or other notes..."
                rows={5}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-3 text-xs flex gap-2 text-slate-500">
              <Info className="h-4.5 w-4.5 text-primary-500 shrink-0 mt-0.5" />
              <span>
                These notes help track systematic exclusions, quality assessments, and bias screening during synthesis.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                disabled={isSavingNotes}
                onClick={() => setEditingNotesArticle(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="font-semibold"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { createClient } from '@/lib/supabase/client';
import {
  DataGrid,
  DataGridPagination,
  DataGridTable,
  DataGridContainer,
  DataGridColumnVisibility,
} from '@/components/ui/data-grid';
import { columns, AgentRequest } from './columns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ClientRequestsPage() {
  const router = useRouter();
  const [data, setData] = React.useState<AgentRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const supabase = createClient();

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: requests, error } = await supabase
          .from('agent_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching requests:', error);
        } else {
          setData(requests as any[] || []);
        }
      } catch (error) {
        console.error('Error in requests fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Requests</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 gap-2">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <div className="flex items-center gap-2 ml-auto">
          <DataGridColumnVisibility table={table} trigger={
            <Button variant="outline" size="sm" className="hidden h-8 lg:flex">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          } />
        </div>
      </div>

      <DataGridContainer>
        <DataGrid table={table} recordCount={data.length} isLoading={loading}>
          <DataGridTable />
          <DataGridPagination />
        </DataGrid>
      </DataGridContainer>
    </div>
  );
}

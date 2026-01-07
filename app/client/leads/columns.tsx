'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGridColumnHeader } from '@/components/ui/data-grid';

// Define the shape of our data based on the database schema
export type Lead = {
    id: string;
    agent_id: string;
    customer_phone: string | null;
    call_summary: string | null;
    call_transcript: string | null;
    recording_url: string | null;
    sentiment: string | null;
    status: 'New' | 'Contacted' | 'Closed';
    duration: number | null;
    created_at: string;
};

export const columns: ColumnDef<Lead>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        accessorKey: 'customer_phone',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Phone Number" />
        ),
        cell: ({ row }) => {
            const phone = row.getValue('customer_phone') as string;
            return <div className="font-medium">{phone || 'N/A'}</div>;
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
                <Badge
                    variant={
                        status === 'New'
                            ? 'default'
                            : status === 'Contacted'
                                ? 'secondary'
                                : 'outline'
                    }
                >
                    {status}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'call_summary',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Summary" />
        ),
        cell: ({ row }) => {
            const summary = row.getValue('call_summary') as string;
            return (
                <div className="max-w-[300px] truncate" title={summary || ''}>
                    {summary || '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'duration',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Duration (s)" />
        ),
        cell: ({ row }) => {
            const duration = row.getValue('duration') as number;
            return <div>{duration ? `${duration}s` : '-'}</div>;
        },
    },
    {
        accessorKey: 'sentiment',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Sentiment" />
        ),
        cell: ({ row }) => {
            const sentiment = row.getValue('sentiment') as string;
            return <div>{sentiment || '-'}</div>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return <div>{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>;
        },
    },
];

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGridColumnHeader } from '@/components/ui/data-grid';

export type AgentRequest = {
    id: string;
    request_type: 'create' | 'update' | 'delete';
    status: 'pending' | 'approved' | 'rejected';
    name: string | null;
    priority: 'normal' | 'high' | 'urgent';
    created_at: string;
};

export const columns: ColumnDef<AgentRequest>[] = [
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
        accessorKey: 'name',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
            const name = row.getValue('name') as string;
            return <div className="font-medium">{name || '-'}</div>;
        },
    },
    {
        accessorKey: 'request_type',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
            const type = row.getValue('request_type') as string;
            return (
                <Badge variant="outline" className="capitalize">
                    {type}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";

            switch (status) {
                case 'pending':
                    variant = "secondary";
                    break;
                case 'approved':
                    variant = "default"; // success equivalent
                    break;
                case 'rejected':
                    variant = "destructive";
                    break;
            }

            return (
                <Badge variant={variant} className="capitalize">
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'priority',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => {
            const priority = row.getValue('priority') as string;
            return (
                <Badge variant="outline" className="capitalize">
                    {priority}
                </Badge>
            );
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

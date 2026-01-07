'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGridColumnHeader } from '@/components/ui/data-grid';

export type Agent = {
    id: string;
    user_id: string;
    name: string;
    provider_type: 'vapi' | 'twilio';
    call_state: 'idle' | 'ringing' | 'in-progress' | 'completed' | 'failed';
    created_at: string;
};

export const columns: ColumnDef<Agent>[] = [
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
            return <div className="font-medium">{name}</div>;
        },
    },
    {
        accessorKey: 'user_id',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="User ID" />
        ),
        cell: ({ row }) => {
            const userId = row.getValue('user_id') as string;
            return <div className="text-xs text-muted-foreground font-mono">{userId}</div>;
        },
    },
    {
        accessorKey: 'provider_type',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Provider" />
        ),
        cell: ({ row }) => {
            const provider = row.getValue('provider_type') as string;
            return (
                <Badge variant="outline" className="capitalize">
                    {provider}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'call_state',
        header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Call State" />
        ),
        cell: ({ row }) => {
            const state = row.getValue('call_state') as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";

            switch (state) {
                case 'idle':
                    variant = "secondary";
                    break;
                case 'in-progress':
                    variant = "default";
                    break;
                case 'ringing':
                    variant = "default";
                    break;
                case 'failed':
                    variant = "destructive";
                    break;
                case 'completed':
                    variant = "outline";
                    break;
            }

            return (
                <Badge variant={variant} className="capitalize">
                    {state}
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

<script lang="ts">
    // UI components
    import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
    import {
        Table,
        TableHeader,
        TableRow,
        TableHead,
        TableBody,
        TableCell,
        TableCaption
    } from '$lib/components/ui/table';

    // Server-provided data
    export let data: { players?: Array<{ id: number; player: string; acs: number; kd: number; adr: number }>} = {};
    let players = data.players ?? [];

    const cols: Array<{ key: 'player' | 'acs' | 'kd' | 'adr'; label: string; align?: 'left' | 'right' }> = [
        { key: 'player', label: 'Player', align: 'left' },
        { key: 'acs', label: 'ACS', align: 'right' },
        { key: 'kd', label: 'K/D', align: 'right' },
        { key: 'adr', label: 'ADR', align: 'right' }
    ];

    const fmtNum = (n: unknown, digits = 2) =>
        typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : String(n ?? '');
    // Layout components
    import DashboardCenter from '$lib/components/layout/DashboardCenter.svelte';
    import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
</script>

<DashboardCenter max="max-w-4xl" vertical="center">
    <DashboardGrid cols="md:grid-cols-2" gap="gap-6">
        <Card class="w-full">
            <CardHeader>
                <CardTitle class="text-2xl text-center">Top 20 Players</CardTitle>
            </CardHeader>
            <CardContent>
                <Table class="w-full">
            <TableCaption>{players.length} players (ordered by ACS)</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead class="w-12 text-right">#</TableHead>
                    {#each cols as c}
                        <TableHead class={c.align === 'right' ? 'text-right' : 'text-left'}>{c.label}</TableHead>
                    {/each}
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each players as p, i (p.id ?? i)}
                    <TableRow class="hover:bg-muted/50">
                        <TableCell class="text-right font-mono">{i + 1}</TableCell>
                        {#each cols as c}
                            <TableCell class={c.align === 'right' ? 'text-right' : 'text-left'}>
                                {#if c.key === 'player'}
                                    {p.player}
                                {:else if c.key === 'acs'}
                                    {fmtNum(p.acs, 1)}
                                {:else if c.key === 'kd'}
                                    {fmtNum(p.kd, 2)}
                                {:else if c.key === 'adr'}
                                    {fmtNum(p.adr, 1)}
                                {/if}
                            </TableCell>
                        {/each}
                    </TableRow>
                {/each}
            </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card class="w-full">
            <CardHeader>
                <CardTitle class="text-2xl text-center">Placeholder Card</CardTitle>
            </CardHeader>
            <CardContent>
                This is a placeholder for additional content.
            </CardContent>
        </Card>
    </DashboardGrid>
</DashboardCenter>

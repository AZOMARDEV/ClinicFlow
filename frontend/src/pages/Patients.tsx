import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, SearchIcon, SearchXIcon, Trash2Icon, UserPlusIcon, UsersIcon, XIcon } from 'lucide-react';
import { EmptyState, PageHeader, PatientCell, TableSkeleton } from '@/components/common';
import { DeletePatientSheet } from '@/components/DeletePatientSheet';
import { ErrorState } from '@/components/ErrorState';
import { PatientFormSheet } from '@/components/PatientFormSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { ageFrom, formatBirthDate, formatCreated } from '@/lib/datetime';
import { usePatients } from '@/lib/queries';
import type { Patient } from '@/lib/types';
import { useDebounce } from '@/lib/use-debounce';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function PatientsPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const query = usePatients({ search: debouncedSearch || undefined, page, limit });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const result = query.data;
  const rows = result?.data ?? [];
  const totalPages = Math.max(1, result?.totalPages ?? 1);
  const first = result && result.total ? (result.page - 1) * result.limit + 1 : 0;
  const last = result ? first + rows.length - 1 : 0;

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (p: Patient) => {
    setEditing(p);
    setFormOpen(true);
  };
  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const subtitle = !result
    ? ' '
    : debouncedSearch
      ? `${plural(result.total, 'patient')} matching “${debouncedSearch}”`
      : `${plural(result.total, 'patient')} registered`;

  return (
    <>
      <PageHeader
        title="Patients"
        description={subtitle}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon /> Add patient
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[360px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search patients by name or CIN"
            placeholder="Search by name or CIN…"
            className="px-9.5"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent cursor-pointer"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span id="rows-label" className="text-[13px] text-muted-foreground">
            Rows per page
          </span>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger aria-labelledby="rows-label" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {query.isLoading ? (
          <TableSkeleton rows={5} />
        ) : query.isError && !result ? (
          <ErrorState error={query.error} title="Could not load patients" onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={SearchXIcon}
              title={`No patients match “${debouncedSearch}”`}
              description="Check the spelling, search by part of the name, or try the CIN (e.g. AB12)."
              action={
                <Button variant="outline" onClick={clearSearch}>
                  <XIcon /> Clear search
                </Button>
              }
              secondaryAction={
                <Button variant="ghost" onClick={openCreate}>
                  <UserPlusIcon /> Add as new patient
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="No patients yet"
              description="Patients you register will be listed here, searchable by name or CIN."
              action={
                <Button onClick={openCreate}>
                  <UserPlusIcon /> Add your first patient
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table className={query.isFetching ? 'opacity-70 transition-opacity' : undefined}>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="w-32">CIN</TableHead>
                  <TableHead className="w-44">Phone</TableHead>
                  <TableHead className="w-32">Birth date</TableHead>
                  <TableHead className="w-32">Registered</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <PatientCell id={p.id} name={p.fullName} sub={p.address ?? 'No address'} mono={false} />
                    </TableCell>
                    <TableCell className="font-mono text-[13px]">{p.cin}</TableCell>
                    <TableCell className="font-mono text-[13px] whitespace-nowrap">{p.phone}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{formatBirthDate(p.birthDate)}</span>
                        <span className="text-xs text-muted-foreground">{ageFrom(p.birthDate)} years</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatCreated(p.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Edit ${p.fullName}`} title="Edit" onClick={() => openEdit(p)}>
                          <PencilIcon />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-red-50"
                            aria-label={`Delete ${p.fullName}`}
                            title="Delete"
                            onClick={() => setToDelete(p)}
                          >
                            <Trash2Icon />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t border-row-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[13px] text-muted-foreground">
                {first === last ? `Showing ${first}` : `Showing ${first}–${last}`} of {plural(result?.total ?? 0, 'patient')}
              </span>
              <nav aria-label="Pagination" className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeftIcon /> Previous
                </Button>
                <span className="px-2 text-sm tabular-nums" aria-current="page">
                  Page {page} of {totalPages}
                </span>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRightIcon />
                </Button>
              </nav>
            </div>
          </>
        )}
      </Card>

      <PatientFormSheet open={formOpen} onOpenChange={setFormOpen} patient={editing} />
      <DeletePatientSheet
        patient={toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        onDeleted={() => rows.length === 1 && page > 1 && setPage(page - 1)}
      />
    </>
  );
}

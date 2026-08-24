/**
 * Minimal in-memory Supabase admin client for offline E2E scheduling tests.
 * Supports the query shapes used by schedule publish / session / catch-up paths.
 */

export type Row = Record<string, unknown>;

export type FakeStore = {
  courses: Row[];
  course_schedule_rules: Row[];
  course_sessions: Row[];
  enrollments: Row[];
  profiles: Row[];
  notifications: Row[];
  course_session_student_invites: Row[];
};

export function createEmptyStore(): FakeStore {
  return {
    courses: [],
    course_schedule_rules: [],
    course_sessions: [],
    enrollments: [],
    profiles: [],
    notifications: [],
    course_session_student_invites: [],
  };
}

type TableName = keyof FakeStore;

function cloneRow(row: Row): Row {
  return JSON.parse(JSON.stringify(row));
}

function parseSelect(spec: string): {
  columns: string[] | null;
  embeds: Array<{ alias: string; table: string }>;
} {
  const embeds: Array<{ alias: string; table: string }> = [];
  const cleaned = spec.replace(
    /([a-zA-Z_][\w]*)\s*:\s*([a-zA-Z_][\w]*)\s*\([^)]*\)/g,
    (_m, alias: string, table: string) => {
      embeds.push({ alias, table });
      return "";
    }
  );
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.includes("*") || parts.length === 0) {
    return { columns: null, embeds };
  }
  return { columns: parts, embeds };
}

function applyEmbeds(
  store: FakeStore,
  table: TableName,
  row: Row,
  embeds: Array<{ alias: string; table: string }>
): Row {
  const out = cloneRow(row);
  for (const emb of embeds) {
    if (emb.alias === "profile" && emb.table === "profiles") {
      const profile = store.profiles.find((p) => p.id === row.user_id) ?? null;
      out.profile = profile ? cloneRow(profile) : null;
    } else if (
      emb.alias === "schedule_rule" &&
      emb.table === "course_schedule_rules"
    ) {
      const rule =
        store.course_schedule_rules.find((r) => r.id === row.schedule_rule_id) ??
        null;
      out.schedule_rule = rule ? cloneRow(rule) : null;
    } else if (emb.alias === "session" && emb.table === "course_sessions") {
      const session =
        store.course_sessions.find((s) => s.id === row.session_id) ?? null;
      out.session = session ? cloneRow(session) : null;
    } else if (emb.alias === "course" && emb.table === "courses") {
      const course =
        store.courses.find((c) => c.id === row.course_id) ?? null;
      out.course = course ? cloneRow(course) : null;
    }
  }
  return out;
}

function project(row: Row, columns: string[] | null): Row {
  if (!columns) return row;
  const out: Row = {};
  for (const col of columns) {
    if (col in row) out[col] = row[col];
  }
  // Keep embeds
  for (const [k, v] of Object.entries(row)) {
    if (
      k === "profile" ||
      k === "schedule_rule" ||
      k === "session" ||
      k === "course"
    ) {
      out[k] = v;
    }
  }
  return out;
}

function jsonContains(haystack: unknown, needle: Record<string, unknown>): boolean {
  if (!haystack || typeof haystack !== "object") return false;
  const obj = haystack as Record<string, unknown>;
  for (const [k, v] of Object.entries(needle)) {
    if (obj[k] !== v) return false;
  }
  return true;
}

class FakeQuery {
  private filters: Array<{ key: string; value: unknown }> = [];
  private inFilters: Array<{ key: string; values: unknown[] }> = [];
  private gteFilters: Array<{ key: string; value: string }> = [];
  private containsFilters: Array<{ key: string; value: Record<string, unknown> }> =
    [];
  private orderSpec: { key: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private selectSpec = "*";
  private pending:
    | { type: "insert"; rows: Row[] }
    | { type: "update"; patch: Row }
    | { type: "upsert"; rows: Row[]; onConflict?: string; ignoreDuplicates?: boolean }
    | { type: "delete" }
    | null = null;

  constructor(
    private store: FakeStore,
    private table: TableName
  ) {}

  select(spec: string) {
    this.selectSpec = spec;
    return this;
  }

  insert(rowOrRows: Row | Row[]) {
    this.pending = {
      type: "insert",
      rows: Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows],
    };
    return this;
  }

  update(patch: Row) {
    this.pending = { type: "update", patch };
    return this;
  }

  upsert(
    rowOrRows: Row | Row[],
    opts?: { onConflict?: string; ignoreDuplicates?: boolean }
  ) {
    this.pending = {
      type: "upsert",
      rows: Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows],
      onConflict: opts?.onConflict,
      ignoreDuplicates: opts?.ignoreDuplicates,
    };
    return this;
  }

  delete() {
    this.pending = { type: "delete" };
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push({ key, value });
    return this;
  }

  in(key: string, values: unknown[]) {
    this.inFilters.push({ key, values });
    return this;
  }

  gte(key: string, value: string) {
    this.gteFilters.push({ key, value });
    return this;
  }

  contains(key: string, value: Record<string, unknown>) {
    this.containsFilters.push({ key, value });
    return this;
  }

  order(key: string, opts?: { ascending?: boolean }) {
    this.orderSpec = { key, ascending: opts?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private matchedRows(): Row[] {
    let rows = this.store[this.table].slice();
    for (const f of this.filters) {
      rows = rows.filter((r) => r[f.key] === f.value);
    }
    for (const f of this.inFilters) {
      rows = rows.filter((r) => f.values.includes(r[f.key]));
    }
    for (const f of this.gteFilters) {
      rows = rows.filter((r) => String(r[f.key] ?? "") >= f.value);
    }
    for (const f of this.containsFilters) {
      rows = rows.filter((r) => jsonContains(r[f.key], f.value));
    }
    if (this.orderSpec) {
      const { key, ascending } = this.orderSpec;
      rows.sort((a, b) => {
        const av = String(a[key] ?? "");
        const bv = String(b[key] ?? "");
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    return rows;
  }

  private run(): { data: Row[] | Row | null; error: Error | null } {
    const { columns, embeds } = parseSelect(this.selectSpec);

    if (this.pending?.type === "insert") {
      const inserted: Row[] = [];
      for (const raw of this.pending.rows) {
        const row = {
          id: raw.id ?? crypto.randomUUID(),
          created_at: raw.created_at ?? new Date().toISOString(),
          ...raw,
        };
        this.store[this.table].push(row);
        inserted.push(cloneRow(row));
      }
      return { data: inserted, error: null };
    }

    if (this.pending?.type === "update") {
      const matched = this.matchedRows();
      const updated: Row[] = [];
      for (const row of matched) {
        Object.assign(row, this.pending.patch);
        updated.push(cloneRow(row));
      }
      return { data: updated, error: null };
    }

    if (this.pending?.type === "upsert") {
      const conflictKeys = (this.pending.onConflict || "id")
        .split(",")
        .map((s) => s.trim());
      const upserted: Row[] = [];
      for (const raw of this.pending.rows) {
        const existing = this.store[this.table].find((row) =>
          conflictKeys.every((k) => row[k] === raw[k])
        );
        if (existing) {
          if (!this.pending.ignoreDuplicates) {
            Object.assign(existing, raw);
          }
          upserted.push(cloneRow(existing));
        } else {
          const row = {
            id: raw.id ?? crypto.randomUUID(),
            created_at: raw.created_at ?? new Date().toISOString(),
            ...raw,
          };
          this.store[this.table].push(row);
          upserted.push(cloneRow(row));
        }
      }
      return { data: upserted, error: null };
    }

    if (this.pending?.type === "delete") {
      const matched = new Set(this.matchedRows());
      const removed: Row[] = [];
      this.store[this.table] = this.store[this.table].filter((row) => {
        if (matched.has(row)) {
          removed.push(cloneRow(row));
          return false;
        }
        return true;
      });
      return { data: removed, error: null };
    }

    const rows = this.matchedRows().map((row) =>
      project(applyEmbeds(this.store, this.table, row, embeds), columns)
    );
    return { data: rows, error: null };
  }

  then<TResult1 = { data: Row[] | null; error: Error | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: Row[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = this.run();
      const payload = {
        data: (result.data as Row[]) ?? null,
        error: result.error,
      };
      return Promise.resolve(payload).then(onfulfilled, onrejected);
    } catch (err) {
      return Promise.reject(err).then(onfulfilled, onrejected);
    }
  }

  async maybeSingle() {
    const result = this.run();
    if (result.error) return { data: null, error: result.error };
    const rows = result.data as Row[];
    return { data: rows[0] ?? null, error: null };
  }

  async single() {
    const result = this.run();
    if (result.error) return { data: null, error: result.error };
    const rows = result.data as Row[];
    if (!rows[0]) {
      return { data: null, error: new Error("Row not found") };
    }
    return { data: rows[0], error: null };
  }
}

export function createFakeSupabaseAdmin(store: FakeStore) {
  return {
    from(table: string) {
      if (!(table in store)) {
        throw new Error(`Unknown table: ${table}`);
      }
      return new FakeQuery(store, table as TableName);
    },
  };
}

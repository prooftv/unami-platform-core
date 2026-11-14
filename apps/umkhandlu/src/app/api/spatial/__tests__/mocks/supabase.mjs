class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.start = null;
    this.end = null;
    this.max = null;
    this.countOnly = false;
  }

  select(_columns, options = {}) {
    this.countOnly = options.head === true;
    return this;
  }
  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  ilike(column, pattern) {
    const prefix = pattern.replace(/%$/, '').toLowerCase();
    this.filters.push((row) => String(row[column]).toLowerCase().startsWith(prefix));
    return this;
  }
  order() {
    return this;
  }
  range(start, end) {
    this.start = start;
    this.end = end;
    return this;
  }
  limit(count) {
    this.max = count;
    return this;
  }
  single() {
    return this.run(true);
  }
  maybeSingle() {
    return this.run(true);
  }
  async run(single = false) {
    const state = globalThis.__spatialRouteTestState;
    if (state.failTable === this.table) {
      return { data: null, error: { message: 'mock database failure' } };
    }
    const source =
      this.table === 'spatial_datasets'
        ? state.datasets
        : this.table === 'spatial_staged_features'
          ? state.features
          : [];
    let rows = source.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.countOnly) {
      return { data: null, count: rows.length, error: null };
    }
    if (this.start !== null) rows = rows.slice(this.start, this.end + 1);
    if (this.max !== null) rows = rows.slice(0, this.max);
    return {
      data: single ? rows[0] ?? null : rows,
      count: rows.length,
      error: null,
    };
  }
  then(resolve, reject) {
    return this.run().then(resolve, reject);
  }
}

export function createServiceClient() {
  return { from: (table) => new Query(table) };
}

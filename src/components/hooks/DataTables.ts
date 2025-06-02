import React, { useMemo } from "react";
import {
  useTable,
  usePagination,
  useGlobalFilter,
  useColumnOrder,
  useFilters,
  Column,
  useTableInstance,
  TableInstance,
} from "react-table";

// 🧪 Define a type for your data
export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// 🔍 Global search input
const GlobalFilter = ({
  globalFilter,
  setGlobalFilter,
}: {
  globalFilter: string;
  setGlobalFilter: (filterValue: string) => void;
}) => (
  <input
    value={globalFilter || ""}
    onChange={(e) => setGlobalFilter(e.target.value)}
    placeholder="Search..."
    className="border px-2 py-1 mb-4"
  />
);

interface Props<T extends object> {
  columnsData: Column<T>[];
  tableData: T[];
}

function Table<T extends object>({ columnsData, tableData }: Props<T>) {
  const columns = useMemo(() => columnsData, [columnsData]);
  const data = useMemo(() => tableData, [tableData]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    setPageSize,
    state,
    setGlobalFilter,
    allColumns,
    pageOptions,
  }: TableInstance<T> = useTable<T>(
    {
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    usePagination,
    useColumnOrder
  );

  const { globalFilter, pageIndex, pageSize } = state as any;

  return (
    <div className="p-4">
      <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

      {/* 👁️ Column visibility */}
      <div className="mb-2">
        {allColumns.map((column) => (
          <label key={column.id} className="mr-4">
            <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
            {column.render("Header")}
          </label>
        ))}
      </div>

      <table {...getTableProps()} className="w-full border border-collapse">
        <thead className="bg-gray-200">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.getHeaderGroupProps().key}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} className="border p-2" key={column.id}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} className="border p-2 text-center" key={cell.column.id}>
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 📃 Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-3 py-1 border mr-2">
            Prev
          </button>
          <button onClick={() => nextPage()} disabled={!canNextPage} className="px-3 py-1 border">
            Next
          </button>
        </div>

        <span>
          Page <strong>{pageIndex + 1} of {pageOptions.length}</strong>
        </span>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="ml-4 border px-2 py-1"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Table;

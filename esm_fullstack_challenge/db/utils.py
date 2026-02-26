import re
from typing import List, Tuple, Any


# Whitelist of valid column name pattern (alphanumeric and underscores only)
VALID_COLUMN_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')
VALID_OPERATORS = {'=', '!=', '<', '>', '<=', '>='}


def validate_identifier(name: str) -> bool:
    """Validate that a string is a safe SQL identifier (column/table name)."""
    return bool(VALID_COLUMN_PATTERN.match(name))


def query_builder(
        table: str | None = None,
        columns: List[str] | None = None,
        custom_select: str | None = None,
        where: str | None = None,
        group_by: List[str] | None = None,
        order_by: List[str | Tuple[str, str]] | None = None,
        limit: int | None = None,
        offset: int | None = None,
        filter_by: List[Tuple[str, Any] | Tuple[str, str, Any]] | None = None,
        count_only: bool | None = False,
) -> Tuple[str, List[Any]]:
    """Builds a SQL query string with parameterized values.

    Args:
        table: Name of table. Defaults to None.
        columns: Name of columns to select. Defaults to None.
        custom_select: Custom select statement that can be used instead of
                       table and columns params. Defaults to None.
        where: Where statement. Defaults to None.
        group_by: List of columns to group by. Defaults to None.
        order_by: List of column names or list of (column, direction)
                  to order by. Defaults to None.
        limit: Number of rows to return. Defaults to None.
        offset: Number of rows to offset. Defaults to None.
        filter_by: List of tuples to filter by. Defaults to None.
        count_only: If True, query will return full count of query ignoring
                    any limit or offset. Defaults to False.

    Returns:
        Tuple[str, List[Any]]: SQL query string and list of parameters.
    """
    params: List[Any] = []

    # Validate table name
    if table and not validate_identifier(table):
        raise ValueError(f'Invalid table name: {table}')

    # Validate column names
    if columns:
        for col in columns:
            if not validate_identifier(col):
                raise ValueError(f'Invalid column name: {col}')

    select_str = ''
    if custom_select:
        select_str = custom_select
    else:
        select_str = 'select {columns} from {table}'.format(
            columns=' ,'.join(columns) if columns else '*',
            table=table,
        )

    order_by_str = ''
    if order_by:
        order_parts = []
        for col in order_by:
            if isinstance(col, str):
                if not validate_identifier(col):
                    raise ValueError(f'Invalid order_by column: {col}')
                order_parts.append(col)
            elif isinstance(col, tuple) and len(col) == 2:
                col_name, direction = col
                if not validate_identifier(col_name):
                    raise ValueError(f'Invalid order_by column: {col_name}')
                if direction.lower() not in ['asc', 'desc']:
                    raise ValueError(f'Invalid order direction: {direction}')
                order_parts.append(f'{col_name} {direction}')
            else:
                raise ValueError(f'Invalid order_by format: {col}')

        order_by_str = ' order by ' + ', '.join(order_parts)

    assert not where.strip().startswith('where') if where else True, \
        "Where clause should not start with 'where' keyword"

    where_str = f' where {where}' if where else ''
    if filter_by:
        filter_str_list = []
        for col_tuple in filter_by:
            if isinstance(col_tuple, tuple):
                if len(col_tuple) == 2:
                    column, value = col_tuple
                    if not validate_identifier(column):
                        raise ValueError(f'Invalid filter column: {column}')
                    if isinstance(value, (list, tuple)):
                        placeholders = ', '.join(['?'] * len(value))
                        filter_str_list.append(f'{column} in ({placeholders})')
                        params.extend(value)
                    else:
                        filter_str_list.append(f'{column} = ?')
                        params.append(value)
                elif len(col_tuple) == 3:
                    column, operator, value = col_tuple
                    if not validate_identifier(column):
                        raise ValueError(f'Invalid filter column: {column}')
                    if operator not in VALID_OPERATORS:
                        raise ValueError(f'Invalid operator: {operator}')
                    filter_str_list.append(f'{column} {operator} ?')
                    params.append(value)
                else:
                    raise ValueError(f'Invalid filter_by tuple length: {len(col_tuple)}')
            else:
                raise ValueError(f'Invalid filter_by format: {tuple}')
        where_str += (' and ' if where_str else ' where ') + ' and '.join(filter_str_list)

    # Validate group_by columns
    group_by_str = ''
    if group_by:
        for col in group_by:
            if not validate_identifier(col):
                raise ValueError(f'Invalid group_by column: {col}')
        group_by_str = ' group by ' + ', '.join(group_by)

    if not count_only:
        query = (
            '{select}'
            '{where}'
            '{group_by}'
            '{order_by}'
            '{limit}'
            '{offset}'
            ';'

        ).format(
            select=select_str,
            where=where_str,
            group_by=group_by_str,
            order_by=order_by_str,
            limit=f' limit {int(limit)}' if limit is not None else '',
            offset=f' offset {int(offset)}' if offset is not None else '',
        )
        return query, params
    else:
        query = (
            'select count(*) from {table}'
            '{where}'
            ';'

        ).format(
            table=table,
            where=where_str,
        )
        return query, params

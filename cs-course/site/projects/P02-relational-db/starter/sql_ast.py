"""AST boundary for the deliberately incomplete SQL subset."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple


class NotImplementedFeature(RuntimeError):
    """Raised until a student implements the SQL subset parser."""


@dataclass(frozen=True)
class SelectStatement:
    projections: Tuple[str, ...]
    table: str
    predicate: Optional[str] = None
    join_table: Optional[str] = None
    group_by: Tuple[str, ...] = ()
    order_by: Optional[str] = None
    limit: Optional[int] = None


def parse_sql(sql: str) -> SelectStatement:
    """Student hook: parse the published SELECT subset into an AST."""

    raise NotImplementedFeature("TODO(student): implement SQL subset parser")

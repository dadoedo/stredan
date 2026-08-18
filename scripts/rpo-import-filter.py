#!/usr/bin/env python3
"""Stream-filter rpo2.sql.gz to active companies useful for SME outreach.

Keeps legal forms:
  112 s.r.o., 121 a.s., 113 k.s., 111 v.o.s., 205 družstvo
Skips terminated entities and sole traders.
Drops full-document GIN indexes (too heavy for a 4GB VPS).
"""
from __future__ import annotations

import gzip
import json
import sys

KEEP_LEGAL = {"112", "121", "113", "111", "205"}
SKIP_INDEX_SNIPPETS = (
    "index_rpo2_organizations_data_gin",
    "index_rpo2_suborganizations_data_gin",
)


def legal_code(data: dict) -> str | None:
    forms = data.get("legalForms") or []
    if not forms:
        return None
    value = forms[0].get("value") or {}
    return value.get("code")


def keep_org(data: dict) -> bool:
    if data.get("termination"):
        return False
    return legal_code(data) in KEEP_LEGAL


def main() -> None:
    src = sys.argv[1]
    out = sys.stdout
    kept_ids: set[int] = set()
    section = "preamble"
    org_in = org_kept = sub_in = sub_kept = 0

    with gzip.open(src, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            if any(s in line for s in SKIP_INDEX_SNIPPETS):
                continue

            if line.startswith("COPY rpo2.organizations"):
                section = "orgs"
                out.write(line)
                continue
            if line.startswith("COPY rpo2.suborganizations"):
                section = "subs"
                out.write(line)
                continue

            if section == "orgs":
                if line.startswith("\\."):
                    out.write(line)
                    section = "preamble"
                    print(f"-- orgs in={org_in} kept={org_kept}", file=sys.stderr, flush=True)
                    continue
                org_in += 1
                try:
                    oid = int(line.split("\t", 1)[0])
                    data = json.loads(line.split("\t", 2)[1])
                except Exception:
                    continue
                if keep_org(data):
                    kept_ids.add(oid)
                    org_kept += 1
                    out.write(line)
                continue

            if section == "subs":
                if line.startswith("\\."):
                    out.write(line)
                    section = "preamble"
                    print(f"-- subs in={sub_in} kept={sub_kept}", file=sys.stderr, flush=True)
                    continue
                sub_in += 1
                try:
                    main_id = int(line.split("\t", 2)[1])
                except Exception:
                    continue
                if main_id in kept_ids:
                    sub_kept += 1
                    out.write(line)
                continue

            out.write(line)

    print(f"-- done orgs_kept={org_kept} subs_kept={sub_kept}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Export one older SmartGrowth account into a standalone *demonstration* backup.

Run locally only; the export is readable JSON and contains business data.
No account credentials/passwords/tokens are included.
"""
import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def export_one(db_path: Path, user_id: str):
    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    try:
        tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        def rows(table):
            if table not in tables:
                return []
            return [dict(r) for r in con.execute(f'SELECT * FROM {table} WHERE user_id=?', (user_id,))]
        profile = rows('business_profiles')
        if not profile and not rows('transactions') and not rows('invoices'):
            raise SystemExit(f'No records found for account {user_id!r} in the selected database.')
        p = profile[0] if profile else {}
        tx = []
        for r in rows('transactions'):
            tx.append({'id':f"old-tx-{r['id']}",'kind':r['kind'],'amount':r['amount'],
                       'category':r['category'],'description':r['description'] or '',
                       'created_at':r['created_at'],'sample':True})
        invoices = []
        for r in rows('invoices'):
            invoices.append({'id':f"old-inv-{r['id']}", 'number':f"SG-{r['id']:05d}",
                             'customer':r['customer'],'description':r['description'],'amount':r['amount'],
                             'due_date':r['due_date'], 'status':r['status'],'createdAt':r['created_at'],
                             'sample':True})
        docs = {r['doc_type']:bool(r['completed']) for r in rows('documents')}
        listings = []
        for r in rows('market_listings'):
            listings.append({'id':f"old-list-{r['id']}", 'name':r['name'], 'description':r['description'],
                             'price':r['price_from'], 'createdAt':r['created_at'], 'sample':True})
        b = {'id':f'imported-{user_id}', 'name':p.get('business_name') or f'{user_id} Imported Business (Demo)',
             'industry':p.get('industry') or 'Other','region':p.get('region') or 'Eastern Cape',
             'description':p.get('description') or 'Older SmartGrowth local demo records (unverified)',
             'createdAt':datetime.now(timezone.utc).isoformat(),
             'transactions':tx,'invoices':invoices,'documents':docs,'listings':listings,'reviewedOpportunities':False}
        state = {'version':1,'activeId':b['id'],'businesses':[b], 'updatedAt':datetime.now(timezone.utc).isoformat()}
        return {'type':'smartgrowth-standalone-backup','exportedAt':datetime.now(timezone.utc).isoformat(),'data':state}
    finally:
        con.close()

if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('database', type=Path, help='backend/data/growth_demo.sqlite3')
    parser.add_argument('user_id', help='The specific old demo user_id, e.g. demo')
    parser.add_argument('--output', default='smartgrowth-imported-demo.json')
    args = parser.parse_args()
    if not args.database.is_file():parser.error('Database file not found')
    data = export_one(args.database,args.user_id)
    out=Path(args.output)
    out.write_text(json.dumps(data,indent=2),encoding='utf-8')
    print(f'Wrote {out} — handle this plain-text business-data file privately.')

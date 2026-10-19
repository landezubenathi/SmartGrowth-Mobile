"""Hackathon demo growth tools. User IDs are client supplied: NOT production authentication."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from pathlib import Path
from datetime import datetime, timezone
import sqlite3, re
from contextlib import contextmanager

router = APIRouter(prefix='/api/growth', tags=['Growth & protection demo'])
DB = Path(__file__).resolve().parent / 'data' / 'growth_demo.sqlite3'
DB.parent.mkdir(parents=True, exist_ok=True)

def conn():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute('CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, kind TEXT NOT NULL, amount REAL NOT NULL, category TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS documents (user_id TEXT NOT NULL, doc_type TEXT NOT NULL, completed INTEGER NOT NULL, PRIMARY KEY(user_id,doc_type))')
    db.commit()
    return db

@contextmanager
def db_session():
    """Commit or roll back and reliably close SQLite connections."""
    db = conn()
    try:
        with db:
            yield db
    finally:
        db.close()

def check_user(u):
    if not u or len(u)>100 or not re.fullmatch(r'[\w@.\-]+',u):
        raise HTTPException(422, 'Invalid demo user ID')

class Transaction(BaseModel):
    user_id: str
    kind: Literal['income','expense']
    amount: float = Field(gt=0, le=100000000)
    category: str = Field(min_length=1,max_length=60)
    description: str = Field(default='',max_length=240)

@router.post('/transactions')
def add_transaction(tx:Transaction):
    check_user(tx.user_id)
    with db_session() as db:
        c=db.execute('INSERT INTO transactions(user_id,kind,amount,category,description,created_at) VALUES(?,?,?,?,?,?)', (tx.user_id,tx.kind,round(tx.amount,2),tx.category,tx.description,datetime.now(timezone.utc).isoformat()))
        return {'id':c.lastrowid,'saved':True}

@router.get('/transactions/{user_id}')
def transactions(user_id:str):
    check_user(user_id)
    with db_session() as db:
        rows=[dict(r) for r in db.execute('SELECT * FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 300',(user_id,))]
    income=round(sum(r['amount'] for r in rows if r['kind']=='income'),2)
    expense=round(sum(r['amount'] for r in rows if r['kind']=='expense'),2)
    return {'transactions':rows,'summary':{'income':income,'expenses':expense,'surplus':round(income-expense,2)},'note':'Totals reflect the most recent 300 recorded entries, not verified bank data.'}

DOCUMENTS={'registration':'Business registration evidence','bank':'Business bank records','tax':'Tax compliance evidence','invoices':'Sales invoices','identity':'Owner identification'}
class DocumentUpdate(BaseModel):
    user_id:str
    doc_type:Literal['registration','bank','tax','invoices','identity']
    completed:bool

@router.post('/documents')
def update_document(d:DocumentUpdate):
    check_user(d.user_id)
    with db_session() as db:
        db.execute('INSERT INTO documents VALUES(?,?,?) ON CONFLICT(user_id,doc_type) DO UPDATE SET completed=excluded.completed',(d.user_id,d.doc_type,int(d.completed)))
    return {'saved':True}

@router.get('/passport/{user_id}')
def passport(user_id:str):
    """Calculate a transparent score from actual demo activity and self-declarations.

    Never interpret a saved profile as a CIPC registration or an unpaid invoice
    as money received. Nothing here is verified by a bank, CIPC, SARS or funder.
    Tables introduced in Phase 2 are optional so older SQLite files still work.
    """
    check_user(user_id)
    data=transactions(user_id)['summary']
    with db_session() as db:
        saved={r['doc_type']:bool(r['completed']) for r in db.execute('SELECT doc_type, completed FROM documents WHERE user_id=?',(user_id,))}
        available={r['name'] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('business_profiles','invoices')")}
        has_profile=bool(db.execute('SELECT 1 FROM business_profiles WHERE user_id=?',(user_id,)).fetchone()) if 'business_profiles' in available else False
        invoice_count=db.execute('SELECT count(*) FROM invoices WHERE user_id=?',(user_id,)).fetchone()[0] if 'invoices' in available else 0
        paid_count=db.execute("SELECT count(*) FROM invoices WHERE user_id=? AND status='paid'",(user_id,)).fetchone()[0] if 'invoices' in available else 0

    # 60 points from recorded actions, 40 from optional self-declared evidence.
    # Invoice issue is documentary activity only; payment/income is a separate rule.
    signals=[
        {'key':'profile','label':'Business profile created in SmartGrowth','points':15,'complete':has_profile,'explanation':'Saving a profile is not company registration.'},
        {'key':'invoice','label':'At least one invoice issued in SmartGrowth','points':10,'complete':invoice_count>0,'explanation':'An issued invoice does not mean a customer has paid.'},
        {'key':'income','label':'Recorded income from sales or demo payments','points':15,'complete':data['income']>0,'explanation':'Uses bookkeeping entries, including simulated paid invoices.'},
        {'key':'surplus','label':'Positive recorded surplus','points':10,'complete':data['income']>0 and data['surplus']>0,'explanation':'Recorded income exceeds recorded expenses; not verified profit.'},
        {'key':'volume','label':'At least R5,000 in recorded income','points':10,'complete':data['income']>=5000,'explanation':'Based on recent recorded transactions, not bank verification.'},
    ]
    activity_points=sum(row['points'] for row in signals if row['complete'])
    documents=[]
    for key,label in DOCUMENTS.items():
        manual=saved.get(key,False)
        automatic=(key=='invoices' and invoice_count>0)
        completed=manual or automatic
        # Invoice points are scored through activity, not a second time as a document.
        points=0 if key=='invoices' else 10
        source='recorded in SmartGrowth' if automatic else ('self-declared' if manual else 'not provided')
        documents.append({'key':key,'label':label,'completed':completed,
                          'manual_completed':manual,'auto_completed':automatic,
                          'source':source,'points':points,'can_toggle':not automatic})
    declaration_points=sum(doc['points'] for doc in documents if doc['completed'])
    score=activity_points+declaration_points
    actions=[]
    if not has_profile:actions.append('Save your business profile under Registration (+15 points).')
    if not invoice_count:actions.append('Create a sales invoice in Invoices & Payments (+10 points). An unpaid invoice is not income.')
    if not data['income']:actions.append('Record real business income in Bookkeeping, or simulate an invoice payment for the demo (+15 points).')
    if data['income'] and data['surplus']<=0:actions.append('Review recorded costs to understand how to improve cash flow (+10 points for a positive recorded surplus).')
    if 0<data['income']<5000:actions.append('Continue accurately recording genuine sales; R5,000 recorded income is the next illustrative milestone (+10 points).')
    for d in documents:
        if d['points'] and not d['completed']:
            actions.append(f"When applicable, obtain and self-declare: {d['label']} (+10 points; not independently verified).")
    return {
        'score':score,'max_score':100,'automatic_points':activity_points,
        'self_declared_points':declaration_points,'automatic_max':60,'self_declared_max':40,
        'activity_signals':signals,'documents':documents,'financials':data,
        'activity':{'business_profile_saved':has_profile,'invoices_created':invoice_count,'simulated_invoices_paid':paid_count},
        'actions':actions[:8],
        'disclaimer':('Illustrative readiness indicator only, NOT a credit score or funding probability. '
                      'Profile and invoice milestones are automatically detected within this local demo, not independently verified. '
                      'Financial entries and external document declarations may be self-reported or simulated. '
                      'No CIPC, SARS, banking or funder verification is performed.')
    }

class ShieldRequest(BaseModel):
    message:str=Field(min_length=1,max_length=10000)

@router.post('/shield/check')
def shield(data:ShieldRequest):
    s=data.message.lower()
    rules=[('Advance payment request',r'(?i)(upfront fee|processing fee|registration fee|pay (?:first|before)|send (?:money|r\s?\d+)|deposit .*to (?:unlock|release))'),('Urgency pressure',r'(?i)(act now|urgent|within 24 hours|last chance|immediately|today only)'),('Sensitive credential request',r'(?i)(otp|one.time pin|password|pin number|cvv|banking login)'),('Guaranteed funding claim',r'(?i)(guaranteed (?:loan|grant|funding|approval)|100% approved|no checks)'),('Suspicious contact channel',r'(?i)(bit\.ly/|tinyurl\.com|telegram|whatsapp only|crypto wallet)')]
    signals=[name for name,pattern in rules if re.search(pattern,s)]
    level='high' if len(signals)>=2 else ('caution' if signals else 'no obvious indicators')
    return {'level':level,'signals':signals,'recommendations':['Do not send money or OTPs to an unverified contact.','Check funding details using the official provider website or telephone number.','A text-only check cannot determine whether an opportunity is genuine.'],'disclaimer':'Rule-based screening only; not a verified fraud determination.'}

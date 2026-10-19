"""SmartGrowth — explainable, local, deterministic growth advisor.

No generative model is used in this demo: recommendations are traceable rules
built from user-provided demo records. All outputs are educational only.
Account ownership is checked by the API dependency in main.py. Local pilot only.
"""
from datetime import datetime, timezone, date
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel
from growth_modules import db_session, check_user, passport, transactions, DOCUMENTS
from phase2_modules import db_conn, profile_for, docs_for, procurement

router = APIRouter(prefix='/api/growth/advisor', tags=['Phase 3 — growth advisor demo'])

MANUAL_TASKS = frozenset({'review_procurement', 'fraud_safety', 'follow_up_invoices'})

class TaskProgress(BaseModel):
    user_id: str
    task_id: Literal['review_procurement', 'fraud_safety', 'follow_up_invoices']
    completed: bool


def mark_task(data: TaskProgress):
    check_user(data.user_id)
    with db_session() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS advisor_progress
                      (user_id TEXT NOT NULL, task_id TEXT NOT NULL, completed INTEGER NOT NULL,
                       updated_at TEXT NOT NULL, PRIMARY KEY(user_id,task_id))''')
        db.execute('''INSERT INTO advisor_progress(user_id, task_id, completed, updated_at)
                      VALUES(?,?,?,?) ON CONFLICT(user_id,task_id)
                      DO UPDATE SET completed=excluded.completed, updated_at=excluded.updated_at''',
                   (data.user_id, data.task_id, int(data.completed), datetime.now(timezone.utc).isoformat()))
    return {'saved': True, 'task_id': data.task_id, 'completed': data.completed,
            'note': 'This is self-reported task progress and does not change your Growth Passport score.'}


@router.post('/progress')
def update_progress(data: TaskProgress):
    return mark_task(data)


@router.get('/health')
def health_check():
    """Lightweight marker to distinguish the Phase 3 backend from older releases."""
    return {'status': 'ok', 'feature': 'growth-advisor', 'phase': '3',
            'message': 'SmartGrowth Advisor routes are available.'}


@router.get('/{user_id}')
def get_advice(user_id: str):
    check_user(user_id)
    growth_passport = passport(user_id)
    ledger = transactions(user_id)
    totals = ledger['summary']
    with db_conn() as db:
        profile = profile_for(db, user_id)
        docs = docs_for(db, user_id)
        invoices = [dict(row) for row in db.execute(
            'SELECT id,amount,status,due_date FROM invoices WHERE user_id=? ORDER BY id DESC LIMIT 150', (user_id,))]
        listings = db.execute('SELECT count(*) FROM market_listings WHERE user_id=?', (user_id,)).fetchone()[0]
        leads = db.execute('''SELECT count(*) FROM market_enquiries e
                             JOIN market_listings l ON l.id=e.listing_id WHERE l.user_id=?''', (user_id,)).fetchone()[0]
    with db_session() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS advisor_progress
                      (user_id TEXT NOT NULL, task_id TEXT NOT NULL, completed INTEGER NOT NULL,
                       updated_at TEXT NOT NULL, PRIMARY KEY(user_id,task_id))''')
        declared = {r['task_id']:bool(r['completed']) for r in db.execute(
            'SELECT task_id,completed FROM advisor_progress WHERE user_id=?', (user_id,))}
    today = date.today()
    unpaid = [i for i in invoices if i['status']=='unpaid']
    overdue = [i for i in unpaid if i['due_date'] and i['due_date'] < today.isoformat()]
    unpaid_value = round(sum(i['amount'] for i in unpaid), 2)
    top_rfq = procurement(user_id)['opportunities'][:3]
    score = growth_passport['score']

    tasks = []
    def add(key, title, explanation, action, week, priority, category, route, completed, source, manual=False):
        # Deterministic stable IDs, so progress survives refreshed advice.
        tasks.append({
            'id':key, 'title':title, 'why':explanation, 'next_step':action,
            'week':week, 'priority':priority, 'category':category,
            'route':route, 'auto_completed':bool(completed) if not manual else False,
            'manual':manual, 'completed':bool(declared.get(key,False)) if manual else bool(completed),
            'source':source,
        })

    add('business_profile', 'Describe your business',
        'Without a saved sector and province, opportunity recommendations cannot be personalised.',
        'Add the business name, sector and province in Registration.', 1,'High','Registration',
        '/growth-workspace?tab=registration', bool(profile),'Registration profile',False)
    add('first_sale', 'Build a sales record',
        f"Recorded income: R{totals['income']:,.2f}. Accurate sales records support understanding cash flow.",
        'Enter a genuine sale in Bookkeeping, or simulate a paid invoice in the demo.', 1,'High','Bookkeeping',
        '/growth-workspace?tab=bookkeeping', totals['income']>0, 'Recorded transactions',False)
    add('first_invoice','Issue an invoice for work delivered',
        f"{len(invoices)} demo invoices recorded. Unpaid invoices are not revenue.",
        'Create your first demo invoice with a fictional customer.',1,'Medium','Payments',
        '/growth-workspace?tab=payments',len(invoices)>0,'Invoice register',False)
    add('cash_surplus','Understand costs and cash flow',
        f"Recorded income R{totals['income']:,.2f}, expenses R{totals['expenses']:,.2f}, surplus R{totals['surplus']:,.2f}.",
        'Review sales and expenses and identify avoidable costs.',2,'High' if totals['surplus']<=0 else 'Medium','Bookkeeping',
        '/growth-workspace?tab=bookkeeping',totals['income']>0 and totals['surplus']>0,'Bookkeeping summary',False)
    add('registration_doc','Check business registration evidence',
        'A business profile is not official company registration. This checklist uses self-declared status.',
        'Review CIPC requirements that apply to your business; declare evidence only if genuinely held.',2,'High','Compliance',
        '/growth-workspace?tab=registration',docs.get('registration',False),'Self-declared registration checklist',False)
    add('tax_doc','Review your tax documentation',
        'Many opportunities require appropriate tax records, although exact requirements differ.',
        'Review SARS requirements; declare evidence only when available.',2,'Medium','Compliance',
        '/growth-workspace?tab=registration',docs.get('tax',False),'Self-declared tax checklist',False)
    add('bank_doc','Keep business bank records',
        'A consistent transaction trail makes it easier to prepare financial statements.',
        'Review available banking records and update the self-declared checklist.',2,'Medium','Compliance',
        '/growth-workspace?tab=registration',docs.get('bank',False),'Self-declared bank checklist',False)
    add('review_procurement','Review a relevant procurement brief',
        ('Top fictional match: '+top_rfq[0]['title']+' ('+str(top_rfq[0]['match_score'])+'/100 demo similarity).') if profile else 'Create your business profile to unlock relevant procurement comparisons.',
        'Inspect the sample brief, note missing documents, and verify real tenders independently.',3,'Medium','Procurement',
        '/growth-workspace?tab=procurement',False,'Fictional procurement catalogue',True)
    add('market_listing','Publish a local demo service listing',
        f'{listings} business listing(s); {leads} local demo enquiry/enquiries.',
        'Describe one product or service and publish a fictional listing.',3,'Medium','Market access',
        '/growth-workspace?tab=market',listings>0,'Local demo marketplace',False)
    add('fraud_safety','Review funding scam warning signs',
        'Unexpected upfront fees and requests for OTPs are common red flags; screening is not verification.',
        'Try the SmartShield checker and verify offers through official channels.',4,'High','Fraud protection',
        '/growth-workspace?tab=shield',False,'SmartShield rules',True)
    if unpaid:
        add('follow_up_invoices','Follow up on outstanding invoices',
            f'{len(unpaid)} unpaid demo invoice(s) worth R{unpaid_value:,.2f}; {len(overdue)} have a past due date.',
            'Review unpaid invoices. Do not mark them as paid unless money actually arrived (except explicit demo simulation).',4,
            'High' if overdue else 'Medium','Cash flow','/growth-workspace?tab=payments',False,'Invoice register',True)

    tasks.sort(key=lambda t: (t['week'], 0 if t['priority']=='High' else 1, t['id']))
    done = sum(t['completed'] for t in tasks)
    pending = [t for t in tasks if not t['completed']]
    primary = sorted(pending, key=lambda t: (0 if t['priority']=='High' else 1, t['week']))[:3]
    insights = []
    def insight(kind,title,body,evidence,route):
        insights.append({'kind':kind,'title':title,'body':body,'evidence':evidence,'route':route})

    if not profile:
        insight('action','Personalisation needs a business profile',
                'Save your sector and province so procurement guidance can be more relevant.',
                'No business profile saved','/growth-workspace?tab=registration')
    if totals['income'] == 0:
        insight('action','Start measuring business income',
                'No income is currently recorded. Record genuine sales; unpaid invoices do not count.',
                'Recorded income: R0.00','/growth-workspace?tab=bookkeeping')
    elif totals['surplus'] <= 0:
        insight('risk','Recorded expenses meet or exceed income',
                'Examine major cost categories and cash timing before adding new financial commitments.',
                f"Recorded surplus: R{totals['surplus']:,.2f}",'/growth-workspace?tab=bookkeeping')
    else:
        insight('positive','Recorded activity shows a surplus',
                'Use this starting point to budget for costs, but remember these are self-reported or simulated transactions.',
                f"Recorded surplus: R{totals['surplus']:,.2f}",'/growth-workspace?tab=bookkeeping')
    if overdue:
        insight('risk','Some demo invoices are past due',
                'Follow up on outstanding amounts and avoid counting unpaid invoices as received cash.',
                f'{len(overdue)} overdue invoice(s)', '/growth-workspace?tab=payments')
    elif unpaid:
        insight('action','Track unpaid invoices separately',
                'Invoices are sales documentation; only payments should update recorded income.',
                f"R{unpaid_value:,.2f} in unpaid invoices",'/growth-workspace?tab=payments')
    if profile and top_rfq:
        best = top_rfq[0]
        insight('opportunity','A sample procurement brief matches your profile',
                f"Review '{best['title']}' and compare its evidence checklist before looking for real tenders.",
                f"Fictional match similarity {best['match_score']}/100; not eligibility",'/growth-workspace?tab=procurement')
    if score < 60:
        insight('action','Build a stronger business record one step at a time',
                'The Passport explains which milestones and declarations contribute to your illustrative readiness score.',
                f'Passport {score}/100','/growth-workspace?tab=passport')
    if not listings:
        insight('opportunity','Make your products discoverable',
                'Create a sample listing to test how buyers could find local services.',
                'No business listing yet','/growth-workspace?tab=market')

    return {
        'generated_at':datetime.now(timezone.utc).isoformat(),
        'business':profile,
        'snapshot':{
            'income':totals['income'],'expenses':totals['expenses'],'surplus':totals['surplus'],
            'passport_score':score,'passport_max':100,'invoices':len(invoices),'unpaid_invoices':len(unpaid),
            'unpaid_value':unpaid_value,'overdue_invoices':len(overdue),
            'market_listings':listings,'market_enquiries':leads,
            'self_declared_docs':sum(bool(docs.get(k)) for k in ('registration','tax','bank','identity')),
        },
        'insights':insights,
        'priority_actions':primary,
        'plan':{'title':'Your 30-day growth sprint', 'tasks':tasks,'completed':done,'total':len(tasks),
                'completion_percent':round(100*done/len(tasks)) if tasks else 0,
                'note':'The weeks are planning stages, not scheduled reminders. Tasks may auto-complete when recorded milestones are achieved; review tasks are self-marked.'},
        'procurement_matches':top_rfq,
        'disclaimer':('Explainable rule-based guidance from local, self-reported and simulated demo records. '
                      'It is NOT a generative AI prediction, professional financial advice, credit rating, '
                      'bank verification or official procurement eligibility determination. '
                      'Any procurement examples are fictional. Verify real opportunities independently. '
                      'No real payments or external business registration take place.'),
    }

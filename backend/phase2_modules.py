"""SmartGrowth business workflow — local demonstration features only.

Registration statuses are self-declared, payments are SIMULATED, procurement
opportunities and initial market listings are FICTIONAL. API account IDs are checked against an authenticated session in main.py.
Do not expose this local pilot to the public internet without further hardening.
"""
from datetime import date, datetime, timezone
from decimal import Decimal
from contextlib import contextmanager
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from growth_modules import conn, check_user, DOCUMENTS

router = APIRouter(prefix='/api/growth', tags=['Growth Phase 2 (local demo)'])

INDUSTRIES = ['Catering', 'Retail', 'Agriculture', 'Construction', 'Technology', 'Services', 'Manufacturing', 'Other']
REGIONS = ['Eastern Cape', 'Gauteng', 'KwaZulu-Natal', 'Western Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape']

GUIDE = [
    {'key':'profile','title':'Create your business profile','note':'Record what you sell and where you operate. This step does not create a legal entity.','url':None},
    {'key':'cipc','title':'Business registration (where applicable)','note':'Use the official CIPC BizPortal to learn about and complete a relevant company registration. Sole proprietors may have different requirements.','url':'https://www.bizportal.gov.za/'},
    {'key':'tax','title':'Check applicable tax requirements','note':'Use SARS eFiling for tax registrations and tax compliance status. Requirements depend on your circumstances.','url':'https://www.sars.gov.za/'},
    {'key':'bank','title':'Set up business banking records','note':'Consider a suitable business account and keep bank records. This is a self-reported checklist.','url':None},
    {'key':'csd','title':'Government supplier registration (optional)','note':'If you plan to supply government, register with the official Central Supplier Database.','url':'https://secure.csd.gov.za/'},
]

# These are intentionally fictional, not scraped tenders or real government calls.
DEMO_RFQS = [
    {'id':'DEMO-RFQ-001','title':'Catering for a community skills workshop','buyer':'Illustrative Community Centre','sector':'Catering','region':'Eastern Cape','value':18000,'required':['registration','tax'], 'summary':'Provide refreshments and lunch packs for a community training workshop.'},
    {'id':'DEMO-RFQ-002','title':'Supply stationery packs','buyer':'Illustrative Enterprise Hub','sector':'Retail','region':'Gauteng','value':12000,'required':['registration'], 'summary':'Supply stationery starter packs to a small business training programme.'},
    {'id':'DEMO-RFQ-003','title':'Maintain a small business website','buyer':'Illustrative Local Innovation Hub','sector':'Technology','region':'Eastern Cape','value':30000,'required':['registration','tax','bank'], 'summary':'Build and support a simple informational website.'},
    {'id':'DEMO-RFQ-004','title':'Supply locally grown vegetables','buyer':'Illustrative Community Kitchen','sector':'Agriculture','region':'Eastern Cape','value':10000,'required':['registration'], 'summary':'Weekly fresh produce for a fictional community food programme.'},
    {'id':'DEMO-RFQ-005','title':'Community venue maintenance','buyer':'Illustrative Facilities Team','sector':'Construction','region':'KwaZulu-Natal','value':45000,'required':['registration','tax'], 'summary':'Basic repairs and planned maintenance for a community meeting venue.'},
    {'id':'DEMO-RFQ-006','title':'Printing and branded merchandise','buyer':'Illustrative Events Group','sector':'Services','region':'Eastern Cape','value':24000,'required':['registration','tax'], 'summary':'Provide event printing, signage and branded apparel.'},
]

# Fictional catalogue entries show how discovery looks before real suppliers sign up.
EXAMPLE_MARKET = [
    {'id':'sample-1','name':'Demo Fresh Produce Co.','category':'Agriculture','region':'Eastern Cape','description':'Example listing: vegetables and seasonal produce, local delivery by arrangement.','price_from':250,'demo':True},
    {'id':'sample-2','name':'Demo Print Studio','category':'Services','region':'Eastern Cape','description':'Example listing: flyer printing, business cards and apparel branding.','price_from':150,'demo':True},
    {'id':'sample-3','name':'Demo IT Support','category':'Technology','region':'Gauteng','description':'Example listing: basic web setup and IT support for small businesses.','price_from':450,'demo':True},
]


def now():
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def db_conn():
    db = conn()
    db.execute('''CREATE TABLE IF NOT EXISTS business_profiles (user_id TEXT PRIMARY KEY, business_name TEXT NOT NULL, industry TEXT NOT NULL, region TEXT NOT NULL, description TEXT NOT NULL, updated_at TEXT NOT NULL)''')
    db.execute('''CREATE TABLE IF NOT EXISTS registration_steps (user_id TEXT NOT NULL, step TEXT NOT NULL, completed INTEGER NOT NULL, PRIMARY KEY(user_id,step))''')
    db.execute('''CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, customer TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>0), due_date TEXT, status TEXT NOT NULL DEFAULT 'unpaid', created_at TEXT NOT NULL, paid_at TEXT, ledger_transaction_id INTEGER UNIQUE)''')
    db.execute('''CREATE TABLE IF NOT EXISTS market_listings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, region TEXT NOT NULL, description TEXT NOT NULL, price_from REAL NOT NULL CHECK(price_from>0), created_at TEXT NOT NULL)''')
    db.execute('''CREATE TABLE IF NOT EXISTS market_enquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL, buyer_user_id TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(listing_id) REFERENCES market_listings(id))''')
    db.commit()
    try:
        with db:
            yield db
    finally:
        db.close()


def profile_for(db, user_id):
    row = db.execute('SELECT * FROM business_profiles WHERE user_id=?',(user_id,)).fetchone()
    return dict(row) if row else None


def docs_for(db, user_id):
    return {r['doc_type']:bool(r['completed']) for r in db.execute('SELECT doc_type, completed FROM documents WHERE user_id=?',(user_id,))}


class BusinessProfile(BaseModel):
    user_id: str
    business_name: str = Field(min_length=2, max_length=90)
    industry: Literal['Catering','Retail','Agriculture','Construction','Technology','Services','Manufacturing','Other']
    region: Literal['Eastern Cape','Gauteng','KwaZulu-Natal','Western Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
    description: str = Field(default='',max_length=400)

    @field_validator('business_name')
    @classmethod
    def non_blank(cls, v):
        if not v.strip():raise ValueError('Business name must not be blank')
        return v.strip()


@router.get('/registration/{user_id}')
def get_registration(user_id: str):
    check_user(user_id)
    with db_conn() as db:
        prof=profile_for(db,user_id)
        docs=docs_for(db,user_id)
        csd=db.execute('SELECT completed FROM registration_steps WHERE user_id=? AND step=?',(user_id,'csd')).fetchone()
        statuses={'profile':bool(prof),'cipc':docs.get('registration',False),'tax':docs.get('tax',False),'bank':docs.get('bank',False),'csd':bool(csd['completed']) if csd else False}
    return {'profile':prof,'steps':[{**step,'completed':statuses[step['key']]} for step in GUIDE], 'completed':sum(statuses.values()),'total':len(GUIDE),'industries':INDUSTRIES,'regions':REGIONS,'disclaimer':'This is a self-declared checklist, not a CIPC, SARS, bank or CSD verification or registration service.'}


@router.post('/registration/profile')
def save_profile(data:BusinessProfile):
    check_user(data.user_id)
    with db_conn() as db:
        db.execute('''INSERT INTO business_profiles(user_id,business_name,industry,region,description,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET business_name=excluded.business_name,industry=excluded.industry,region=excluded.region,description=excluded.description,updated_at=excluded.updated_at''',(data.user_id,data.business_name,data.industry,data.region,data.description.strip(),now()))
    return get_registration(data.user_id)


class RegistrationStep(BaseModel):
    user_id:str
    step:Literal['cipc','tax','bank','csd']
    completed:bool


@router.post('/registration/step')
def set_registration_step(data:RegistrationStep):
    check_user(data.user_id)
    map_doc={'cipc':'registration','tax':'tax','bank':'bank'}
    with db_conn() as db:
        if data.step in map_doc:
            db.execute('''INSERT INTO documents(user_id,doc_type,completed) VALUES(?,?,?) ON CONFLICT(user_id,doc_type) DO UPDATE SET completed=excluded.completed''',(data.user_id,map_doc[data.step],int(data.completed)))
        else:
            db.execute('''INSERT INTO registration_steps(user_id,step,completed) VALUES(?,?,?) ON CONFLICT(user_id,step) DO UPDATE SET completed=excluded.completed''',(data.user_id,data.step,int(data.completed)))
    return get_registration(data.user_id)


class InvoiceRequest(BaseModel):
    user_id:str
    customer:str=Field(min_length=2,max_length=100)
    description:str=Field(min_length=2,max_length=200)
    amount:Decimal=Field(gt=0,le=10000000, max_digits=10,decimal_places=2)
    due_date:Optional[date]=None


@router.post('/invoices')
def create_invoice(data:InvoiceRequest):
    check_user(data.user_id)
    with db_conn() as db:
        cur=db.execute('INSERT INTO invoices(user_id,customer,description,amount,due_date,status,created_at) VALUES(?,?,?,?,?,?,?)',(data.user_id,data.customer.strip(),data.description.strip(),float(data.amount),data.due_date.isoformat() if data.due_date else None,'unpaid',now()))
        invoice_id=cur.lastrowid
    return {'id':invoice_id,'invoice_number':f'SG-{invoice_id:05d}','status':'unpaid','message':'Demo invoice saved. No payment link or real money transfer was created.'}


@router.get('/invoices/{user_id}')
def get_invoices(user_id:str):
    check_user(user_id)
    with db_conn() as db:
        rows=[dict(r) for r in db.execute('SELECT * FROM invoices WHERE user_id=? ORDER BY id DESC LIMIT 150',(user_id,))]
    for row in rows:row['invoice_number']=f"SG-{row['id']:05d}"
    return {'invoices':rows,'counts':{'unpaid':sum(r['status']=='unpaid' for r in rows),'paid':sum(r['status']=='paid' for r in rows)}, 'disclaimer':'Payments are simulated. Mark Paid only for demonstration; it creates one linked bookkeeping entry.'}


@router.post('/invoices/{invoice_id}/simulate-payment')
def simulate_payment(invoice_id:int, user_id:str=Query(...)):
    check_user(user_id)
    with db_conn() as db:
        db.execute('BEGIN IMMEDIATE')
        invoice=db.execute('SELECT * FROM invoices WHERE id=? AND user_id=?',(invoice_id,user_id)).fetchone()
        if not invoice:raise HTTPException(404,'Invoice not found for this demo account')
        if invoice['status']=='paid':return {'status':'paid','already_paid':True,'ledger_transaction_id':invoice['ledger_transaction_id'],'message':'Already marked paid. No duplicate income was added.'}
        paid_at=now()
        tx=db.execute('INSERT INTO transactions(user_id,kind,amount,category,description,created_at) VALUES(?,?,?,?,?,?)',(user_id,'income',invoice['amount'],'Invoice payment',f"Simulated payment SG-{invoice_id:05d}: {invoice['description']}",paid_at))
        db.execute('UPDATE invoices SET status=?, paid_at=?, ledger_transaction_id=? WHERE id=?',('paid',paid_at,tx.lastrowid,invoice_id))
    return {'status':'paid','already_paid':False,'ledger_transaction_id':tx.lastrowid,'message':'Demo payment recorded and added to bookkeeping. NO real transaction occurred.'}


@router.get('/procurement/{user_id}')
def procurement(user_id:str):
    check_user(user_id)
    with db_conn() as db:
        prof=profile_for(db,user_id)
        docs=docs_for(db,user_id)
        csd=db.execute('SELECT completed FROM registration_steps WHERE user_id=? AND step=?',(user_id,'csd')).fetchone()
        csd_ready=bool(csd['completed']) if csd else False
    matches=[]
    for opp in DEMO_RFQS:
        sector_match=prof is not None and prof['industry']==opp['sector']
        region_match=prof is not None and prof['region']==opp['region']
        missing=[DOCUMENTS[k] for k in opp['required'] if not docs.get(k,False)]
        # No real eligibility determination. Score is explainable ordering only.
        score=(40 if sector_match else 0)+(20 if region_match else 0)+(10 if prof else 0)+(20 if not missing else max(0,20-10*len(missing)))+(10 if csd_ready else 0)
        matches.append({**opp,'match_score':score,'sector_match':sector_match,'region_match':region_match,'missing_documents':missing,'next_action':('Review the illustrative requirements and prepare a quotation' if not missing else 'Prepare: '+', '.join(missing))})
    return {'opportunities':sorted(matches,key=lambda o:(-o['match_score'],o['id'])),'profile_complete':bool(prof),'csd_self_reported':csd_ready,'disclaimer':'All opportunities, buyers, values and matches on this tab are FICTIONAL examples. Nothing here is a live tender or a confirmed eligibility decision. Check official procurement sources independently.'}


class ListingRequest(BaseModel):
    user_id:str
    name:str=Field(min_length=2,max_length=90)
    category:Literal['Catering','Retail','Agriculture','Construction','Technology','Services','Manufacturing','Other']
    region:Literal['Eastern Cape','Gauteng','KwaZulu-Natal','Western Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
    description:str=Field(min_length=8,max_length=500)
    price_from:Decimal=Field(gt=0,le=10000000,max_digits=10,decimal_places=2)


@router.post('/market/listings')
def create_listing(data:ListingRequest):
    check_user(data.user_id)
    with db_conn() as db:
        cur=db.execute('INSERT INTO market_listings(user_id,name,category,region,description,price_from,created_at) VALUES(?,?,?,?,?,?,?)',(data.user_id,data.name.strip(),data.category,data.region,data.description.strip(),float(data.price_from),now()))
    return {'id':cur.lastrowid,'created':True,'message':'Demo marketplace listing published locally. This does not make it visible to real buyers.'}


@router.get('/market/listings')
def listings(category:Optional[str]=None, region:Optional[str]=None):
    with db_conn() as db:
        rows=[{**dict(r),'id':f"listing-{r['id']}",'demo':False} for r in db.execute('SELECT * FROM market_listings ORDER BY id DESC LIMIT 150')]
    items=rows+EXAMPLE_MARKET
    if category:items=[r for r in items if r['category']==category]
    if region:items=[r for r in items if r['region']==region]
    return {'listings':items,'disclaimer':'Sample suppliers are fictional. User-created listings are local demo data, not vetted or publicly discoverable.'}


class EnquiryRequest(BaseModel):
    buyer_user_id:str
    listing_id:int=Field(gt=0)
    message:str=Field(min_length=5,max_length=500)


@router.post('/market/enquiries')
def create_enquiry(data:EnquiryRequest):
    check_user(data.buyer_user_id)
    with db_conn() as db:
        listing=db.execute('SELECT * FROM market_listings WHERE id=?',(data.listing_id,)).fetchone()
        if not listing:raise HTTPException(404,'Listing not found. Fictional examples cannot receive enquiries.')
        if listing['user_id']==data.buyer_user_id:raise HTTPException(400,'Use another demo buyer account to enquire about your own listing.')
        cur=db.execute('INSERT INTO market_enquiries(listing_id,buyer_user_id,message,created_at) VALUES(?,?,?,?)',(data.listing_id,data.buyer_user_id,data.message.strip(),now()))
    return {'id':cur.lastrowid,'saved':True,'message':'Local demonstration enquiry delivered to the seller inbox; no email or SMS sent.'}


@router.get('/market/enquiries/{user_id}')
def enquiries(user_id:str):
    check_user(user_id)
    with db_conn() as db:
        rows=[dict(r) for r in db.execute('''SELECT e.id,e.message,e.buyer_user_id,e.created_at,l.name AS listing_name FROM market_enquiries e JOIN market_listings l ON l.id=e.listing_id WHERE l.user_id=? ORDER BY e.id DESC LIMIT 100''',(user_id,))]
    return {'enquiries':rows, 'disclaimer':'Local demo messages only; no verified identity or external delivery.'}


@router.post('/market/listings/{listing_id}/generate-demo-enquiry')
def generate_demo_enquiry(listing_id:int, user_id:str=Query(...)):
    """Explicitly generate a fictional lead on the signed-in demo user's own listing."""
    check_user(user_id)
    with db_conn() as db:
        listing=db.execute('SELECT * FROM market_listings WHERE id=? AND user_id=?',(listing_id,user_id)).fetchone()
        if not listing:raise HTTPException(404,'Your demo listing was not found')
        msg=f"Fictional buyer enquiry: Please send a quotation for your {listing['category'].lower()} offering."
        cur=db.execute('INSERT INTO market_enquiries(listing_id,buyer_user_id,message,created_at) VALUES(?,?,?,?)',(listing_id,'sample_buyer_demo',msg,now()))
    return {'saved':True,'id':cur.lastrowid,'disclaimer':'Generated fictional local test lead. No external customer contacted your business.'}

"""SmartGrowth account-scoped prototype API — not a production deployment."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from growth_modules import router as core_router
from phase2_modules import router as workflow_router
from phase3_advisor import router as advisor_router
from auth import router as auth_router, init_auth, scoped_account

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_auth()
    yield

app = FastAPI(title='SmartGrowth — Business Journey', version='2.0.0', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3501','http://127.0.0.1:3501','http://localhost','https://localhost','capacitor://localhost'],
    allow_origin_regex=r'^http://(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):3501$',
    allow_credentials=False, allow_methods=['GET','POST'], allow_headers=['Content-Type','Authorization']
)
app.include_router(auth_router)
app.include_router(core_router,dependencies=[Depends(scoped_account)])
app.include_router(workflow_router,dependencies=[Depends(scoped_account)])
app.include_router(advisor_router,dependencies=[Depends(scoped_account)])

@app.get('/health')
def health():
    return {'status':'ok', 'application':'SmartGrowth', 'version':'2.0',
            'authentication':'required', 'features':['journey','bookkeeping','passport','shield','registration','invoices','procurement','marketplace','advisor']}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app',host='127.0.0.1',port=8000)

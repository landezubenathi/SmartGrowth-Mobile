"""SmartGrowth demo API — independent of the original SmartFund platform.

Local hackathon demo only. User identifiers are client-provided and not authenticated.
Do not publish this API or use real financial/customer data without production security.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from growth_modules import router as core_router
from phase2_modules import router as workflow_router
from phase3_advisor import router as advisor_router

app = FastAPI(title="SmartGrowth — Business Journey Demo API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3501", "http://127.0.0.1:3501", "http://localhost", "https://localhost", "capacitor://localhost"], allow_origin_regex=r"^http://(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):3501$", allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.include_router(core_router)
app.include_router(workflow_router)
app.include_router(advisor_router)

@app.get("/health")
def health():
    return {"status": "ok", "application": "SmartGrowth", "mode": "local-demo", "modules": ["journey", "bookkeeping", "passport", "shield", "registration", "invoices", "procurement", "marketplace", "advisor"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)

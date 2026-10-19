"""Local API regression tests for the independent SmartGrowth demo."""
import sys
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parents[1] / 'backend'
sys.path.insert(0, str(BACKEND))
import growth_modules
import auth
from main import app

class SmartGrowthTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.before = growth_modules.DB
        self.before_auth = auth.DB
        test_db = Path(self.temp.name)/'test.sqlite3'
        growth_modules.DB = test_db
        auth.DB = test_db
        self.before_env = __import__('os').environ.get('SMARTGROWTH_SEED_DEMO')
        __import__('os').environ['SMARTGROWTH_SEED_DEMO'] = '1'
        self.context = TestClient(app)
        self.client = self.context.__enter__()
        response = self.client.post('/api/auth/login', json={'email':'demo@smartgrowth.local','password':'SmartDemo!2026'})
        assert response.status_code == 200, response.text
        self.client.headers.update({'Authorization': 'Bearer '+response.json()['token']})
        self.user = 'demo' 

    def tearDown(self):
        self.context.__exit__(None,None,None)
        growth_modules.DB = self.before
        auth.DB = self.before_auth
        if self.before_env is None: __import__('os').environ.pop('SMARTGROWTH_SEED_DEMO',None)
        else: __import__('os').environ['SMARTGROWTH_SEED_DEMO'] = self.before_env
        self.temp.cleanup()

    def test_independent_backend_no_old_funding_portal(self):
        c = self.client
        self.assertEqual(c.get('/health').json()['application'],'SmartGrowth')
        self.assertEqual(c.get('/api/growth/advisor/health').status_code, 200)
        self.assertEqual(c.get('/api/match-funding').status_code, 404)
        self.assertEqual(c.get('/api/auth/login').status_code, 405)

    def test_journey_and_passport_auto_update(self):
        c = self.client
        prior=c.get('/api/growth/passport/demo').json()
        self.assertEqual(prior['score'],0)
        self.assertEqual(c.post('/api/growth/registration/profile',json={
            'user_id':'demo','business_name':'Litha Catering','industry':'Catering','region':'Eastern Cape','description':'Small catering service'
        }).status_code,200)
        next_passport=c.get('/api/growth/passport/demo').json()
        self.assertGreater(next_passport['score'],prior['score'])
        plan=c.get('/api/growth/advisor/demo').json()['plan']['tasks']
        self.assertTrue(next(t for t in plan if t['id']=='business_profile')['completed'])
        self.assertFalse(any(t['route'].startswith('/funding-opportunities') for t in plan))

    def test_invoice_payment_and_bookkeeping_no_duplicates(self):
        c=self.client
        inv=c.post('/api/growth/invoices',json={'user_id':'demo','customer':'Demo Buyer','description':'Catering demo','amount':2500}).json()
        self.assertEqual(c.get('/api/growth/transactions/demo').json()['summary']['income'],0)
        first=c.post(f"/api/growth/invoices/{inv['id']}/simulate-payment?user_id=demo").json()
        self.assertFalse(first['already_paid'])
        again=c.post(f"/api/growth/invoices/{inv['id']}/simulate-payment?user_id=demo").json()
        self.assertTrue(again['already_paid'])
        self.assertEqual(c.get('/api/growth/transactions/demo').json()['summary']['income'],2500)
        c.post('/api/growth/transactions',json={'user_id':'demo','kind':'expense','amount':700,'category':'Transport','description':'Fuel'})
        self.assertEqual(c.get('/api/growth/transactions/demo').json()['summary']['surplus'],1800)

    def test_shield_and_external_checklist(self):
        c=self.client
        danger=c.post('/api/growth/shield/check',json={'message':'Pay a registration fee now and share your OTP and PIN.'})
        self.assertEqual(danger.status_code,200)
        self.assertGreater(len(danger.json()['signals']),0)
        c.post('/api/growth/registration/step',json={'user_id':'demo','step':'cipc','completed':True})
        self.assertTrue(c.get('/api/growth/registration/demo').json()['steps'][1]['completed'])

    def test_growth_advice_and_market_routes(self):
        c=self.client
        self.assertEqual(c.get('/api/growth/procurement/demo').status_code,200)
        self.assertEqual(c.get('/api/growth/market/listings').status_code,200)
        advice=c.get('/api/growth/advisor/demo').json()
        self.assertNotIn('funding_examples',advice)
        self.assertEqual(advice['plan']['total'],len(advice['plan']['tasks']))
        self.assertTrue(all(t['route'].startswith('/growth-workspace') for t in advice['plan']['tasks']))
        self.assertEqual(c.post('/api/growth/advisor/progress',json={'user_id':'demo','task_id':'fraud_safety','completed':True}).status_code,200)
        plan=c.get('/api/growth/advisor/demo').json()['plan']['tasks']
        self.assertTrue(next(t for t in plan if t['id']=='fraud_safety')['completed'])

if __name__=='__main__':unittest.main(verbosity=2)

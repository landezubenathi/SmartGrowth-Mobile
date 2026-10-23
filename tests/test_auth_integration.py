"""Run with: python -m pytest -q tests/test_auth_integration.py (fixtures set test-only credentials)."""
import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import growth_modules
import auth
from main import app

@pytest.fixture()
def api(tmp_path, monkeypatch):
    db=tmp_path/'auth_integration.sqlite3'
    monkeypatch.setattr(growth_modules, 'DB', db)
    monkeypatch.setattr(auth, 'DB', db)
    monkeypatch.setenv('SMARTGROWTH_SEED_DEMO', '1')
    monkeypatch.setenv('SMARTGROWTH_DEMO_PASSWORD', 'TestOnlyDemoPassword_2026!')
    monkeypatch.setenv('SMARTGROWTH_BUYER_PASSWORD', 'TestOnlyBuyerPassword_2026!')
    with TestClient(app) as client:
        yield client


def login(client, email, password):
    response=client.post('/api/auth/login',json={'email':email,'password':password})
    assert response.status_code==200,response.text
    return response.json()


def headers(s): return {'Authorization':'Bearer '+s['token']}


def test_auth_sessions_and_account_isolation(api):
    assert api.get('/health').status_code==200
    assert api.get('/api/growth/transactions/demo').status_code==401
    demo=login(api,'demo@smartgrowth.local','TestOnlyDemoPassword_2026!')
    buyer=login(api,'buyer@smartgrowth.local','TestOnlyBuyerPassword_2026!')
    assert demo['account']['user_id']=='demo'
    assert buyer['account']['user_id']=='buyer'
    assert api.get('/api/auth/me',headers=headers(demo)).json()['account']['user_id']=='demo'
    resp=api.post('/api/growth/transactions',headers=headers(demo),json={'user_id':'demo','kind':'income','amount':2200,'category':'Sales','description':'Event'})
    assert resp.status_code==200, resp.text
    assert api.get('/api/growth/transactions/demo',headers=headers(demo)).json()['summary']['income']==2200
    assert api.get('/api/growth/transactions/buyer',headers=headers(buyer)).json()['summary']['income']==0
    assert api.get('/api/growth/transactions/demo',headers=headers(buyer)).status_code==403
    assert api.post('/api/growth/transactions',headers=headers(buyer),json={'user_id':'demo','kind':'income','amount':20,'category':'Sales'}).status_code==403
    assert api.post('/api/growth/registration/profile',headers=headers(buyer),json={'user_id':'demo','business_name':'Wrong','industry':'Catering','region':'Eastern Cape'}).status_code==403
    assert api.post('/api/growth/advisor/progress',headers=headers(buyer),json={'user_id':'demo','task_id':'fraud_safety','completed':True}).status_code==403
    assert api.get('/api/growth/advisor/demo',headers=headers(buyer)).status_code==403
    assert api.get('/api/growth/advisor/buyer',headers=headers(buyer)).status_code==200
    assert api.post('/api/growth/invoices/1/simulate-payment?user_id=demo',headers=headers(buyer)).status_code==403
    assert api.post('/api/growth/market/enquiries',headers=headers(buyer),json={'buyer_user_id':'demo','listing_id':1,'message':'A message'}).status_code==403
    assert api.post('/api/auth/logout',headers=headers(demo)).status_code==200
    assert api.get('/api/auth/me',headers=headers(demo)).status_code==401


def test_registration_persistence_password_change(api):
    new=api.post('/api/auth/register',json={'display_name':'Test Founder','email':'FOUNDER@EXAMPLE.COM','password':'LongEnoughPass123!'})
    assert new.status_code==201,new.text
    s=new.json(); uid=s['account']['user_id']
    assert uid.startswith('u_')
    assert s['account']['email']=='founder@example.com'
    assert api.post('/api/auth/register',json={'display_name':'Another','email':'founder@example.com','password':'LongEnoughPass123!'}).status_code==409
    profile=api.post('/api/growth/registration/profile',headers=headers(s),json={'user_id':uid,'business_name':'Grow With Me','industry':'Technology','region':'Eastern Cape'})
    assert profile.status_code==200,profile.text
    invoice=api.post('/api/growth/invoices',headers=headers(s),json={'user_id':uid,'customer':'Test Customer','description':'Landing page','amount':1200})
    assert invoice.status_code==200,invoice.text
    invoice_id=invoice.json()['id']
    paid=api.post(f'/api/growth/invoices/{invoice_id}/simulate-payment?user_id={uid}',headers=headers(s))
    assert paid.status_code==200,paid.text
    assert api.post(f'/api/growth/invoices/{invoice_id}/simulate-payment?user_id={uid}',headers=headers(s)).json()['already_paid'] is True
    score=api.get(f'/api/growth/passport/{uid}',headers=headers(s)).json()['score']
    assert score>=40
    changed=api.post('/api/auth/change-password',headers=headers(s),json={'current_password':'LongEnoughPass123!','new_password':'AnotherLongPass456!'})
    assert changed.status_code==200,changed.text
    assert api.get('/api/auth/me',headers=headers(s)).status_code==401
    assert api.post('/api/auth/login',json={'email':'founder@example.com','password':'LongEnoughPass123!'}).status_code==401
    s2=login(api,'founder@example.com','AnotherLongPass456!')
    assert api.get(f'/api/growth/passport/{uid}',headers=headers(s2)).json()['score']==score


def test_password_and_email_validation(api):
    r=api.post('/api/auth/register',json={'display_name':'A', 'email':'bad email','password':'short'})
    assert r.status_code==422
    assert api.get('/api/growth/advisor/health').status_code==200

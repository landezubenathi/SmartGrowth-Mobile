/** Verify Firebase config with no API key printed to the terminal. */
import fs from 'node:fs';
import path from 'node:path';
const projectRoot=path.resolve(import.meta.dirname,'..');
const envPath=path.join(projectRoot,'frontend','.env.local');
function parseEnv(text){
 const result={};
 for(const line of text.split(/\r?\n/)){
  const trimmed=line.trim();
  if(!trimmed||trimmed.startsWith('#'))continue;
  const eq=trimmed.indexOf('=');
  if(eq<=0)continue;
  result[trimmed.slice(0,eq).trim()]=trimmed.slice(eq+1).trim().replace(/^['"]|['"]$/g,'');
 }
 return result;
}
const fromFile=fs.existsSync(envPath)?parseEnv(fs.readFileSync(envPath,'utf8')):{};
const env={...fromFile,...Object.fromEntries(Object.entries(process.env).filter(([k])=>k.startsWith('REACT_APP_FIREBASE_')))};
const required=['REACT_APP_FIREBASE_API_KEY','REACT_APP_FIREBASE_AUTH_DOMAIN','REACT_APP_FIREBASE_PROJECT_ID','REACT_APP_FIREBASE_APP_ID'];
const missing=required.filter(k=>!env[k]||env[k].startsWith('YOUR_'));
if(missing.length){console.error('Firebase setup incomplete. Missing: '+missing.join(', '));process.exit(1);}
if(env.REACT_APP_FIREBASE_PROJECT_ID!=='smartgrowthmobile'){
 console.error('The configured Firebase project ID is not SmartGrowthMobile (smartgrowthmobile).');process.exit(1);
}
if(env.REACT_APP_FIREBASE_AUTH_DOMAIN!=='smartgrowthmobile.firebaseapp.com'){
 console.error('Firebase auth domain does not match this project.');process.exit(1);
}
console.log('Firebase configuration check passed for SmartGrowthMobile. No API keys printed.');

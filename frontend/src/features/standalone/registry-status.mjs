/** Label only internal SmartGrowth registry state; never assert government CIPC approval. */
import {demoRegistryMatch} from './demo-registry.mjs';
import {PRACTICE_SOURCE} from './mock-registry.mjs';
export function registryStatus(business){
  if(business?.registrySource===PRACTICE_SOURCE){
    return {label:'SmartGrowth Registered',style:'matched',detail:'Recorded in the SmartGrowth simulated registry. Not verified by CIPC.'};
  }
  const result=demoRegistryMatch(business);
  if(result.status==='demo-match'){
    return {label:'SmartGrowth Registry Match',style:'matched',detail:'Matched the fictional SmartGrowth registry. Not verified by CIPC.'};
  }
  return {label:'CIPC Status Unverified',style:'',detail:'No official CIPC verification has been performed.'};
}

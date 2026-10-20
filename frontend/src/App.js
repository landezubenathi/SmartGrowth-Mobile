import React,{useEffect} from 'react';
import StandaloneApp from './features/standalone/StandaloneApp';
import './styles/smartgrowth.css';
/** SmartGrowth ships as a fully static/offline-first app. No localhost backend required.
 * Hosted account sync is opt-in inside Settings and uses Firebase directly.
 * Earlier FastAPI pages remain in the repository as a separate legacy/optional mode.
 */
export default function App(){
 useEffect(()=>{document.title='SmartGrowth — Your Business Journey';},[]);
 return <StandaloneApp/>;
}

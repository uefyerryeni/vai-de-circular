/* Planejamento de outra data: módulo reversível, usando o mesmo motor do site principal. */
(()=>{'use strict';
if(window.VDC_FEATURES?.futurePlanner===false)return;
const root=document.querySelector('#vdc-future'),core=window.VDC_CORE,data=window.VDC_DATA;
if(!root||!core||!data)return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const nextDate=()=>{const base=new Date();for(let i=1;i<=14;i++){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+i,12),iso=core.localISO(d);if(core.service(iso).kind==='weekday')return iso}return core.localISO()};
const field=(name,node)=>{const label=el('label','vdc-future-field');label.append(el('span','',name),node);return label};
const title=el('h2','', 'Planejar viagem');
const subtitle=el('p','vdc-future-sub','Consulte outras datas e horários usando as tabelas de referência.');
const form=el('form','vdc-future-form');
const date=el('input');date.type='date';date.required=true;date.min=core.localISO();date.value=nextDate();
const time=el('input');time.type='time';time.required=true;time.step=300;time.value='07:30';
const from=el('select'),to=el('select');
Object.entries(data.stops).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([id,name])=>{for(const target of [from,to]){const o=el('option','',name);o.value=id;target.append(o)}});
from.value='ru';to.value='rei';
const button=el('button','vdc-future-go','Consultar trajetos');button.type='submit';
form.append(field('Data',date),field('A partir das',time),field('De onde',from),field('Para onde',to),button);
const output=el('div','vdc-future-result');output.setAttribute('aria-live','polite');root.append(title,subtitle,form,output);
const message=(txt,cls='vdc-future-note')=>output.append(el('p',cls,txt));
function render(){
 output.replaceChildren();
 if(!date.value||!time.value){message('Escolha a data e o horário da viagem.');return}
 if(date.value<core.localISO()){message('Escolha uma data de hoje em diante.');return}
 if(from.value===to.value){message('Escolha paradas diferentes para origem e destino.');return}
 const info=core.service(date.value);
 if(info.kind!=='weekday'){
  message(info.detail+'. '+info.message+' Consulte as tabelas apenas como referência e confirme a circulação.', 'vdc-future-alert');return;
 }
 message('Horários aproximados; não há localização de ônibus em tempo real.','vdc-future-alert');
 const trips=core.candidates(from.value,to.value,date.value,core.minutes(time.value),6);
 if(!trips.length){message('Não há horário de referência disponível para esse trajeto a partir do horário escolhido.');return}
 const names={D:'Direto',I:'Inverso',ER:'Expresso Reitoria',ECT:'Expresso C&T'};
 trips.forEach((t,i)=>{
  const item=el('article','vdc-future-trip');
  const head=el('div','vdc-future-trip-head'),chip=el('strong','vdc-future-chip',t.line==='ECT'?'C&T':t.line);chip.dataset.line=t.line;
  head.append(chip,el('strong','',names[t.line]+(i===0?' · melhor opção estimada':'')));
  item.append(head,el('div','vdc-future-trip-times',(t.scheduledOrigin?'':'~ ')+core.hh(t.pass)+' embarque · ~ '+core.hh(t.arrival)+' chegada'));
  item.append(el('p','vdc-future-trip-route',t.r.stops.slice(t.a,t.b+1).map(s=>data.stops[s[0]]).join(' → ')));
  output.append(item);
 });
}
form.addEventListener('submit',e=>{e.preventDefault();render()});
render();
})();
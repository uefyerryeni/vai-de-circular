/* Consulta para outra data: uma extensão simples do Vai de Circular.
   Independente da página principal; pode ser desligada em VDC_FEATURES.futurePlanner. */
(()=>{'use strict';
if(window.VDC_FEATURES?.futurePlanner===false)return;
const root=document.querySelector('#vdc-future'),core=window.VDC_CORE,data=window.VDC_DATA;
if(!root||!core||!data)return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const lineName={D:'Circular Direto',I:'Circular Inverso',ER:'Expresso Reitoria',ECT:'Expresso C&T'};
const dateText=iso=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));
const nextWeekday=()=>{const d=new Date();for(let i=1;i<=21;i++){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+i,12),iso=core.localISO(x);if(core.service(iso).kind==='weekday')return iso}return core.localISO()};
const labelFor=(text,control)=>{const label=el('label','vdc-future-field');label.append(el('span','',text),control);return label};
root.className='vdc-future vdc-next-day';
root.append(el('h2','', 'Consultar outro dia'),el('p','vdc-future-sub','Escolha para onde vai e quando pretende sair. Mostramos os horários de referência, não a posição do ônibus.'));
const form=el('form','vdc-future-form');
const origin=el('select'),dest=el('select');
origin.required=true;dest.required=true;
for(const [id,name] of Object.entries(data.stops).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'))){
 for(const target of [origin,dest]){const o=el('option','',name);o.value=id;target.append(o)}
}
origin.value='ru';dest.value='rei';
const date=el('input');date.type='date';date.required=true;date.min=core.localISO();date.value=nextWeekday();
const time=el('input');time.type='time';time.required=true;time.value='07:30';time.step=300;
const button=el('button','vdc-future-go','Ver horários desse dia');button.type='submit';
const formNote=el('p','vdc-plan-hint','A hora escolhida é o início da busca, não a hora de chegada.');
form.append(labelFor('Estou em',origin),labelFor('Quero ir para',dest),labelFor('Qual dia?',date),labelFor('Quero pegar o ônibus a partir das',time),button);
const output=el('div','vdc-future-result');output.setAttribute('aria-live','polite');
root.append(form,formNote,output);
const msg=(text,cls='vdc-future-note')=>output.append(el('p',cls,text));
function routeDetails(t){
 const details=el('details','vdc-plan-route');details.append(el('summary','', 'Ver paradas do percurso'));
 const list=el('ol','vdc-plan-stops');
 t.r.stops.slice(t.a,t.b+1).forEach(s=>list.append(el('li','',data.stops[s[0]])));
 details.append(list);return details;
}
function tripCard(t,featured=false){
 const box=el('article',featured?'vdc-plan-trip vdc-plan-featured':'vdc-plan-trip');
 const top=el('div','vdc-plan-trip-top');
 const chip=el('span','vdc-future-chip',t.line==='ECT'?'C&T':t.line);chip.dataset.line=t.line;
 const name=el('div','vdc-plan-line-name');
 name.append(el('strong','',lineName[t.line]));
 if(featured)name.append(el('small','','Chegada mais cedo entre as opções encontradas'));
 top.append(chip,name);box.append(top);
 const times=el('div','vdc-plan-times');
 const start=el('div','');start.append(el('small','',t.scheduledOrigin?'Horário na tabela':'Passagem estimada'),el('strong','',(t.scheduledOrigin?'':'~ ')+core.hh(t.pass)));
 const end=el('div','');end.append(el('small','','Chegada estimada'),el('strong','','~ '+core.hh(t.arrival)));
 const arrow=el('span','vdc-plan-arrow','→');arrow.setAttribute('aria-hidden','true');
 times.append(start,arrow,end);box.append(times,routeDetails(t));return box;
}
function render(){
 output.replaceChildren();
 const iso=date.value,from=origin.value,to=dest.value;
 if(!iso||!time.value){msg('Escolha o dia e a hora da consulta.');return}
 if(iso<core.localISO()){msg('Escolha hoje ou um dia futuro.');return}
 if(from===to){msg('Escolha uma origem e um destino diferentes.');return}
 const heading=el('div','vdc-plan-result-heading');
 heading.append(el('strong','',data.stops[from]+' → '+data.stops[to]),el('span','',dateText(iso)+' · a partir das '+time.value));
 output.append(heading);
 const info=core.service(iso);
 if(info.kind!=='weekday'){
  const reason=info.kind==='holiday'?'Esta data é '+info.detail+'.':info.kind==='saturday'?'A operação de sábado ainda não foi confirmada.':'Não temos tabela de domingo cadastrada.';
  msg(reason+' Por isso, não é possível recomendar uma saída com segurança.','vdc-future-alert');
  const link=el('a','vdc-plan-table-link','Consultar tabelas de referência');link.href='./#horarios';output.append(link);return;
 }
 const today=iso===core.localISO(),requested=core.minutes(time.value);
 const fromMinutes=today?Math.max(requested,core.now()):requested;
 if(today&&requested<fromMinutes)msg('O horário escolhido já passou. Mostramos as opções a partir de agora.','vdc-plan-disclaimer');
 const trips=core.candidates(from,to,iso,fromMinutes,30);
 if(!trips.length){
  const directExists=core.candidates(from,to,iso,0,1).length>0;
  const note=!directExists
   ?'Não encontramos uma linha que faça esse trajeto diretamente. Pode ser necessário trocar de ônibus ou caminhar parte do percurso.'
   :today?'Não há mais horários de referência para hoje. Consulte outro dia.'
   :'Não há horários de referência após a hora escolhida. Experimente outro horário.';
  msg(note,'vdc-future-alert');return;
 }
 msg('Previsões calculadas a partir da tabela de dias úteis. Não confirmam que o ônibus esteja circulando.','vdc-plan-disclaimer');
 output.append(tripCard(trips[0],true));
 if(trips.length>1){
  const more=el('details','vdc-plan-more');
  more.append(el('summary','', 'Ver outras opções ('+Math.min(trips.length-1,4)+')'));
  const list=el('div','vdc-plan-more-list');
  trips.slice(1,5).forEach(t=>list.append(tripCard(t)));
  more.append(list);output.append(more);
 }
}
for(const ctrl of [origin,dest,date,time]){
 ctrl.addEventListener('change',()=>{output.replaceChildren();msg('Seleção alterada. Clique em “Ver horários desse dia” para consultar.')});
}
form.addEventListener('submit',e=>{e.preventDefault();render()});
render();
})();
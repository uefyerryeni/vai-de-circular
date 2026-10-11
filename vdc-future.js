/* Planejador futuro independente: ative/desative via VDC_FEATURES.futurePlanner */
(()=>{'use strict';
if(window.VDC_FEATURES?.futurePlanner===false||!window.VDC_DATA)return;
const root=document.querySelector('#vdc-future');if(!root)return;
const {stops,routes,schedule}=window.VDC_DATA;
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const minutes=t=>{const [h,m]=t.split(':').map(Number);return 60*h+m};
const hh=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
const holidayNames={'01-01':'Confraternização Universal','04-21':'Tiradentes','05-01':'Dia do Trabalhador','09-07':'Independência do Brasil','10-12':'Nossa Senhora Aparecida','11-02':'Finados','11-15':'Proclamação da República','11-20':'Consciência Negra','12-25':'Natal'};
const easter=y=>{const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(y,month-1,day,12)};
const isoLocal=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const offset=(d,delta)=>{const x=new Date(d);x.setDate(x.getDate()+delta);return isoLocal(x)};
function holiday(s){const y=Number(s.slice(0,4)),md=s.slice(5);if(holidayNames[md])return holidayNames[md];const e=easter(y);const moving=[[-48,'Carnaval (ponto facultativo)'],[-47,'Carnaval (ponto facultativo)'],[-2,'Sexta-feira Santa'],[60,'Corpus Christi (ponto facultativo)']];for(const [days,n] of moving){if(offset(e,days)===s)return n}return null}
function segment(list,a,b){for(let i=0;i<list.length;i++){if(list[i][0]!==a)continue;for(let j=i+1;j<list.length;j++)if(list[j][0]===b)return [i,j]}return null}
root.className='vdc-future';const title=make('h2','', 'Planejar outra data');const desc=make('p','vdc-future-sub','Veja trajetos de referência por data e hora. O planejador “Agora” permanece acima.');
const form=make('form','vdc-future-form');
function field(label,ctrl){const box=make('label','vdc-future-field');box.append(make('span','',label),ctrl);return box}
const date=make('input');date.type='date';date.required=true;date.value='2026-10-13';date.min=today();
const time=make('input');time.type='time';time.required=true;time.value='07:30';time.step=300;
const origin=make('select');const dest=make('select');
Object.entries(stops).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([id,n])=>{for(const sel of [origin,dest]){const op=make('option','',n);op.value=id;sel.append(op)}});
origin.value='ru';dest.value='rei';
const btn=make('button','vdc-future-go','Consultar trajeto');btn.type='submit';
form.append(field('Data da viagem',date),field('A partir de',time),field('Origem',origin),field('Destino',dest),btn);
const output=make('div','vdc-future-result');output.setAttribute('aria-live','polite');root.append(title,desc,form,output);
function note(msg){output.append(make('p','vdc-future-note',msg))}
function render(){
 output.replaceChildren();
 if(!date.value||!time.value||!stops[origin.value]||!stops[dest.value]){note('Preencha todos os campos.');return}
 if(origin.value===dest.value){note('Selecione uma origem e um destino diferentes.');return}
 if(date.value<today()){note('Escolha hoje ou uma data futura.');return}
 const day=new Date(date.value+'T12:00:00').getDay();
 const holidayName=holiday(date.value);
 const alert=holidayName?'Atenção: '+holidayName+'. Não há confirmação da operação do Circular nessa data. Não recomendamos uma saída com base nas tabelas de dias úteis.':day===6?'Sábado: operação não confirmada. Os horários históricos não podem fundamentar uma recomendação de viagem.':day===0?'Domingo: não há programação cadastrada.':'Os resultados abaixo são estimativas baseadas nas tabelas de dias úteis, não uma confirmação de circulação.';
 const warning=make('p','vdc-future-alert',alert);output.append(warning);
 if(holidayName||day===0||day===6)return;
 const threshold=minutes(time.value),trips=[];
 for(const route of Object.values(routes)){
  if(route.day!=='weekday')continue;
  const seg=segment(route.stops,origin.value,dest.value);if(!seg)continue;
  const [a,b]=seg,offset=route.stops[a][1],duration=route.stops[b][1]-offset;
  const table=(schedule[route.terminal]||{})[route.line]||[];
  table.forEach(t=>{const base=minutes(t),pass=base+offset;
   if(pass<threshold||pass>=1440) return;
   // As últimas saídas do RU para D/I podem representar somente a etapa até a Via Direta.
   if(route.terminal==='ru'&&((route.line==='D'&&base===minutes(schedule.ru.D.at(-1)))||(route.line==='I'&&base===minutes(schedule.ru.I.at(-1))))&&route.stops[b][1]>(route.line==='D'?15:10))return;
   trips.push({line:route.line,pass,arrival:pass+duration,scheduled:offset===0&&route.originScheduled!==false,route,a,b});
  });
 }
 trips.sort((a,b)=>a.arrival-b.arrival||a.pass-b.pass);
 const uniq=new Set(),list=trips.filter(t=>{const key=t.line+'|'+t.pass+'|'+t.arrival;if(uniq.has(key))return false;uniq.add(key);return true}).slice(0,6);
 if(!list.length){note('Não há passagem de referência restante para esse trajeto a partir do horário selecionado.');return}
 const label={D:'Circular Direto',I:'Circular Inverso',ER:'Expresso Reitoria',ECT:'Expresso C&T'};
 note('Opções encontradas (chegada mais cedo primeiro). “~” significa horário estimado; não há GPS em tempo real.');
 for(const [i,t] of list.entries()){
  const card=make('article','vdc-future-trip');
  const head=make('div','vdc-future-trip-head');const chip=make('strong','vdc-future-chip',t.line==='ECT'?'C&T':t.line);chip.dataset.line=t.line;
  head.append(chip,make('strong','',label[t.line]+(i===0?' · primeira opção estimada':'')));card.append(head);
  card.append(make('div','vdc-future-trip-times',(t.scheduled?'':'~ ')+hh(t.pass)+' embarque · ~ '+hh(t.arrival)+' chegada'));
  const stopsList=t.route.stops.slice(t.a,t.b+1).map(x=>stops[x[0]]).join(' → ');
  card.append(make('p','vdc-future-trip-route',stopsList));output.append(card);
 }
}
form.addEventListener('submit',e=>{e.preventDefault();render()});
date.addEventListener('change',()=>{date.min=today()});
render();
})();
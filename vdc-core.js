/* Vai de Circular — núcleo único para calendário e estimativas de trajetos. Sem GPS. */
window.VDC_CORE=(()=>{
'use strict';
const data=window.VDC_DATA;
const two=n=>String(n).padStart(2,'0');
const localISO=(d=new Date())=>d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate());
const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const hh=v=>two(Math.floor(v/60)%24)+':'+two(v%60);
const now=()=>new Date().getHours()*60+new Date().getMinutes();
const dateShift=(d,days)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+days,12);return localISO(x)};
const easter=y=>{const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return new Date(y,Math.floor(n/31)-1,n%31+1,12)};
const fixed={'01-01':'Confraternização Universal','01-06':'Santos Reis (Natal)','04-21':'Tiradentes','05-01':'Dia do Trabalhador','09-07':'Independência do Brasil','10-03':'Mártires de Cunhaú e Uruaçu (RN)','10-12':'Nossa Senhora Aparecida','11-02':'Finados','11-15':'Proclamação da República','11-20':'Consciência Negra','11-21':'Nossa Senhora da Apresentação (Natal)','12-25':'Natal'};
function holiday(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;
 if(fixed[iso.slice(5)])return fixed[iso.slice(5)];
 const e=easter(+iso.slice(0,4));
 const moving=[[-48,'Carnaval (ponto facultativo)'],[-47,'Carnaval (ponto facultativo)'],[-2,'Sexta-feira Santa'],[60,'Corpus Christi (feriado municipal em Natal)']];
 for(const [offset,label] of moving)if(dateShift(e,offset)===iso)return label;
 return null;
}
function service(iso=localISO()){
 const d=new Date(iso+'T12:00:00'),day=d.getDay(),h=holiday(iso);
 if(h)return{kind:'holiday',label:'Feriado / data especial',detail:h,message:'A operação do Circular não está confirmada nesta data.'};
 if(day===0)return{kind:'sunday',label:'Domingo',detail:'Sem programação cadastrada',message:'Não há programação de domingo cadastrada.'};
 if(day===6)return{kind:'saturday',label:'Sábado',detail:'Operação não confirmada',message:'A tabela de sábado é histórica e não confirma circulação.'};
 return{kind:'weekday',label:'Dia útil',detail:'Horários de referência',message:'Horários estimados: sujeitos a alterações e sem localização em tempo real.'};
}
function candidates(origin,dest,iso=localISO(),from=now(),limit=10){
 if(!data||service(iso).kind!=='weekday'||!data.stops[origin]||!data.stops[dest]||origin===dest)return[];
 const rows=[];
 for(const r of Object.values(data.routes)){
  if(r.day!=='weekday')continue;
  const arr=(data.schedule[r.terminal]||{})[r.line]||[];
  for(let a=0;a<r.stops.length;a++){
   if(r.stops[a][0]!==origin)continue;
   for(let b=a+1;b<r.stops.length;b++){
    if(r.stops[b][0]!==dest)continue;
    const off=r.stops[a][1],end=r.stops[b][1];
    arr.forEach((t,i)=>{
     const base=minutes(t),pass=base+off,arrival=base+end;
     if(pass<from||pass>=1440||arrival>=1440)return;
     if(r.terminal==='ru'&&(r.line==='D'||r.line==='I')&&i===arr.length-1&&end>(r.line==='D'?15:10))return;
     rows.push({r,line:r.line,pass,wait:pass-from,arrival,a,b,scheduledOrigin:r.originScheduled!==false&&off===0});
    });
   }
  }
 }
 rows.sort((a,b)=>a.arrival-b.arrival||a.pass-b.pass);
 const seen=new Set();
 return rows.filter(x=>{const k=x.line+'|'+x.pass+'|'+x.arrival+'|'+origin+'|'+dest;if(seen.has(k))return false;seen.add(k);return true}).slice(0,limit);
}
function departures(terminal='vd',iso=localISO(),from=now(),limit=4){
 if(service(iso).kind!=='weekday')return[];
 const result=[];
 for(const line of ['D','I','ER','ECT']){
  const arr=(data.schedule[terminal]||{})[line]||[];
  const t=arr.find(x=>minutes(x)>=from);if(t)result.push({line,pass:minutes(t)});
 }
 return result.sort((a,b)=>a.pass-b.pass).slice(0,limit);
}
return{localISO,minutes,hh,now,holiday,service,candidates,departures};
})();
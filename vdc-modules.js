/* Vai de Circular 1.1: módulos independentes. Desative em VDC_FEATURES. */
(()=>{'use strict';
const FLAGS=Object.assign({favorites:true,stopDepartures:true,serviceStatus:true,sharing:true},window.VDC_FEATURES||{});
const data=window.VDC_DATA;if(!data)return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const mount=document.querySelector('#vdc-extras');if(!mount)return;
const now=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const minute=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const fmt=t=>String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
const weekday=()=>{const d=new Date().getDay();return d>0&&d<6};
const saturday=()=>new Date().getDay()===6;
const safeGet=k=>{try{return localStorage.getItem(k)}catch{return null}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const storage='vdc-favorite-stops-1';
let favorites=[];try{const x=JSON.parse(safeGet(storage)||'[]');if(Array.isArray(x))favorites=x.filter(id=>Object.hasOwn(data.stops,id)).slice(0,5)}catch{}
const section=(title,desc)=>{const box=el('section','vdc-module');const h=el('h2','',title);box.append(h);if(desc)box.append(el('p','vdc-module-description',desc));mount.append(box);return box};
const status=FLAGS.serviceStatus?section('Situação da consulta','Avisos sobre a confiabilidade dos horários; não há confirmação em tempo real.'):null;
const updateStatus=()=>{if(!status)return;const d=new Date().getDay();const msg=d===6?'Sábado: operação não confirmada. Tabelas históricas não garantem ônibus em circulação.':d===0?'Domingo: não há programação cadastrada para consulta.':'Dias úteis: horários de referência, sujeitos a atrasos e alterações. Sem GPS em tempo real.';let p=status.querySelector('.vdc-status-text');if(!p){p=el('p','vdc-status-text');status.append(p)}p.textContent=msg;status.dataset.day=d===6?'saturday':d===0?'sunday':'weekday'};
updateStatus();if(status)setInterval(updateStatus,60000);
const quick=(FLAGS.favorites||FLAGS.stopDepartures)?section('Minha parada','Salve até cinco paradas favoritas e consulte passagens estimadas em dias úteis.'):null;
let select=null,favWrap=null,results=null;
if(quick){
 const controls=el('div','vdc-controls');select=el('select','vdc-select');select.setAttribute('aria-label','Selecione uma parada');Object.entries(data.stops).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([id,name])=>{const o=el('option','',name);o.value=id;select.append(o)});
 const selected=safeGet('vdc-stop-selection');select.value=data.stops[selected]?selected:'ru';
 controls.append(select);
 if(FLAGS.favorites){const add=el('button','vdc-action','☆ Favoritar');add.type='button';add.onclick=()=>{const id=select.value;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id].slice(-5);safeSet(storage,JSON.stringify(favorites));renderFavorites();};controls.append(add)}
 quick.append(controls);
 if(FLAGS.favorites){favWrap=el('div','vdc-favorites');quick.append(favWrap)}
 if(FLAGS.stopDepartures){results=el('div','vdc-stop-results');results.setAttribute('aria-live','polite');quick.append(results)}
 select.onchange=()=>{safeSet('vdc-stop-selection',select.value);renderFavorites();renderStop()};
}
function renderFavorites(){
 if(!favWrap)return;favWrap.replaceChildren();
 if(!favorites.length){favWrap.append(el('span','vdc-small','Nenhuma parada favorita.'));return}
 for(const id of favorites){const b=el('button','vdc-favorite', '★ '+data.stops[id]);b.type='button';b.setAttribute('aria-pressed',String(select.value===id));b.onclick=()=>{select.value=id;select.onchange()};favWrap.append(b)}
 const add=quick.querySelector('.vdc-action');if(add)add.textContent=favorites.includes(select.value)?'★ Remover favorito':'☆ Favoritar';
}
function renderStop(){
 if(!results)return;results.replaceChildren();
 if(!weekday()){results.append(el('p','vdc-small',saturday()?'Não exibimos previsões aos sábados, pois a operação não foi confirmada.':'Não há programação de domingo cadastrada.'));return}
 const stop=select.value;const out=[];
 for(const route of Object.values(data.routes)){
  if(route.day!=='weekday')continue;
  const times=(data.schedule[route.terminal]||{})[route.line]||[];
  for(let i=0;i<route.stops.length;i++){
   if(route.stops[i][0]!==stop)continue;
   const offset=route.stops[i][1];
   // Somente a primeira ocorrência no mesmo itinerário para evitar falsas partidas de volta.
   if(route.stops.findIndex(x=>x[0]===stop)!==i)continue;
   for(const t of times){
    const pass=minute(t)+offset;
    if(pass<now()||pass>=1440)continue;
    out.push({line:route.line,pass,scheduled:offset===0&&route.originScheduled!==false,terminal:route.terminal});
   }
  }
 }
 const seen=new Set();const list=out.sort((a,b)=>a.pass-b.pass).filter(x=>{const k=x.line+'-'+x.pass;if(seen.has(k))return false;seen.add(k);return true}).slice(0,5);
 if(!list.length){results.append(el('p','vdc-small','Nenhuma passagem de referência restante para esta parada hoje.'));return}
 results.append(el('p','vdc-small','Próximas referências por esta parada; não representam veículos localizados.'));
 for(const item of list){
  const row=el('div','vdc-passage');const code=el('strong','vdc-line-tag',item.line==='ECT'?'C&T':item.line);code.dataset.line=item.line;
  const title=el('span','',({D:'Direto',I:'Inverso',ER:'Expresso Reitoria',ECT:'Expresso C&T'})[item.line]);
  const time=el('span','vdc-passage-time',(item.scheduled?'':'~ ')+fmt(item.pass));
  row.append(code,title,time);results.append(row);
 }
}
renderFavorites();renderStop();if(results)setInterval(renderStop,60000);
if(FLAGS.sharing){
 const share=section('Compartilhar trajeto','Envie um link que já abre a origem e o destino selecionados.');
 const b=el('button','vdc-action','Compartilhar meu trajeto');b.type='button';
 const feedback=el('p','vdc-small');feedback.setAttribute('aria-live','polite');
 b.onclick=async()=>{
  const o=document.querySelector('#origin')?.value,d=document.querySelector('#dest')?.value;
  if(!data.stops[o]||!data.stops[d]||o===d){feedback.textContent='Selecione dois locais diferentes no planejador.';return}
  const u=new URL(location.href);u.searchParams.set('origem',o);u.searchParams.set('destino',d);u.hash='';
  try{if(navigator.share){await navigator.share({title:'Vai de Circular',url:u.toString()});feedback.textContent='Compartilhamento aberto.';return}}catch(e){if(e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(u.toString());feedback.textContent='Link do trajeto copiado.'}catch{feedback.replaceChildren();const field=el('input','vdc-select');field.value=u.toString();field.readOnly=true;field.setAttribute('aria-label','Link do trajeto');feedback.append(field);field.select()}
 };
 share.append(b,feedback);
 const params=new URLSearchParams(location.search),o=params.get('origem'),d=params.get('destino');
 if(data.stops[o]&&data.stops[d]&&o!==d){const a=document.querySelector('#origin'),z=document.querySelector('#dest');if(a&&z){a.value=o;z.value=d;a.dispatchEvent(new Event('change'));z.dispatchEvent(new Event('change'))}}
}
})();
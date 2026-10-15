/* Vai de Circular 1.1: módulos independentes. Desative em VDC_FEATURES. */
(()=>{'use strict';
const FLAGS=Object.assign({favorites:true,stopDepartures:true,serviceStatus:true,sharing:true},window.VDC_FEATURES||{});
const data=window.VDC_DATA,core=window.VDC_CORE;if(!data||!core)return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const mount=document.querySelector('#vdc-extras');if(!mount)return;
const safeGet=k=>{try{return localStorage.getItem(k)}catch{return null}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const storage='vdc-favorite-stops-1';
let favorites=[];try{const x=JSON.parse(safeGet(storage)||'[]');if(Array.isArray(x))favorites=x.filter(id=>Object.hasOwn(data.stops,id)).slice(0,5)}catch{}
const section=(title,desc)=>{const box=el('section','vdc-module');const h=el('h2','',title);box.append(h);if(desc)box.append(el('p','vdc-module-description',desc));mount.append(box);return box};
const status=FLAGS.serviceStatus?section('Situação da consulta','Avisos sobre a confiabilidade dos horários; não há confirmação em tempo real.'):null;
const updateStatus=()=>{if(!status)return;const d=new Date().getDay();const msg=d===6?'Sábado: operação não confirmada. Tabelas históricas não garantem ônibus em circulação.':d===0?'Domingo: não há programação cadastrada para consulta.':'Dias úteis: horários de referência, sujeitos a atrasos e alterações. Sem GPS em tempo real.';let p=status.querySelector('.vdc-status-text');if(!p){p=el('p','vdc-status-text');status.append(p)}p.textContent=msg;status.dataset.day=d===6?'saturday':d===0?'sunday':'weekday'};
updateStatus();if(status)setInterval(updateStatus,60000);
const quick=(FLAGS.favorites||FLAGS.stopDepartures)?section('Consultar por parada','Consulte passagens estimadas e, se quiser, salve suas paradas mais usadas.'):null;
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
 const isFavorite=favorites.includes(select.value),add=quick.querySelector('.vdc-action');
 if(add){add.textContent=isFavorite?'★ Remover favorito':'☆ Favoritar';add.setAttribute('aria-pressed',String(isFavorite))}
 if(!favorites.length){favWrap.append(el('span','vdc-small','Nenhuma parada favorita.'));return}
 for(const id of favorites){const b=el('button','vdc-favorite', '★ '+data.stops[id]);b.type='button';b.setAttribute('aria-pressed',String(select.value===id));b.onclick=()=>{select.value=id;select.onchange()};favWrap.append(b)}
}
function renderStop(){
 if(!results)return;
 results.replaceChildren();
 const info=core.service(),rows=core.passages(select.value,core.localISO(),core.now(),5);
 if(info.kind!=='weekday'){results.append(el('p','vdc-small',info.detail+'. '+info.message));return}
 if(!rows.length){results.append(el('p','vdc-small','Nenhuma passagem estimada restante hoje para esta parada.'));return}
 results.append(el('p','vdc-small','Próximas passagens de referência, sem GPS em tempo real.'));
 const lineNames={D:'Direto',I:'Inverso',ER:'Expresso Reitoria',ECT:'Expresso C&T'};
 for(const x of rows){
  const row=el('div','vdc-passage'),code=el('strong','vdc-line-tag',x.line==='ECT'?'C&T':x.line);
  code.dataset.line=x.line;
  row.append(code,el('span','',lineNames[x.line]),el('span','vdc-passage-time',(x.scheduledOrigin?'':'~ ')+core.hh(x.pass)));
  results.append(row);
 }
}
renderFavorites();renderStop();if(results)setInterval(renderStop,60000);
if(FLAGS.sharing){
 const share=section('Compartilhar trajeto','Envie um link que abre a consulta principal com origem e destino já selecionados.');
 const fields=el('div','vdc-share-fields'),a=el('select','vdc-select'),b=el('select','vdc-select');
 for(const [key,name] of Object.entries(data.stops).sort((x,y)=>x[1].localeCompare(y[1],'pt-BR'))){
  for(const sel of [a,b]){const opt=el('option','',name);opt.value=key;sel.append(opt)}
 }
 a.value=data.stops[safeGet('vdc-origin')]?safeGet('vdc-origin'):'ru';
 b.value=data.stops[safeGet('vdc-dest')]?safeGet('vdc-dest'):'rei';
 const field=(label,control)=>{const box=el('label','vdc-share-field');box.append(el('span','',label),control);return box};
 fields.append(field('De onde',a),field('Para onde',b));
 const button=el('button','vdc-action','Compartilhar trajeto');button.type='button';
 const feedback=el('p','vdc-small');feedback.setAttribute('aria-live','polite');
 const shareUrl=()=>{const url=new URL('./',location.href);url.searchParams.set('origem',a.value);url.searchParams.set('destino',b.value);return url.toString()};
 const actions=el('div','vdc-share-actions');
 const whatsapp=el('a','vdc-whatsapp','Enviar no WhatsApp');
 whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';
 const updateWhatsApp=()=>{
  const valid=a.value!==b.value;
  whatsapp.href=valid?'https://wa.me/?text='+encodeURIComponent('Veja este trajeto no Vai de Circular: '+shareUrl()):'#';
  whatsapp.setAttribute('aria-disabled',String(!valid));whatsapp.tabIndex=valid?0:-1;
 };
 a.addEventListener('change',updateWhatsApp);b.addEventListener('change',updateWhatsApp);
 whatsapp.onclick=e=>{if(a.value===b.value){e.preventDefault();feedback.textContent='Escolha origem e destino diferentes.'}};
 actions.append(button,whatsapp);updateWhatsApp();
 button.onclick=async()=>{
  if(a.value===b.value){feedback.textContent='Escolha origem e destino diferentes.';return}
  const url=shareUrl();
  try{if(navigator.share){await navigator.share({title:'Vai de Circular',url});feedback.textContent='Opções de compartilhamento abertas.';return}}catch(e){if(e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(url);feedback.textContent='Link copiado.'}
  catch{feedback.replaceChildren();const input=el('input','vdc-select');input.value=url;input.readOnly=true;input.setAttribute('aria-label','Link para copiar');feedback.append(input);input.select()}
 };
 share.append(fields,actions,feedback);
}
})();
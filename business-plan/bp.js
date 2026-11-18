(function(){
 const fmt=n=>Math.round(n).toLocaleString('fr-BE').replace(/\u202f|\u00a0/g,' ');
 // Budget data (€ HTVA, research 18/11/2026, recalculated for 120 g)
 const postes=[
  {k:'Matériel de production',s:'four, froid, mélangeur, doseuse',bas:[11600,24800],haut:[45500,78800]},
  {k:'Local et aménagement',s:'3 mois de loyer, caution, travaux',bas:[9000,26000],haut:[32500,92500]},
  {k:'Emballages',s:'premier stock sachets + boîtes',bas:[350,1400],haut:[1500,6000],chg:'format à vérifier'},
  {k:'Matière première',s:'1er mois, recalculé 120 g',bas:[1300,2700],haut:[4300,8700],chg:'recalculé'},
  {k:'Site et configurateur',s:'boutique ou sur mesure',bas:[2350,6500],haut:[13400,27000]},
  {k:'Logistique',s:'caisses isothermes ou utilitaire frigo',bas:[400,1500],haut:[12400,35800],chg:'caisses à vérifier'},
  {k:'Coûts fixes initiaux',s:'SRL, AFSCA, assurances, analyses, marque',bas:[5900,16200],haut:[13400,33200]},
  {k:'Codes GS1',s:'pack de 10 codes',bas:[60,60],haut:[60,60]}
 ];
 const sc={
  bas:{tot:'≈ 31 000 – 79 000 €',old:'Version 90 g : 31 000 – 78 000 €',d:'<b>Démarrage artisanal.</b> 500 boulettes par semaine (<span class="hyp">Hypothèse</span>), 2 jours de production, local de 60 à 80 m², matériel d\'occasion ou entrée de gamme, livraison locale sans camion frigo.'},
  haut:{tot:'≈ 123 000 – 282 000 €',old:'Version 90 g : 122 000 – 280 000 €. Sans IFS ni réserve commerciale.',d:'<b>Atelier équipé neuf, toujours en solo.</b> 1 500 boulettes par semaine (<span class="hyp">Hypothèse</span>), 120 à 180 m², chambre froide, portionneuse, configurateur sur mesure, utilitaire frigo d\'occasion.'}
 };
 const chart=document.getElementById('chart');
 function draw(name){
  const max=name==='bas'?30000:100000;
  chart.innerHTML='';
  postes.forEach(p=>{
   const [a,b]=p[name];
   const r=document.createElement('div');r.className='crow'+(p.chg?' chg':'');
   r.innerHTML=`<div class="cl">${p.k}<small>${p.s}${p.chg?' · <b>'+p.chg+'</b>':''}</small></div><div class="ctrack"><i class="cmax"></i><i class="cmin"></i><span class="cval">${fmt(a)}${a!==b?' – '+fmt(b):''} €</span></div>`;
   chart.appendChild(r);
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const wa=Math.max(1,a/max*100),wb=Math.min(100,b/max*100);
    r.querySelector('.cmin').style.width=wa+'%';r.querySelector('.cmax').style.width=wb+'%';
    const v=r.querySelector('.cval');
    v.style.left=`calc(${Math.min(wb,68)}% + 6px)`;
   }));
  });
  const ax=document.createElement('div');ax.className='crow';ax.innerHTML=`<div></div><div class="small" style="display:flex;justify-content:space-between"><span>0</span><span>${fmt(max/2)} €</span><span>${fmt(max)} €</span></div>`;chart.appendChild(ax);
  document.getElementById('tot').textContent=sc[name].tot;
  document.getElementById('tot-old').textContent=sc[name].old;
  document.getElementById('sc-desc').innerHTML=sc[name].d;
  document.getElementById('ifs-card').style.opacity=name==='haut'?1:.55;
 }
 document.querySelectorAll('.switch button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.switch button').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-selected','false')});
  b.classList.add('on');b.setAttribute('aria-selected','true');draw(b.dataset.sc);
 }));
 draw('bas');

 // Trend bars (VLAM)
 const trend=[
  {k:'Plats cuisinés à base de viande',v:[['2016',3.1],['2024',3.9],['2025',4.0]]},
  {k:'Préparations de viande (ragoût, vol-au-vent…)',v:[['2016',1.1],['2024',1.7],['2025',1.7]]}
 ];
 const tb=document.getElementById('trend');
 const cols=['#ffc83d','#ff8a1f','#e8392a'];
 trend.forEach(t=>{
  const row=document.createElement('div');row.className='brow';
  row.innerHTML=`<div><b>${t.k}</b></div><div class="btrack">${t.v.map((x,i)=>`<div class="bar-i" title="${x[0]}"><i data-w="${x[1]/4.5*100}" style="background:${cols[i]}"></i><em>${x[0]} · ${String(x[1]).replace('.',',')} kg</em></div>`).join('')}</div>`;
  tb.appendChild(row);
 });

 // Process flow
 const flow=[
  ['Réception','contrôle T°, traçabilité','raw',1],['Garnitures et sauces','préparation','raw',0],['Pesée et dosage','balance 1 g, doseuse','raw',0],
  ['Mélange','mélangeur mécanique','raw',0],['Roulage main','120 g crus','raw',0],['Cuisson four','70 °C à cœur, 2 min','cooked',1],
  ['Sauces en marmite','carte courte','cooked',0],['Refroidissement','60 → 10 °C en 2 h max.','cooked',1],['Sous vide','avec ou sans sauce','cooked',1],
  ['Étiquetage','DLC, allergènes, lot','cooked',0],['Boîte carton','étui imprimé','cooked',0],['Frais ou surgelé','choix entreprise','cooked',0],['Expédition','livraison, retrait, magasin','cooked',0]
 ];
 const fl=document.getElementById('flow');
 flow.forEach((f,i)=>{const d=document.createElement('div');d.className='fstep '+f[2]+(f[3]?' ccp':'');d.innerHTML=`<span class="n">ÉTAPE ${i+1}</span><b>${f[0]}</b><small>${f[1]}</small>`;fl.appendChild(d)});
 const lg=document.createElement('div');lg.className='flow-legend';lg.innerHTML='<span>🟧 zone crue</span><span>🟩 zone cuite</span><span>🟥 point critique (CCP)</span>';fl.after(lg);

 // Simulator (illustrative only)
 const px=document.getElementById('px'),vol=document.getElementById('vol'),vo=document.getElementById('volo');
 function sim(){vo.textContent=vol.value;const p=parseFloat(String(px.value).replace(',','.'));
  if(!(p>0)){document.getElementById('ca-m').textContent='—';document.getElementById('ca-y').textContent='—';return}
  const m=p*vol.value*4.33;document.getElementById('ca-m').textContent=fmt(m)+' €';document.getElementById('ca-y').textContent=fmt(m*12)+' €';}
 px.addEventListener('input',sim);vol.addEventListener('input',sim);

 // Reveal + counters + bars
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('in');
   el.querySelectorAll('[data-w]').forEach(i=>i.style.width=i.dataset.w+'%');
   el.querySelectorAll('[data-count]').forEach(c=>{const t=parseFloat(c.dataset.count),dec=+c.dataset.dec||0,t0=performance.now();
    (function step(n){const k=Math.min(1,(n-t0)/1000);c.textContent=(t*(1-Math.pow(1-k,3))).toFixed(dec).replace('.',',');if(k<1)requestAnimationFrame(step)})(t0)});
   io.unobserve(el)}),{threshold:.12});
 document.querySelectorAll('.reveal,.hero-txt').forEach(el=>io.observe(el));
 window.addEventListener('beforeprint',()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));document.querySelectorAll('[data-w]').forEach(i=>i.style.width=i.dataset.w+'%');document.querySelectorAll('details').forEach(d=>d.open=true)});

 // Progress + active TOC
 const prog=document.getElementById('prog'),links=[...document.querySelectorAll('.toc a')];
 const secs=links.map(a=>document.querySelector(a.getAttribute('href')));
 function onScroll(){const h=document.documentElement;prog.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  let cur=0;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<140)cur=i});links.forEach((a,i)=>a.classList.toggle('on',i===cur));
  const on=links[cur];if(on&&cur!==window.__c&&(window.__c=cur,1)&&on.parentElement.scrollWidth>on.parentElement.clientWidth){on.parentElement.scrollTo({left:on.offsetLeft-on.parentElement.offsetLeft-40,behavior:'smooth'})}}
 let tk=false;window.addEventListener('scroll',()=>{if(!tk){tk=true;requestAnimationFrame(()=>{onScroll();tk=false})}},{passive:true});onScroll();
})();

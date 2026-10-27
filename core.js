/* ===== CORE: leitura da base título a título + cálculos (mesma regra da planilha) ===== */
const Core=(function(){
  const U=s=>String(s==null?"":s).trim().toUpperCase();
  const nrm=s=>String(s==null?"":s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const toNum=x=>{if(typeof x==="number")return x;if(x==null||x==="")return 0;let s=String(x).trim();if(/,\d{1,2}$/.test(s))s=s.replace(/\./g,"").replace(",",".");const n=parseFloat(s.replace(/[^\d.\-]/g,""));return isFinite(n)?n:0};
  const toInt=x=>{const n=typeof x==="number"?x:parseInt(String(x==null?"":x).replace(/\D/g,""),10);return isFinite(n)&&n>0?Math.round(n):0};
  const toSerial=x=>{if(typeof x==="number")return x;if(x instanceof Date&&!isNaN(x))return Math.round((Date.UTC(x.getFullYear(),x.getMonth(),x.getDate())-Date.UTC(1899,11,30))/864e5)+(x.getHours()*3600+x.getMinutes()*60)/86400;let m=String(x==null?"":x).match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return Math.round((Date.UTC(+m[1],+m[2]-1,+m[3])-Date.UTC(1899,11,30))/864e5);m=String(x==null?"":x).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(!m)return 0;return Math.round((Date.UTC(+m[3],+m[2]-1,+m[1])-Date.UTC(1899,11,30))/864e5)};
  const isoSerial=iso=>{const[y,m,d]=iso.split("-").map(Number);return Math.round((Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/864e5)};
  const serialISO=s=>{const d=new Date(Date.UTC(1899,11,30)+Math.floor(s)*864e5);return d.toISOString().slice(0,10)};
  function pzDays(x){if(typeof x==="number")return x;const t=String(x==null?"":x);const d=t.match(/(\d+)\s*dias?/i),h=t.match(/(\d+)\s*horas?/i);if(!d&&!h)return null;return(d?+d[1]:0)+(h?+h[1]/24:0)}
  const ROTULOS=["7 - BOLETO ESPECIAL - PRÉ IMPRESSO","22 - ESTRUTURADA CONTRATO","36 - SB PAGAHOJE - FATURIZADO","39 - COBRANÇA SIMPLES","40 - GARANTIA","43 - FATURIZADO- SEM REGRESSO","45 - SB PAGAHOJE - PLATAFORMA","46 - SB PAGAHOJE - PLATAFORMA SEM BOLETO","47 - COBRANÇA SIMPLES - PRE IMPRESSO","49 - ESTRUTURADA NF - PLATAFORMA","57 - FATURIZADO - COM REGRESSO","58 - COBRANÇA SIMPLES - SEM REGRESSO","60 - CONVENCIONAL KOMLOG - SEM REGRESSO","62 - GARANTIA - PRÉ-IMPRESSO","63 - FATURIZADO - COM REGRESSO - PRÉ-IMPRESSO","65 - CONTA ESCROW","69 - BOLETO ESCROW ARTTA","70 - GARANTIA ESPECIAL PRE IMPRESSO"];
  const ROTBY=new Map(ROTULOS.map(x=>[x.split("-")[0].trim(),x]));
  function canonRot(x){x=String(x==null?"":x).replace(/\s+/g," ").trim();if(!x)return"";const c=(x.match(/^(\d+)\s*-/)||[])[1];return(c&&ROTBY.get(c))||x}
  function findHeader(aoa,must){for(let r=0;r<Math.min(15,aoa.length);r++){const H=(aoa[r]||[]).map(nrm);if(must.every(m=>H.includes(nrm(m))))return r}return -1}

  /* base compacta: row = [titulo, cod, valor, motIdx, sacIdx, aditivo, dtaEnt, seuNum, rotIdx, saida, emissao, prazoEst, km, prazoNF(1 fora/0 dentro), diasEntrega, destIdx, monitorada(1/0)] */
  function parseBase(aoa){
    const hr=findHeader(aoa,["Cod. Cedente","Vlr. Aberto"]);if(hr<0)return null;
    const H=aoa[hr].map(nrm),ix=n=>H.indexOf(nrm(n));
    const c={k:ix("Título"),cod:ix("Cod. Cedente"),ced:ix("Cedente"),v:ix("Vlr. Aberto"),m:ix("Motivo Entrega"),sac:ix("Sacado"),ad:ix("Aditivo"),de:ix("Dta. Ent."),sn:ix("Seu Número"),rg:ix("Regional"),rot:ix("Rótulo"),sa:ix("Saída"),em:ix("Emissão NFe"),pz:ix("Prazo Estimado"),km:ix("KM"),pnf:ix("Prazo NF"),dent:ix("Dias Entrega"),ufC:ix("UF"),cidC:ix("Cidade"),ufS:H.lastIndexOf(nrm("UF")),cidS:H.lastIndexOf(nrm("Cidade")),mon:ix("Monitorada")};
    if(c.m<0)throw new Error("A base não tem a coluna Motivo Entrega.");
    const mot=[],motI=new Map(),sac=[],sacI=new Map(),rot=[],rotI=new Map(),dst=[],dstI=new Map(),org={},ced={},rows=[],seen=new Map(),regs={};
    const city=(ci,uf)=>{const a=String(ci==null?"":ci).trim().toUpperCase(),b=String(uf==null?"":uf).trim().toUpperCase();return a||b?a+(b?"/"+b:""):""};
    const idx=(arr,map,s)=>{s=String(s==null?"":s).trim();let i=map.get(s);if(i===undefined){i=arr.length;arr.push(s);map.set(s,i)}return i};
    for(let r=hr+1;r<aoa.length;r++){const row=aoa[r];if(!row)continue;const cod=toInt(row[c.cod]);if(!cod)continue;
      let k=c.k>=0&&row[c.k]!=null?String(row[c.k]).trim():"";if(!k)k=(c.sn>=0?String(row[c.sn]==null?"":row[c.sn]).trim():"")+"|"+cod;
      const n=seen.get(k)||0;seen.set(k,n+1);if(n)k+="#"+(n+1);
      if(c.ced>=0&&!ced[cod])ced[cod]=String(row[c.ced]==null?"":row[c.ced]).trim();
      if(c.cidC>=0&&!org[cod])org[cod]=city(row[c.cidC],row[c.ufC]);
      const pnfT=c.pnf>=0?nrm(row[c.pnf]):"";if(c.rg>=0&&row[c.rg])regs[row[c.rg]]=(regs[row[c.rg]]||0)+1;
      const num=i=>i>=0&&typeof row[i]==="number"?row[i]:null;
      rows.push([k,cod,toNum(row[c.v]),idx(mot,motI,c.m>=0?row[c.m]:""),idx(sac,sacI,c.sac>=0?row[c.sac]:""),c.ad>=0?String(row[c.ad]==null?"":row[c.ad]).trim():"",c.de>=0?toSerial(row[c.de]):0,c.sn>=0?String(row[c.sn]==null?"":row[c.sn]).trim():"",idx(rot,rotI,c.rot>=0?canonRot(row[c.rot]):""),c.sa>=0?toSerial(row[c.sa]):0,c.em>=0?toSerial(row[c.em]):0,c.pz>=0?pzDays(row[c.pz]):null,num(c.km),pnfT==="fora"?1:(pnfT==="dentro"?0:null),num(c.dent),c.cidS>=0&&c.cidS!==c.cidC?idx(dst,dstI,city(row[c.cidS],row[c.ufS])):null,c.mon>=0?(U(row[c.mon])==="S"?1:0):null]);
    }
    const rg=Object.entries(regs).sort((a,b)=>b[1]-a[1])[0];
    return{rows,mot,sac,rot,dst,org,ced,regional:rg?rg[0]:""};
  }

  /* classificação dos motivos: classe única (para movimento) + multiplicidade (para o índice, como o SUMPRODUCT da planilha) */
  function motInfo(b,cfg){
    const cnt=(m,l)=>{const u=U(m);if(!u)return 0;let k=0;(l||[]).forEach(p=>{const q=U(p);if(q&&u.startsWith(q))k++});return k};
    return b.mot.map(m=>{const kc=cnt(m,cfg.motivosConf),k99=cnt(m,cfg.motivosC99),kna=cnt(m,cfg.motivosNA),knc=cnt(m,cfg.motivosNC);
      return{kc,k99,kna,knc,cls:kc?0:k99?1:kna?2:knc?3:4}});
  }
  const NOACT=/nao atuar|nao checar|sem checagem|nao (realizar|fazer|efetuar) checagem|(dispensad|isent)[oa] de checagem/;
  const naoAtuar=t=>NOACT.test(nrm(t||""));
  function prazoCk(t){
    if(!t)return null;const s=String(t).replace(/\s+/g," ");let m=null;
    for(const re of[/(?:confirma\w*|checagem(?!\s*:)|checar|aceite)[^.;:]{0,60}?\bD\s*\+\s*(\d{1,2})\b/gi,/\bD\s*\+\s*(\d{1,2})\b[^.;:]{0,30}(?:confirma|aceite|checagem)/gi,/(?:confirmad\w*|canhoto)[^.;:]{0,40}?em até (\d{1,2}) dias/gi]){
      for(const x of s.matchAll(re)){if(/notifica|pagamento|repasse|vencid|cart[oó]rio|ap[oó]s/i.test(x[0]))continue;m=x;break}if(m)break}
    if(!m)return null;const n=+m[1];return n>=0&&n<=60?{n,txt:m[0].trim()}:null;
  }
  function pistas(texto,chec){
    const z=String(texto||"");if(!z||(z.length<80&&/SEM CARACTER/i.test(z)))return"";
    const p=[];if(naoAtuar(z))p.push("NÃO atuar na checagem");
    if(/aceite/i.test(z))p.push("Cita aceite");if(/e-mail/i.test(z))p.push("Cita e-mail");if(/portal/i.test(z))p.push("Cita portal");
    const i=z.indexOf("D+");if(i>=0){const mm=z.slice(i+2,i+4).match(/^\d{1,2}/);p.push("Prazo D+"+(mm?String(+mm[0]):""))}
    if(/canhoto/i.test(z))p.push("Cita canhoto");if(/não realizar ligaç|não ligar/i.test(z))p.push("NÃO ligar ao sacado");
    if(/% da carteira|mínima da carteira/i.test(chec||""))p.push("% próprio de checagem");
    return p.length?p.join("  ·  "):"Sem pista (ver cadastro)";
  }
  function checagem(texto){
    const z=String(texto||"").replace(/[\r\n]+/g," ");const i=z.indexOf("CHECAGEM:");if(i<0)return"";const st=i+9;let end=z.length;
    ["GARANTIAS FORMALIZADAS:","JURIDICO:","JURÍDICO:","MONITORAMENTO:","TESOURARIA:","COBRANÇA:","OPERAÇÃO:"].forEach(t=>{const j=z.indexOf(t,st);if(j>=0&&j<end)end=j});
    return z.slice(st,end).replace(/\s{2,}/g," ").trim();
  }
  const CATS=[["Evento Sefaz / MDF",/sefaz|mdf|registro de passagem|destinat/],["Aceite",/aceite/],["Telefone",/telefone/],["E-mail / WhatsApp",/e-?mail|whatsapp/],["Portal",/portal|progredir|prefeitura/],["Canhoto",/canhoto/],["Transportadora",/transportadora/],["Liquidez / pagamento",/liquidez|parcela/],["Conforme característica",/caracter/],["Serviço / contrato",/servi|contrato|ds transporte|notas validadas/]];
  const confCat=m=>{const t=nrm(m);for(const[n,re]of CATS)if(re.test(t))return n;return"Outros"};
  function riscoDe(cod,ref){const r=ref.risco[String(cod)];return r==="Alto"||r==="Médio"||r==="Baixo"?r:"Sem risco"}
  function metaDe(cod,risco,ref){const c=ref.cfg,me=c.metasEspeciais&&c.metasEspeciais[String(cod)];
    if(me&&me.meta)return{meta:+me.meta,origem:"Característica",esp:me};
    return risco==="Alto"?{meta:c.metaAlto,origem:"Risco Alto"}:risco==="Médio"?{meta:c.metaMedio,origem:"Risco Médio"}:risco==="Baixo"?{meta:c.metaBaixo,origem:"Risco Baixo"}:{meta:c.metaPadrao,origem:"Padrão (sem risco)"}}
  const r6=x=>Math.round(x*1e6)/1e6,r2=x=>Math.round(x*100)/100;
  function statusConf(ind,meta,margem){if(ind==null)return"Sem dados";if(r6(ind)<r6(meta))return"Abaixo";if(r6(ind)<r6(Math.min(1,meta+margem)))return"Atenção";return"OK"}
  function diaSugerido(cod,risco){const par=(+cod)%2===0;return risco==="Alto"?"Diário":risco==="Baixo"?(par?"Quarta":"Quinta"):(par?"Segunda":"Terça")}
  const nivel=t=>t>=30?"A":t>=5?"B":"C";
  const Z=()=>[0,0],ad=(o,v)=>{o[0]++;o[1]+=v};

  /* movimento título a título entre duas bases */
  function movimento(bD,bP,cfg,carD,list){
    const mD=motInfo(bD,cfg),mP=motInfo(bP,cfg),cD=bD.rows.map(r=>mD[r[3]].cls),cP=bP.rows.map(r=>mP[r[3]].cls);
    const posP=new Map();bP.rows.forEach((r,j)=>posP.set(r[0],j));
    const carPos=carD?new Map(carD.rows.map((r,i)=>[r[0],i])):null,carCls=carD?(()=>{const mi=motInfo(carD,cfg);return carD.rows.map(r=>mi[r[3]].cls)})():null;
    const M=new Map(),L=list?[]:null;
    const g=cod=>{let o=M.get(cod);if(!o){o={ent:Z(),entConf:Z(),liq:Z(),liqSem:Z(),conf:Z(),res:Z(),perd:Z(),prob:Z(),npend:Z(),sconf:Z(),sfica:Z()};M.set(cod,o)}return o};
    const seen=new Set();
    bD.rows.forEach((r,i)=>{const j=posP.get(r[0]);const o=g(r[1]);
      if(j===undefined){ad(o.ent,r[2]);if(cD[i]===0)ad(o.entConf,r[2]);if(L)L.push({t:"ent",b:"D",i});return}
      seen.add(j);const a=cP[j],b=cD[i];
      if(a!==0&&b===0){ad(o.conf,r[2]);if(a>=1&&a<=3)ad(o.res,r[2]);if(L)L.push({t:"conf",b:"D",i,de:a})}
      else if(a===0&&b!==0){ad(o.perd,r[2]);if(L)L.push({t:"perd",b:"D",i})}
      if(b===1&&a!==1){ad(o.prob,r[2]);if(L)L.push({t:"prob",b:"D",i})}
      if((b===2||b===3)&&a!==2&&a!==3){ad(o.npend,r[2]);if(L)L.push({t:"npend",b:"D",i})}
    });
    bP.rows.forEach((r,j)=>{if(seen.has(j))return;const o=g(r[1]);
      if(carPos){const ci=carPos.get(r[0]);if(ci!==undefined&&carCls[ci]===0){ad(o.sconf,r[2]);ad(o.conf,r[2]);if(L)L.push({t:"sconf",b:"P",i:j});return}if(ci!==undefined){ad(o.sfica,r[2]);if(L)L.push({t:"sfica",b:"P",i:j})}}
      ad(o.liq,r[2]);if(cP[j]!==0)ad(o.liqSem,r[2]);if(L)L.push({t:"liq",b:"P",i:j,sem:cP[j]!==0})});
    return{M,L,cD,cP};
  }

  /* linhas por cedente para a posição do dia */
  function calcular(car,tra,ref,opt){
    opt=opt||{};const cfg=ref.cfg,carac=ref.carac||{},anot=ref.anot||{};const base=opt.date?isoSerial(opt.date):null;
    const A={},T={};
    const agg=(b,out,filtroMon)=>{if(!b)return;const mi=motInfo(b,cfg);
      b.rows.forEach(r=>{if(filtroMon&&cfg.soMonitorados&&r[16]!==1)return;const k=String(r[1]);const m=mi[r[3]],v=r[2];
        const o=out[k]||(out[k]={cod:k,nome:b.ced[r[1]]||"",tit:0,titConf:0,valor:0,vconf:0,vc99:0,vna:0,vnc:0,motivos:{},rot:{},sem:Z(),c99q:Z(),ncq:Z(),siq:Z(),atr:Z(),atrMax:0,fora:Z(),ent:{kq:0,ks:0,pq:0,ps:0,dq:0,ds:0,dOk:0,dLate:0,dLateS:0,dest:new Set(),orig:b.org&&b.org[r[1]]||""},age:{n:0,s:0,o30:0,o30v:0},sacs:new Map(),rows:[]});
        o.tit++;o.valor+=v;if(m.kc){o.titConf+=m.kc;o.vconf+=v*m.kc}o.vc99+=v*m.k99;o.vna+=v*m.kna;o.vnc+=v*m.knc;
        const mk=String(b.mot[r[3]]||"(sem motivo)").slice(0,90);const mm=o.motivos[mk]||(o.motivos[mk]={q:0,v:0});mm.q++;mm.v+=v;
        const rn=b.rot[r[8]]||"(sem rótulo)";const ro=o.rot[rn]||(o.rot[rn]=[0,0,0,0,0,0]);ro[0]++;ro[1]+=v;ro[2]+=v*m.kc;ro[3]+=v*m.k99;ro[4]+=v*m.kna;ro[5]+=v*m.knc;
        const sn=b.sac[r[4]]||"(sem nome)";o.sacs.set(sn,(o.sacs.get(sn)||0)+v);
        const cl=m.cls,s0=r[9]||r[10];
        if(cl!==0){ad(o.sem,v);if(cl===1)ad(o.c99q,v);else if(cl===3)ad(o.ncq,v);else ad(o.siq,v);
          if(cl===3&&(r[13]===1||(r[14]!=null&&r[14]<0))){ad(o.atr,v);const d=r[14]!=null&&r[14]<0?-r[14]:(s0&&r[11]!=null&&base?Math.max(0,Math.floor(base-(s0+r[11]))):null);if(d!=null&&d>o.atrMax)o.atrMax=d}
          if(cl!==1&&base){const p=prazoCk(carac[k]);if(p&&s0&&base-s0>p.n)ad(o.fora,v)}
          if(base&&r[10]){const x=base-r[10];if(x>=0){o.age.n++;o.age.s+=x;if(x>30){o.age.o30++;o.age.o30v+=v}}}}
        const E=o.ent;if(r[12]!=null){E.kq++;E.ks+=r[12]}if(r[11]!=null){E.pq++;E.ps+=r[11]}if(b.dst&&r[15]!=null&&b.dst[r[15]])E.dest.add(b.dst[r[15]]);
        if(cl===0&&r[6]&&s0&&r[11]!=null){const real=r[6]-s0;if(real>=0&&real<=120){E.dq++;E.ds+=real;const late=real-r[11];if(late<=1)E.dOk++;else{E.dLate++;E.dLateS+=late}}}
      })};
    agg(car,A,true);agg(tra,T,false);
    const mov=opt.prevCar&&car?movimento(car,opt.prevCar,cfg,null,false).M:null;
    const movT=opt.prevTra&&tra?movimento(tra,opt.prevTra,cfg,car,false).M:null;
    const cods=[...new Set([...Object.keys(A),...Object.keys(T)])].sort((a,b)=>(+a)-(+b));
    return cods.map(cod=>{
      const a=A[cod],t=T[cod];const risco=riscoDe(cod,ref),mi=metaDe(cod,risco,ref);
      const L={cod,nome:(a&&a.nome)||(t&&t.nome)||"",risco,meta:mi.meta,origemMeta:mi.origem,naCarteira:!!a,naTranche:!!t};
      const an=anot[cod]||{};L.dia=an.dia||diaSugerido(cod,risco);
      L.naoAtuar=!mi.esp&&naoAtuar(carac[cod]);const pz=prazoCk(carac[cod]);L.pz=pz?pz.n:null;L.pzTxt=pz?pz.txt:"";
      if(a){
        L.tit=a.tit;L.titConf=a.titConf;L.valor=r2(a.valor);L.vconf=r2(a.vconf);L.ind=a.valor>0?a.vconf/a.valor:null;
        L.c99=a.valor>0?a.vc99/a.valor:null;L.na=a.valor>0?a.vna/a.valor:null;L.nc=a.valor>0?a.vnc/a.valor:null;
        L.nivel=nivel(a.tit);L.status=statusConf(L.ind,mi.meta,cfg.margem);L.faltam=L.ind==null?null:Math.max(0,r2(mi.meta*a.valor-a.vconf));
        if(L.naoAtuar){L.statusPlanilha=L.status;L.status="Não atuar";L.faltam=0}
        L.motivos=Object.fromEntries(Object.entries(a.motivos).sort((x,y)=>y[1].v-x[1].v).slice(0,25).map(([k,v])=>[k,{q:v.q,v:r2(v.v)}]));
        L.rotulos=Object.keys(a.rot).filter(x=>x!=="(sem rótulo)").slice(0,5);
        L.rot=Object.fromEntries(Object.entries(a.rot).map(([k,v])=>[k,v.map((x,i)=>i?r2(x):x)]));
        L.sem=[a.sem[0],r2(a.sem[1])];L.c99q=[a.c99q[0],r2(a.c99q[1])];L.ncq=[a.ncq[0],r2(a.ncq[1])];L.siq=[a.siq[0],r2(a.siq[1])];
        L.atr=[a.atr[0],r2(a.atr[1])];L.atrMax=a.atrMax;L.fora=[a.fora[0],r2(a.fora[1])];
        const E=a.ent;L.ent={km:E.kq?Math.round(E.ks/E.kq):null,pz:E.pq?Math.round(E.ps/E.pq*10)/10:null,dq:E.dq,real:E.dq?Math.round(E.ds/E.dq*10)/10:null,ok:E.dq?E.dOk/E.dq:null,late:E.dLate,lateAvg:E.dLate?Math.round(E.dLateS/E.dLate*10)/10:null,dest:E.dest.size,orig:E.orig};
        L.age={n:a.age.n,avg:a.age.n?Math.round(a.age.s/a.age.n*10)/10:null,o30:a.age.o30,o30v:r2(a.age.o30v)};
        const sc=[...a.sacs].sort((x,y)=>y[1]-x[1]);L.sac={n:sc.length,top:sc.slice(0,3).map(([n,v])=>[n,r2(v)])};
        if(mov){const m=mov.get(+cod)||mov.get(cod);L.mov=m?Object.fromEntries(Object.entries(m).filter(([k])=>!["sconf","sfica"].includes(k)).map(([k,v])=>[k,[v[0],r2(v[1])]])):null}
      }else L.status="Sem dados";
      if(t){
        const lim=ref.lim[cod];const temLim=lim&&lim.limite!==""&&lim.limite!=null&&!isNaN(+lim.limite);
        const pr=cfg.metasTranchePropria&&cfg.metasTranchePropria[cod];
        const mu=pr&&pr.meta?+pr.meta:risco==="Alto"?cfg.trAlto:risco==="Médio"?cfg.trMedio:risco==="Baixo"?cfg.trBaixo:cfg.trSem;
        const I=r2(t.valor),J=temLim?+lim.limite:null;
        L.tr={tit:t.tit,valor:I,limite:J,fundo:lim?lim.fundo:"",metaUso:mu,aviso:pr?pr.aviso||"":"",
          pct:J==null?null:J>0?I/J:(I>0?"Limite zero":0),teto:J==null?null:r2(J*mu),excesso:J==null?null:Math.max(0,r2(I-J)),
          reduzir:J==null?null:Math.max(0,r2(I-r2(J*mu))),folga:J==null?null:Math.max(0,r2(J-I)),
          ind:t.valor>0?t.vconf/t.valor:null,c99:t.valor>0?t.vc99/t.valor:null,na:t.valor>0?t.vna/t.valor:null,nc:t.valor>0?t.vnc/t.valor:null};
        L.tr.status=J==null?"Sem limite":r2(I)>r2(J)?"EXCESSO":r2(I)>r2(L.tr.teto)?"Acima da meta":"OK";
        L.tr.statusConf=statusConf(L.tr.ind,mi.meta,cfg.margem);
        const ts=[...t.sacs].sort((x,y)=>y[1]-x[1]);L.tr.top=ts[0]?[ts[0][0],r2(ts[0][1])]:null;
        if(movT){const m=movT.get(+cod)||movT.get(cod);L.tr.mov=m?{ent:m.ent,sconf:m.sconf,sfica:m.sfica,liq:m.liq}:null}
      }
      return L;
    });
  }
  /* valores da linha restritos a alguns rótulos */
  function porRotulo(L,rots,cfg){
    if(!rots||!rots.length||!L.naCarteira)return L;let q=0,v=0,cv=0,c9=0,na=0,nc=0;
    rots.forEach(r=>{const x=L.rot&&L.rot[r];if(x){q+=x[0];v+=x[1];cv+=x[2];c9+=x[3];na+=x[4];nc+=x[5]}});
    if(!q)return null;const ind=v>0?cv/v:null;
    const o={...L,tit:q,valor:v,vconf:cv,ind,c99:v?c9/v:null,na:v?na/v:null,nc:v?nc/v:null,filtrado:true};
    o.status=L.naoAtuar?"Não atuar":statusConf(ind,L.meta,cfg.margem);o.faltam=L.naoAtuar||ind==null?0:Math.max(0,r2(L.meta*v-cv));return o;
  }
  return{U,nrm,toNum,toInt,toSerial,isoSerial,serialISO,pzDays,canonRot,findHeader,parseBase,motInfo,movimento,calcular,porRotulo,prazoCk,pistas,checagem,naoAtuar,confCat,riscoDe,metaDe,statusConf,diaSugerido,nivel};
})();
if(typeof module!=="undefined")module.exports=Core;

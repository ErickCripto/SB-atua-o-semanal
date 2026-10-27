/* ===== MOTOR DE CÁLCULO (mesma lógica da planilha Controle de Carteiras) ===== */
const Engine=(function(){
  const norm=s=>String(s==null?"":s).trim().toUpperCase();
  const num=v=>{if(typeof v==="number")return v;if(v==null||v==="")return 0;const s=String(v).replace(/\s/g,"");const n=s.includes(",")?parseFloat(s.replace(/\./g,"").replace(",",".")):parseFloat(s);return isNaN(n)?0:n};
  const r6=x=>Math.round(x*1e6)/1e6, r2=x=>Math.round(x*100)/100;
  const starts=(motivo,list)=>{const m=norm(motivo);if(!m)return false;return list.some(p=>{const q=norm(p);return q&&m.startsWith(q)})};
  const countStarts=(motivo,list)=>{const m=norm(motivo);if(!m)return 0;let c=0;list.forEach(p=>{const q=norm(p);if(q&&m.startsWith(q))c++});return c};

  /* Localiza as colunas pelo cabeçalho (resiste a colunas fora de ordem) */
  function mapCols(hdr){
    const H=hdr.map(h=>norm(h));
    const find=(...names)=>{for(const n of names){const i=H.indexOf(norm(n));if(i>=0)return i}return -1};
    const c={cod:find("Cod. Cedente","Cód. Cedente","Cod Cedente"),ced:find("Cedente"),valor:find("Vlr. Aberto","Vlr Aberto"),
      motivo:find("Motivo Entrega"),mon:find("Monitorada"),sacado:find("Sacado"),codSac:find("Cod. Sacado"),rotulo:find("Rótulo","Rotulo"),
      nf:find("Seu Número","Seu Numero"),emissao:find("Emissão NFe"),venc:find("Venc. Orig."),mercEnt:find("Merc. Ent."),aditivo:find("Aditivo")};
    return c;
  }
  function riscoDe(cod,ref){const r=ref.risco[String(cod)];return r==="Alto"||r==="Médio"||r==="Baixo"?r:"Sem risco"}
  function metaDe(cod,risco,ref){
    const me=ref.cfg.metasEspeciais&&ref.cfg.metasEspeciais[String(cod)];
    if(me&&me.meta)return{meta:+me.meta,origem:"Característica"};
    const c=ref.cfg;
    if(risco==="Alto")return{meta:c.metaAlto,origem:"Risco Alto"};
    if(risco==="Médio")return{meta:c.metaMedio,origem:"Risco Médio"};
    if(risco==="Baixo")return{meta:c.metaBaixo,origem:"Risco Baixo"};
    return{meta:c.metaPadrao,origem:"Padrão (sem risco)"};
  }
  function statusConf(ind,meta,margem){
    if(ind==null)return"Sem dados";
    if(r6(ind)<r6(meta))return"Abaixo";
    if(r6(ind)<r6(Math.min(1,meta+margem)))return"Atenção";
    return"OK";
  }
  function diaSugerido(cod,risco){
    const par=(+cod)%2===0;
    if(risco==="Alto")return"Diário";
    if(risco==="Baixo")return par?"Quarta":"Quinta";
    return par?"Segunda":"Terça";
  }
  function nivel(t){return t>=30?"A":t>=5?"B":"C"}

  /* Agrega uma base (linhas + cabeçalho) por cedente */
  function agregar(hdr,rows,ref,filtroMon){
    const c=mapCols(hdr);
    if(c.cod<0||c.valor<0||c.motivo<0)throw new Error("Não encontrei as colunas Cod. Cedente, Vlr. Aberto e Motivo Entrega no cabeçalho.");
    const cfg=ref.cfg,out={};
    rows.forEach(r=>{
      const cod=r[c.cod];if(cod==null||cod==="")return;
      if(filtroMon&&cfg.soMonitorados&&norm(r[c.mon])!=="S")return;
      const k=String(typeof cod==="number"?cod:String(cod).trim());
      const o=out[k]||(out[k]={cod:k,nome:"",tit:0,titConf:0,valor:0,vconf:0,vc99:0,vna:0,vnc:0,motivos:{},rotulos:{}});
      if(!o.nome)o.nome=String(r[c.ced]||"").trim();
      const v=num(r[c.valor]),m=r[c.motivo];
      o.tit++;o.valor+=v;
      const nc=countStarts(m,cfg.motivosConf); // a planilha soma por prefixo (SUMPRODUCT)
      if(nc){o.titConf+=nc;o.vconf+=v*nc}
      o.vc99+=v*countStarts(m,cfg.motivosC99);
      o.vna+=v*countStarts(m,cfg.motivosNA);
      o.vnc+=v*countStarts(m,cfg.motivosNC);
      const mk=String(m==null||m===""?"(sem motivo)":m).trim().slice(0,90);
      const mm=o.motivos[mk]||(o.motivos[mk]={q:0,v:0});mm.q++;mm.v+=v;
      if(c.rotulo>=0&&r[c.rotulo])o.rotulos[String(r[c.rotulo])]=1;
    });
    return out;
  }

  function pistas(texto,checagem){
    const z=String(texto||"");if(!z||(z.length<80&&/SEM CARACTER/i.test(z)))return"";
    const p=[];
    if(/aceite/i.test(z))p.push("Cita aceite");
    if(/e-mail/i.test(z))p.push("Cita e-mail");
    if(/portal/i.test(z))p.push("Cita portal");
    const i=z.indexOf("D+");if(i>=0){const mm=z.slice(i+2,i+4).match(/^\d{1,2}/);p.push("Prazo D+"+(mm?String(+mm[0]):""))}
    if(/canhoto/i.test(z))p.push("Cita canhoto");
    if(/não realizar ligaç|não ligar/i.test(z))p.push("NÃO ligar ao sacado");
    if(/% da carteira|mínima da carteira/i.test(checagem||""))p.push("% próprio de checagem");
    return p.length?p.join("  ·  "):"Sem pista (ver cadastro)";
  }
  function checagem(texto){
    const z=String(texto||"");const i=z.indexOf("CHECAGEM:");if(i<0)return"";
    const st=i+9;let end=z.length;
    ["GARANTIAS FORMALIZADAS:","JURIDICO:","MONITORAMENTO:","TESOURARIA:","COBRANÇA:","OPERAÇÃO:"].forEach(t=>{const j=z.indexOf(t,st);if(j>=0&&j<end)end=j});
    return z.slice(st,end).trim();
  }

  /* Monta o registro do dia (carteira + tranche) */
  function calcular(baseCart,baseTr,ref,anot){
    const cfg=ref.cfg;anot=anot||{};
    const A=baseCart?agregar(baseCart.hdr,baseCart.rows,ref,true):{};
    const T=baseTr?agregar(baseTr.hdr,baseTr.rows,ref,false):{};
    const cods=[...new Set([...Object.keys(A),...Object.keys(T)])].sort((a,b)=>(+a)-(+b)||a.localeCompare(b));
    const linhas=cods.map(cod=>{
      const a=A[cod],t=T[cod];
      const risco=riscoDe(cod,ref),{meta,origem}=metaDe(cod,risco,ref);
      const L={cod,nome:(a&&a.nome)||(t&&t.nome)||"",risco,meta,origemMeta:origem,naCarteira:!!a,naTranche:!!t};
      const an=anot[cod]||{};
      L.dia=an.dia||diaSugerido(cod,risco);
      if(a){
        L.tit=a.tit;L.titConf=a.titConf;L.valor=r2(a.valor);L.vconf=r2(a.vconf);
        L.ind=a.valor>0?a.vconf/a.valor:null;
        L.c99=a.valor>0?a.vc99/a.valor:null;L.na=a.valor>0?a.vna/a.valor:null;L.nc=a.valor>0?a.vnc/a.valor:null;
        L.nivel=nivel(a.tit);L.status=statusConf(L.ind,meta,cfg.margem);
        L.faltam=L.ind==null?null:Math.max(0,r2(meta*a.valor-a.vconf));
        L.motivos=Object.fromEntries(Object.entries(a.motivos).map(([k,v])=>[k,{q:v.q,v:r2(v.v)}]));
        L.rotulos=Object.keys(a.rotulos).slice(0,5);
      }else{L.status="Sem dados"}
      if(t){
        const lim=ref.lim[cod];const temLim=lim&&lim.limite!==""&&lim.limite!=null&&!isNaN(+lim.limite);
        const pr=cfg.metasTranchePropria&&cfg.metasTranchePropria[cod];
        const mu=pr&&pr.meta?+pr.meta:risco==="Alto"?cfg.trAlto:risco==="Médio"?cfg.trMedio:risco==="Baixo"?cfg.trBaixo:cfg.trSem;
        const I=r2(t.valor),J=temLim?+lim.limite:null;
        L.tr={tit:t.tit,valor:I,limite:J,fundo:lim?lim.fundo:"",metaUso:mu,aviso:pr?pr.aviso||"":"",
          pct:J==null?null:J>0?I/J:(I>0?"Limite zero":0),
          teto:J==null?null:r2(J*mu),excesso:J==null?null:Math.max(0,r2(I-J)),
          reduzir:J==null?null:Math.max(0,r2(I-r2(J*mu))),folga:J==null?null:Math.max(0,r2(J-I)),
          ind:t.valor>0?t.vconf/t.valor:null,c99:t.valor>0?t.vc99/t.valor:null,na:t.valor>0?t.vna/t.valor:null,nc:t.valor>0?t.vnc/t.valor:null};
        L.tr.status=J==null?"Sem limite":r2(I)>r2(J)?"EXCESSO":r2(I)>r2(L.tr.teto)?"Acima da meta":"OK";
        L.tr.statusConf=statusConf(L.tr.ind,meta,cfg.margem);
      }
      return L;
    });
    return linhas;
  }

  /* Lê uma planilha do SheetJS em {hdr, rows} achando a linha de cabeçalho */
  function lerAba(ws,XLSX){
    const aoa=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:false});
    let h=-1;for(let i=0;i<Math.min(15,aoa.length);i++){const n=(aoa[i]||[]).map(norm);if(n.includes("MOTIVO ENTREGA")&&n.some(x=>x==="COD. CEDENTE"||x==="CÓD. CEDENTE"||x==="COD CEDENTE")){h=i;break}}
    if(h<0)return null;
    return{hdr:aoa[h],rows:aoa.slice(h+1).filter(r=>r&&r.some(v=>v!=null&&v!==""))};
  }
  return{agregar,calcular,riscoDe,metaDe,statusConf,diaSugerido,nivel,pistas,checagem,lerAba,mapCols,num,norm};
})();
if(typeof module!=="undefined")module.exports=Engine;

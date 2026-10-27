/* ===== QPROF: pendência de notas (planilha + texto padrão SB Crédito) ===== */
const Qprof=(function(){
  const norm=s=>String(s==null?"":s).trim().toUpperCase();
  const num=v=>{if(typeof v==="number")return v;if(v==null||v==="")return 0;const s=String(v).replace(/\s|R\$/g,"");const n=s.includes(",")?parseFloat(s.replace(/\./g,"").replace(",",".")):parseFloat(s);return isNaN(n)?0:n};
  const CATS={
    dif:{nome:"Dificuldade de contato",desc:"com dificuldade de contato — e-mail e WhatsApp encaminhados, sem retorno",pedido:"pedimos a gentileza de encaminhar contatos e e-mails efetivos"},
    nada:{nome:"Mercadoria não entregue",desc:"de mercadoria não entregue",pedido:"pedimos a gentileza de informar o motivo do atraso e a previsão de entrega"},
    c99:{nome:"C99",desc:"em C99",pedido:"pedimos a gentileza de informar quando será feita a recompra"},
    retorno:{nome:"Pedido de retorno",desc:"com pedido de retorno em outro momento ou via e-mail/WhatsApp",pedido:"pedimos a gentileza de solicitar ao cedente que oriente o sacado a responder"},
    aceite:{nome:"Pendente de aceite",desc:"pendentes de aceite, a confirmar por e-mail ou SEFAZ",pedido:"pedimos a gentileza de solicitar ao cedente que oriente o sacado a responder"},
    desconhece:{nome:"Desconhecimento do pedido",desc:"em que o sacado desconhece o pedido",pedido:"pedimos a gentileza de verificar junto ao sacado a origem do pedido"},
    terceiros:{nome:"Paga a terceiros",desc:"em que o sacado paga a terceiros, mas não passa informações",pedido:"pedimos a gentileza de solicitar ao cedente que converse com o sacado"},
    docs:{nome:"Documentos pendentes",desc:"pendentes de documentos (canhoto + duplicata) para validação/baixa",pedido:"pedimos a gentileza de encaminhar os documentos para a validação/baixa"},
    outro:{nome:"Outro motivo",desc:"",pedido:""},
    ok:{nome:"Confirmado / baixado",desc:"já confirmados ou baixados",pedido:""},
    opdia:{nome:"Operação do dia",desc:"da operação do dia, ainda em checagem",pedido:""},
    ignorar:{nome:"Não entra no texto",desc:"",pedido:""}
  };
  const ORDEM=["ok","opdia","dif","nada","c99","retorno","aceite","desconhece","terceiros","docs","outro"];
  const isOK=m=>{const u=norm(m);return u.startsWith("BAIXA")||u.startsWith("CONFIRMA")||u.startsWith("MERCADORIA CONFIRMADA")||u.startsWith("OK ")||u.startsWith("SERVIÇO")||u.startsWith("DS ")||u.startsWith("SACADO CONFIRMA")||u.startsWith("WHATSAPP - CONFIRMADO")};
  const naoContaConf=m=>{const u=norm(m);return u.startsWith("BAIXADO AUTOMATICAMENTE")||u.startsWith("BAIXADO DEVIDO AO VENCIMENTO")};
  function sugerir(m){
    const u=norm(m);
    if(!u)return"opdia";
    if(u.startsWith("C99"))return"c99";
    if(isOK(m))return"ok";
    if(/DIFICULDADE|NÃO ATENDE|NAO ATENDE|^NA$|SEM CONTATO/.test(u))return"dif";
    if(/NADA CONSTA|NÃO ENTREGUE|NAO ENTREGUE|ATRASO/.test(u))return"nada";
    if(/RETORN|OUTRO MOMENTO/.test(u))return"retorno";
    if(/ACEITE/.test(u))return"aceite";
    if(/DESCONHE/.test(u))return"desconhece";
    if(/TERCEIRO/.test(u))return"terceiros";
    if(/DOCUMENT|CANHOTO|DUPLICATA/.test(u))return"docs";
    return"outro";
  }
  const KEEP=new Set(["LTDA","S/A","SA","S.A.","ME","EPP","EIRELI","MEI","CIA","DO","BR","EPI","SPE","II","III","IV","S/C"]);
  const LOW=new Set(["DA","DE","DO","DAS","DOS","E","EM","PARA","POR"]);
  function nomeBonito(s){
    return String(s||"").trim().replace(/\s+/g," ").split(" ").map((w,i)=>{
      const u=w.toUpperCase();
      if(KEEP.has(u)&&u!=="DO")return u;
      if(i>0&&LOW.has(u))return w.toLowerCase();
      if(/^[A-Z]{1,3}\.?$/.test(u)&&!/[AEIOU]/.test(u))return u;
      return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
    }).join(" ");
  }
  function brl(v){
    const a=Math.abs(v);
    if(a>=1e6)return"R$ "+(v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:2,minimumFractionDigits:0})+" MM";
    if(a>=1e3)return"R$ "+(v/1e3).toLocaleString("pt-BR",{maximumFractionDigits:1,minimumFractionDigits:0})+" Mil";
    return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  }
  const pct=(v,t)=>t?(v/t*100).toLocaleString("pt-BR",{maximumFractionDigits:1,minimumFractionDigits:1})+"%":"0%";
  function toDate(v){
    if(v==null||v==="")return null;
    if(v instanceof Date)return isNaN(v)?null:new Date(v.getFullYear(),v.getMonth(),v.getDate());
    if(typeof v==="number"){const d=new Date(Math.round((v-25569)*864e5));return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())}
    const s=String(v).trim();let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(m)return new Date(+(m[3].length===2?"20"+m[3]:m[3]),+m[2]-1,+m[1]);
    m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);return null;
  }
  const fmtD=d=>d?String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear():"";
  function aditivoData(a){const s=String(a==null?"":a).replace(/\D/g,"");if(s.length<6)return null;return new Date(2000+ +s.slice(0,2),+s.slice(2,4)-1,+s.slice(4,6))}

  function colunas(hdr){
    const H=hdr.map(norm);const f=(...n)=>{for(const x of n){const i=H.indexOf(norm(x));if(i>=0)return i}return -1};
    return{nf:f("Seu Número","Seu Numero","Nota Fiscal"),rot:f("Rótulo","Rotulo"),cods:f("Cod. Sacado","Cód. Sacado"),sac:f("Sacado"),
      status:f("Status Checagem","Motivo Entrega"),valor:f("Vlr. Aberto","Vlr Aberto"),emis:f("Emissão NFe","Emissao NFe"),venc:f("Venc. Orig."),
      fone:f("Fone"),f1:f("Fone 1"),f2:f("Fone 2"),cel:f("Celular"),merc:f("Merc. Ent."),adit:f("Aditivo"),ced:f("Cedente"),codc:f("Cod. Cedente")};
  }
  /* analisa a base; hoje = Date */
  function analisar(hdr,rows,hoje){
    const c=colunas(hdr);
    if(c.valor<0||c.status<0)throw new Error("Não encontrei as colunas Vlr. Aberto e Motivo Entrega (ou Status Checagem).");
    const ontem=new Date(hoje);ontem.setDate(ontem.getDate()-1);
    const same=(a,b)=>a&&b&&a.getTime()===b.getTime();
    const itens=rows.map(r=>{
      const motivo=String(r[c.status]==null?"":r[c.status]).trim();
      const ad=c.adit>=0?aditivoData(r[c.adit]):null;
      const recente=ad&&(same(ad,hoje)||same(ad,ontem));
      let rot=motivo;
      if((!motivo||norm(motivo).startsWith("BAIXADO AUTOMATICAMENTE"))&&recente)rot="OP DO DIA "+String(ad.getDate()).padStart(2,"0")+"/"+String(ad.getMonth()+1).padStart(2,"0");
      return{r,motivo,rotulo:rot||"(sem motivo)",valor:num(r[c.valor]),sacado:c.sac>=0?String(r[c.sac]||"").trim():"",emis:c.emis>=0?toDate(r[c.emis]):null,opdia:rot.startsWith("OP DO DIA")};
    });
    const total=itens.reduce((a,i)=>a+i.valor,0);
    const tranche=c.merc>=0&&rows.length>0&&rows.every(r=>norm(r[c.merc])==="FALSE"||r[c.merc]===false);
    const cedente=(c.rot>=0&&rows[0]?String(rows[0][c.rot]||""):"")||(c.ced>=0&&rows[0]?String(rows[0][c.ced]||""):"");
    const cedNome=c.ced>=0&&rows[0]?String(rows[0][c.ced]||""):"";
    // grupos por rótulo de status
    const grupos={};
    itens.forEach(i=>{const g=grupos[i.rotulo]||(grupos[i.rotulo]={rotulo:i.rotulo,motivo:i.motivo,valor:0,q:0,itens:[],opdia:i.opdia});g.valor+=i.valor;g.q++;g.itens.push(i)});
    const confNum=itens.filter(i=>i.motivo&&isOK(i.motivo)&&!naoContaConf(i.motivo)).reduce((a,i)=>a+i.valor,0);
    return{c,hdr,rows,itens,total,tranche,cedente,cedNome,grupos:Object.values(grupos).sort((a,b)=>b.valor-a.valor),confirmacao:total?confNum/total:0,hoje};
  }

  /* texto padrão */
  function texto(A,opt){
    // opt: {cat:{rotulo:catKey}, tipo:'risco'|'tranche'|'modalidade', abertura:'temos'|'do', compl:{catKey:str}, prefat:bool, incluirOk:bool}
    const porCat={};
    A.grupos.forEach(g=>{const k=g.opdia?"opdia":(opt.cat[g.rotulo]||sugerir(g.motivo));if(k==="ignorar")return;
      const o=porCat[k]||(porCat[k]={k,valor:0,itens:[],motivos:[]});o.valor+=g.valor;o.itens.push(...g.itens);o.motivos.push(g.motivo||g.rotulo)});
    const lista=ORDEM.filter(k=>porCat[k]&&porCat[k].valor>0&&(k!=="ok"||opt.incluirOk));
    const total=lista.reduce((a,k)=>a+porCat[k].valor,0);
    const tipo=opt.tipo==="tranche"?"nesta tranche":opt.tipo==="modalidade"?"nesta modalidade":"no risco";
    const head=opt.abertura==="do"?`Do ${opt.tipo==="tranche"?"valor da tranche":opt.tipo==="modalidade"?"valor da modalidade":"risco"} de ${brl(total)}, temos:`:`Temos ${brl(total)} ${tipo}, dos quais:`;
    const sacs=it=>{const m={};it.forEach(i=>{if(i.sacado)m[i.sacado]=(m[i.sacado]||0)+i.valor});const n=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([s])=>nomeBonito(s));
      if(!n.length)return"";if(n.length<=3)return n.length===1?n[0]:n.slice(0,-1).join(", ")+" e "+n[n.length-1];return n.slice(0,3).join(", ")+" e mais "+(n.length-3)+" sacados"};
    const linhas=lista.map((k,ix)=>{
      const o=porCat[k],C=CATS[k];let d=C.desc;
      if(k==="nada"){const dias=o.itens.map(i=>i.emis?Math.round((A.hoje-i.emis)/864e5):null).filter(x=>x!=null&&x>0);
        if(dias.length){const mx=Math.max(...dias),mn=Math.min(...dias);d+=mn===mx?`, com ${mx} dias de atraso`:`, com até ${mx} dias de atraso`}}
      if(k==="c99"){const ex=[...new Set(o.motivos.map(m=>String(m).replace(/^C99\s*[-–:]?\s*/i,"").trim()).filter(Boolean))];if(ex.length&&!(opt.compl&&opt.compl.c99))d+=" — "+ex.map(x=>x.charAt(0).toLowerCase()+x.slice(1)).join("; ")}
      if(k==="outro")d="em "+[...new Set(o.motivos)].map(m=>m.toLowerCase()).join(" / ");
      const cpl=(opt.compl&&opt.compl[k]||"").trim();
      const s=k==="ok"||k==="opdia"?"":sacs(o.itens);
      return`• ${brl(o.valor)} (${pct(o.valor,total)}) ${d}${cpl?" — "+cpl:""}${s?" ("+s+")":""}${ix===lista.length-1?".":";"}`;
    });
    const pedidos=lista.filter(k=>CATS[k].pedido||(k==="outro"&&opt.compl&&opt.compl.outroPedido)).map(k=>{
      let p=k==="outro"?opt.compl.outroPedido:CATS[k].pedido;
      if(k==="nada"&&opt.prefat)p+=" e se há pré-faturamento, para evitarmos ligações repetidas ao sacado";
      if(k==="c99"&&opt.c99pag)p="pedimos a gentileza de confirmar o pagamento";
      const alvo={dif:"a dificuldade de contato",nada:"a mercadoria não entregue",c99:"o C99",retorno:"os pedidos de retorno",aceite:"os pendentes de aceite",desconhece:"o desconhecimento do pedido",terceiros:"o sacado que não passa informações",docs:"os documentos pendentes",outro:"os demais itens"}[k];
      return`Sobre ${alvo}, ${p}.`;
    });
    return{texto:[head,"",...linhas,...(pedidos.length?["",...pedidos]:[])].join("\n"),total,lista:lista.map(k=>({k,valor:porCat[k].valor,pct:total?porCat[k].valor/total:0}))};
  }

  /* pontos de atenção */
  function revisar(t,total,somaItens){
    const av=[];
    if(/\bqual\b/i.test(t)&&!/\bo qual\b|\ba qual\b|\bos quais\b|\bas quais\b|\bdos quais\b/i.test(t.replace(/dos quais:/gi,"")))av.push("“qual” usado como pronome relativo: troque por “que”.");
    if(/\bn[óo]s informar\b/i.test(t))av.push("Troque “nós informar” por “pedimos a gentileza de informar”.");
    const caps=(t.match(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}\b/g)||[]).filter(w=>!["LTDA","EIRELI","SEFAZ","WHATSAPP"].includes(w));
    if(caps.length)av.push("Palavras todas em maiúsculas: "+[...new Set(caps)].slice(0,6).join(", ")+". Use capitalização normal.");
    if(Math.abs(total-somaItens)>0.5)av.push("Os itens não somam o total informado.");
    const semAcento=["nao ","pendencia","informacao","operacao","confirmacao","previsao"].filter(w=>t.toLowerCase().includes(w));
    if(semAcento.length)av.push("Revise a acentuação: "+semAcento.map(s=>s.trim()).join(", ")+".");
    return av;
  }

  /* planilha no modelo do usuário (xlsx-js-style) */
  function planilha(A,XLSX){
    const c=A.c,wb=XLSX.utils.book_new();
    const thin={style:"thin",color:{rgb:"9E9E9E"}};const B={top:thin,bottom:thin,left:thin,right:thin};
    const H={font:{bold:true,color:{rgb:"1B3A1F"}},fill:{fgColor:{rgb:"C6EFCE"}},border:B,alignment:{horizontal:"center",vertical:"center",wrapText:true}};
    const Cc={border:B};const Cm={border:B,numFmt:'"R$" #,##0.00'};const Cd={border:B,numFmt:"dd/mm/yyyy"};
    const RED={font:{bold:true,color:{rgb:"C00000"}}};
    const T={font:{bold:true},fill:{fgColor:{rgb:"E2EFDA"}},border:B};
    const v=(r,i)=>i>=0?r[i]:"";
    const dt=x=>{const d=toDate(x);return d||(x==null?"":x)};
    const usados=new Set();
    const nomeAba=s=>{let n=String(s).replace(/[\\\/\?\*\[\]:]/g," ").slice(0,31).trim()||"Aba";let k=n,i=2;while(usados.has(k.toUpperCase())){k=n.slice(0,28)+" "+i++}usados.add(k.toUpperCase());return k};
    const cell=(val,s)=>({v:val==null?"":val,t:val instanceof Date?"d":typeof val==="number"?"n":"s",s});
    const pend=A.grupos.filter(g=>g.motivo&&!g.opdia&&!isOK(g.motivo));
    pend.forEach(g=>{
      const u=norm(g.motivo),fones=/DIFICULDADE|NÃO ATENDE|NAO ATENDE|^NA$/.test(u),nada=/NADA CONSTA/.test(u),c99=u.startsWith("C99");
      const head=["Nota Fiscal","Rótulo","Cod. Sacado","Sacado",...(fones?["Fone1","Fone2","Fone3"]:[]),"Status Checagem","Vlr. Aberto","Emissão NFe",...(nada?["Atraso"]:[]),"Venc. Orig."];
      const aoa=[head.map(h=>cell(h,H))];
      g.itens.forEach(i=>{const r=i.r;const st=c99?{...Cc,...RED}:Cc;const sm=c99?{...Cm,...RED}:Cm;const sd=c99?{...Cd,...RED}:Cd;
        const em=dt(v(r,c.emis));
        aoa.push([cell(v(r,c.nf),st),cell(v(r,c.rot),st),cell(v(r,c.cods),st),cell(v(r,c.sac),st),
          ...(fones?[cell(v(r,c.f1>=0?c.f1:c.fone),st),cell(v(r,c.f2),st),cell(v(r,c.cel),st)]:[]),
          cell(i.motivo,st),cell(i.valor,sm),cell(em,sd),...(nada?[cell(em instanceof Date?Math.round((A.hoje-em)/864e5):"",st)]:[]),cell(dt(v(r,c.venc)),sd)]);
      });
      const vi=head.indexOf("Vlr. Aberto");
      aoa.push(head.map((h,ix)=>ix===0?cell("Total",T):ix===vi?cell(g.valor,{...T,numFmt:'"R$" #,##0.00'}):cell("",T)));
      const ws=XLSX.utils.aoa_to_sheet(aoa);ws["!cols"]=head.map(h=>({wch:h==="Sacado"||h==="Rótulo"?34:h==="Status Checagem"?26:14}));
      XLSX.utils.book_append_sheet(wb,ws,nomeAba(g.motivo));
    });
    // STATUS CHECAGEM
    const tit=(A.tranche?`${A.cedNome||""} TRANCHE ${A.cedente||""}`:`${A.cedNome||""} ${A.cedNome&&A.cedente?"– ":""}${A.cedente||""}`).trim()||"STATUS CHECAGEM";
    const S=[[cell(tit,{font:{bold:true,sz:14}})],[],[cell("Status Checagem",H),cell("Vlr Aberto",H),cell("%",H)]];
    A.grupos.forEach(g=>{const red=norm(g.motivo).startsWith("C99");const st=red?{...Cc,...RED}:Cc;
      S.push([cell(g.rotulo,st),cell(g.valor,red?{...Cm,...RED}:Cm),cell(A.total?g.valor/A.total:0,{...st,numFmt:"0.0%"})])});
    S.push([cell("Total",T),cell(A.total,{...T,numFmt:'"R$" #,##0.00'}),cell(1,{...T,numFmt:"0%"})]);
    if(!A.tranche){S.push([]);S.push([cell("Confirmação da Carteira",H),cell(A.confirmacao,{...Cc,numFmt:"0.0%",font:{bold:true}})])}
    const ws=XLSX.utils.aoa_to_sheet(S);ws["!cols"]=[{wch:40},{wch:18},{wch:10}];ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:2}}];
    XLSX.utils.book_append_sheet(wb,ws,nomeAba("STATUS CHECAGEM"));
    // base original
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([A.hdr,...A.rows]),nomeAba("BASE"));
    // STATUS CHECAGEM primeiro
    wb.SheetNames=[wb.SheetNames.find(n=>n==="STATUS CHECAGEM"),...wb.SheetNames.filter(n=>n!=="STATUS CHECAGEM")];
    return wb;
  }
  return{CATS,ORDEM,sugerir,analisar,texto,revisar,planilha,nomeBonito,brl,isOK,colunas};
})();
if(typeof module!=="undefined")module.exports=Qprof;

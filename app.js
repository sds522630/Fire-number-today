(() => {
  const $ = id => document.getElementById(id);
  const ids = ["age","retireAge","assets","income","expenses","swr","monthly","stepup","return","inflation","educationOn","educationGoal","educationYears"];
  const defaults = {age:36,retireAge:60,assets:5000000,income:100000,expenses:80200,swr:3.5,monthly:65000,stepup:5,return:10,inflation:6,educationOn:true,educationGoal:15000000,educationYears:15};
  let latest = null;
  const money = n => {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e7) return (n/1e7).toLocaleString("en-IN",{maximumFractionDigits:2,minimumFractionDigits:0})+" Cr";
    if (abs >= 1e5) return (n/1e5).toLocaleString("en-IN",{maximumFractionDigits:2,minimumFractionDigits:0})+" L";
    return "₹"+Math.round(n).toLocaleString("en-IN");
  };
  const inr = n => "₹"+Math.round(n).toLocaleString("en-IN");
  const val = id => Number($(id).value || 0);
  const read = () => ({
    age:val("age"), retireAge:val("retireAge"), assets:val("assets"), income:val("income"),
    expenses:val("expenses"), swr:val("swr"), monthly:val("monthly"), stepup:val("stepup"),
    ret:val("return"), inflation:val("inflation"), educationOn:$("educationOn").checked,
    educationGoal:val("educationGoal"), educationYears:val("educationYears")
  });
  function validate(p) {
    if (p.age < 18 || p.age > 80) return "Enter a current age between 18 and 80.";
    if (p.retireAge <= p.age || p.retireAge > 100) return "Target retirement age must be greater than your current age and no more than 100.";
    if (p.assets < 0 || p.expenses < 0 || p.monthly < 0) return "Assets, expenses, and investments cannot be negative.";
    if (p.swr <= 0 || p.swr > 6) return "Choose a withdrawal rate above 0% and no higher than 6%.";
    if (p.ret < 0 || p.ret > 25 || p.inflation < 0 || p.inflation > 15) return "Check the return and inflation assumptions.";
    if (p.stepup < 0 || p.stepup > 50) return "Annual investment increase must be between 0% and 50%.";
    return "";
  }
  function project(p, contribution) {
    let balance = p.assets;
    const monthlyRate = Math.pow(1+p.ret/100,1/12)-1;
    const rows = [{year:0,age:p.age,balance,target:p.expenses*12/(p.swr/100)}];
    const maxYears = Math.max(1, 100-p.age);
    let monthly = contribution;
    let fireYear = null;
    for (let year=1;year<=maxYears;year++) {
      for (let m=0;m<12;m++) balance = balance*(1+monthlyRate)+monthly;
      const target = p.expenses*12*Math.pow(1+p.inflation/100,year)/(p.swr/100);
      rows.push({year,age:p.age+year,balance,target});
      if (fireYear === null && balance >= target) fireYear = year;
      monthly *= 1+p.stepup/100;
    }
    return {rows,fireYear};
  }
  function neededMonthly(p, years) {
    if (years <= 0) return Math.max(0,(p.expenses*12/(p.swr/100))-p.assets);
    let lo=0, hi=10000000;
    for(let i=0;i<70;i++){
      const mid=(lo+hi)/2;
      const q=project({...p,age:p.age},mid).rows[years];
      if(!q || q.balance >= q.target) hi=mid; else lo=mid;
    }
    return hi;
  }
  function drawChart(rows, selectedYears) {
    const canvas=$("projectionChart"), ctx=canvas.getContext("2d");
    const cssWidth=canvas.clientWidth || 500, ratio=window.devicePixelRatio||1;
    canvas.width=Math.round(cssWidth*ratio); canvas.height=Math.round((cssWidth*.43)*ratio);
    ctx.scale(ratio,ratio);
    const w=cssWidth,h=cssWidth*.43, pad={l:42,r:10,t:15,b:28};
    const plotW=w-pad.l-pad.r, plotH=h-pad.t-pad.b;
    const count=Math.min(rows.length, Math.max(8,selectedYears+1));
    let data=rows.slice(0,count);
    if(data.length<2) data=rows.slice(0,Math.min(rows.length,2));
    const maxVal=Math.max(1,...data.map(d=>Math.max(d.balance,d.target)))*1.08;
    const x=i=>pad.l+(data.length<=1?0:i/(data.length-1))*plotW;
    const y=v=>pad.t+plotH-(v/maxVal)*plotH;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=1;ctx.fillStyle="#a9c7b4";ctx.font="9px system-ui";
    for(let i=0;i<=3;i++){const yy=pad.t+plotH*i/3;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText(money(maxVal*(1-i/3)),1,yy+3);}
    const line=(key,color,dash=[])=>{ctx.beginPath();data.forEach((d,i)=>{const xx=x(i), yy=y(d[key]);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])};
    line("balance","#8cd5a8");
    line("target","#e5ba68",[5,4]);
    ctx.fillStyle="#a9c7b4";ctx.font="9px system-ui";
    [0,Math.floor((data.length-1)/2),data.length-1].forEach(i=>{if(data[i])ctx.fillText("Age "+data[i].age,x(i)-12,h-7)});
  }
  function calculate() {
    const p=read(), error=validate(p);
    $("formError").textContent=error;
    if(error) return;
    const years=p.retireAge-p.age;
    const result=project(p,p.monthly);
    const atRetirement=result.rows[years];
    const target=atRetirement.target;
    const corpus=atRetirement.balance;
    const gap=corpus-target;
    const actualFire=result.fireYear;
    const needed=neededMonthly(p,years);
    latest={p,result,years,atRetirement,target,corpus,gap,needed,actualFire};
    $("heroCorpus").textContent=money(corpus);
    $("resultLabel").textContent="FIRE age at current contribution";
    $("resultAge").textContent=actualFire===null?"Not reached":String(p.age+actualFire);
    $("resultSub").textContent=actualFire===null?"Target not reached within the modelled lifetime":"Estimated age if your assumptions hold";
    $("targetValue").textContent=money(target);
    $("corpusValue").textContent=money(corpus);
    $("neededValue").textContent=money(needed)+"/mo";
    $("gapValue").textContent=(gap>=0?"+":"−")+money(Math.abs(gap));
    $("gapValue").style.color=gap>=0?"#a9dfba":"#f1c6a8";
    const reached=corpus>=target;
    $("statusPill").textContent=reached?"On track at target age":"Plan needs a boost";
    $("insightBox").querySelector("p").textContent = reached
      ? `At age ${p.retireAge}, your projected portfolio is ${money(corpus)} versus a target of ${money(target)}. Review lower-return and higher-inflation scenarios before relying on this result.`
      : `At age ${p.retireAge}, the projected gap is ${money(Math.abs(gap))}. The model estimates a starting contribution of about ${money(needed)} per month, increasing ${p.stepup}% each year, to reach this target under the selected assumptions.`;
    drawChart(result.rows,years);
    if(p.educationOn && p.educationGoal>0) {
      const eduFuture=p.educationGoal*Math.pow(1+p.inflation/100,p.educationYears);
      $("insightBox").querySelector("p").textContent += ` Separate education goal: about ${money(eduFuture)} in ${p.educationYears} years if costs rise with inflation; this is not included in the FIRE corpus.`;
    }
  }
  function exportReport() {
    if(!latest) calculate();
    if(!latest || $("formError").textContent) return;
    const {p,years,atRetirement,target,corpus,gap,needed,actualFire}=latest;
    const lines=[
      "FIREPath — Personal FIRE Plan","Generated: "+new Date().toLocaleDateString("en-IN"),"",
      "YOUR ASSUMPTIONS",`Current age: ${p.age}`,`Target retirement age: ${p.retireAge}`,`Current investable assets: ${inr(p.assets)}`,
      `Monthly expenses in today's money: ${inr(p.expenses)}`,`Withdrawal rate: ${p.swr}%`,`Monthly investment: ${inr(p.monthly)}`,
      `Annual investment step-up: ${p.stepup}%`,`Expected nominal return: ${p.ret}%`,`Inflation: ${p.inflation}%`,"",
      "PROJECTION",`FIRE target at age ${p.retireAge}: ${inr(target)}`,`Projected portfolio at age ${p.retireAge}: ${inr(corpus)}`,
      `Gap / surplus: ${inr(gap)}`,`Estimated FIRE age at current contribution: ${actualFire===null?"Not reached within modelled lifetime":p.age+actualFire}`,
      `Approximate starting monthly investment needed for target age: ${inr(needed)}`,
      p.educationOn?`Separate education goal: ${inr(p.educationGoal)} in today's money, needed in ${p.educationYears} years; estimated future cost ${inr(p.educationGoal*Math.pow(1+p.inflation/100,p.educationYears))}.`:"",
      "","IMPORTANT","This report is an educational illustration, not financial advice. It assumes constant annualized returns and inflation and excludes taxes, fees, market volatility, and sequence-of-returns risk. Education assets are separate from retirement assets. Actual results will differ."
    ].filter(Boolean).join("\n");
    const blob=new Blob([lines],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="FIREPath-plan.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    toast("Your report has been downloaded.");
  }
  function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");window.setTimeout(()=>t.classList.remove("show"),2600)}
  $("fireForm").addEventListener("submit",e=>{e.preventDefault();calculate()});
  $("resetBtn").addEventListener("click",()=>{ids.forEach(id=>{if(id==="educationOn")$(id).checked=defaults[id];else $(id).value=defaults[id]});$("formError").textContent="";calculate()});
  $("educationOn").addEventListener("change",()=>{$("educationFields").style.opacity=$("educationOn").checked?"1":".45";$("educationFields").style.pointerEvents=$("educationOn").checked?"auto":"none";calculate()});
  $("downloadBtn").addEventListener("click",exportReport);
  $("shareBtn").addEventListener("click",async()=>{
    const p=read();
    const shareValues={...p,return:p.ret}; delete shareValues.ret;
    const params=new URLSearchParams(Object.entries(shareValues).map(([k,v])=>[k,String(v)]));
    const shareUrl=location.origin+location.pathname+"?"+params.toString()+"#calculator";
    try{
      if(navigator.share){await navigator.share({title:"My FIREPath plan",text:"Explore this FIRE calculator plan.",url:shareUrl});}
      else if(navigator.clipboard && location.protocol==="https:"){await navigator.clipboard.writeText(shareUrl);toast("Shareable link copied.");}
      else {prompt("Copy this shareable plan link:",shareUrl);}
    }catch(e){if(e.name!=="AbortError")prompt("Copy this shareable plan link:",shareUrl)}
  });
  function loadQuery(){
    const q=new URLSearchParams(location.search);
    ids.forEach(id=>{if(q.has(id)){if(id==="educationOn")$(id).checked=q.get(id)==="true";else if(Number.isFinite(Number(q.get(id))))$(id).value=q.get(id)}});
    $("educationFields").style.opacity=$("educationOn").checked?"1":".45";
    $("educationFields").style.pointerEvents=$("educationOn").checked?"auto":"none";
  }
  loadQuery();calculate();
  window.addEventListener("resize",()=>{if(latest)drawChart(latest.result.rows,latest.years)});
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();

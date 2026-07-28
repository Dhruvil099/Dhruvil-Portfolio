/**
 * Interactive artifact for the FLAN-T5 StatGuide case study.
 *
 * The original app is not reproducible here: the saved page's own bundles were
 * never part of the artifact, and the fine-tuned weights are gone (see the
 * article's "Where it actually stands"). What IS reproducible is the half of
 * the system the article argues for — the deterministic half. The model's only
 * job was reading four numbers out of a word problem; everything after that was
 * scipy and string formatting, and that part can be re-implemented exactly.
 *
 * So this artifact hands you the extraction step (pick an example, or type the
 * four numbers yourself) and then does what the backend did: computes the
 * corrected S, the critical value, the test statistic and the decision, renders
 * the worked solution, and plots the distribution with its rejection region.
 *
 * The critical values come from a full inverse-CDF implementation (Acklam +
 * Newton for the normal; regularized incomplete beta + bisection for Student-t),
 * validated against the values the real app produced:
 *   z(0.05)      = 1.644853626951472
 *   t_19(0.1)    = -1.3277282090267986
 *   S(n=20,s=.6) = 0.6155870112510924   T = 0.8993861486838934
 *   S(n=300,s=3) = 3.0050125348238      Z = -87.38030187379506
 */
export const statguideArtifactHtml = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
       background:#f6f7fb;color:#1a1c2b}
  .wrap{display:grid;grid-template-columns:280px 1fr;min-height:100vh}
  .side{background:#fff;border-right:1px solid #e7e8f2;padding:18px;display:flex;flex-direction:column;gap:14px}
  .brand{font-weight:700;font-size:15px;letter-spacing:-.01em}
  .brand small{display:block;font-weight:500;color:#6b6f88;font-size:11px;margin-top:2px}
  .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8b8fa6;margin:6px 0 2px}
  .ex{display:block;width:100%;text-align:left;border:1px solid #e7e8f2;background:#fbfbff;border-radius:10px;
      padding:9px 11px;font-size:12px;line-height:1.35;color:#3a3d55;cursor:pointer;margin-bottom:7px}
  .ex:hover{border-color:#b9bce0}
  .ex.on{background:linear-gradient(135deg,#efeaff,#e4e9ff);border-color:#a99cf5;color:#231f4d;font-weight:600}
  .main{padding:22px 26px 40px}
  .crumb{font-size:12px;color:#8b8fa6}
  h1{font-size:23px;margin:4px 0 16px;letter-spacing:-.02em}
  .card{background:#fff;border:1px solid #e7e8f2;border-radius:14px;padding:16px 18px;margin-bottom:14px}
  .q{font-size:13.5px;line-height:1.6;color:#2b2e42}
  .q b{color:#5b46d9}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px;margin-top:6px}
  label.f{display:block;font-size:11px;color:#6b6f88;margin-bottom:3px}
  input,select{width:100%;padding:7px 9px;border:1px solid #dcdeee;border-radius:8px;font-size:13px;
               font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;color:#1a1c2b}
  input:focus,select:focus{outline:2px solid #a99cf5;outline-offset:-1px}
  .sol{font-size:15px;line-height:2.05}
  .verdict{text-align:center;font-size:17px;font-weight:700;margin-top:10px}
  .accept{color:#1f7a4d}.reject{color:#c2371f}
  .note{font-size:11px;color:#8b8fa6;line-height:1.5;margin-top:10px}
  .err{color:#c2371f;font-size:12px}
  svg{display:block;width:100%;height:auto}
  @media(max-width:820px){.wrap{grid-template-columns:1fr}.side{border-right:0;border-bottom:1px solid #e7e8f2}}
</style>
</head>
<body>
<div class="wrap">
  <aside class="side">
    <div class="brand">t&amp;Z-testAI<small>Statistics / Hypothesis testing</small></div>
    <div>
      <div class="lbl">Examples</div>
      <div id="examples"></div>
    </div>
    <div>
      <div class="lbl">Extracted values</div>
      <div class="grid">
        <div><label class="f" for="mu">Population mean (μ)</label><input id="mu" type="number" step="any"></div>
        <div><label class="f" for="xbar">Sample mean (X̄)</label><input id="xbar" type="number" step="any"></div>
        <div><label class="f" for="n">Sample size (n)</label><input id="n" type="number" step="1" min="2"></div>
        <div><label class="f" for="s">Sample s.d. (s)</label><input id="s" type="number" step="any"></div>
        <div><label class="f" for="los">L.O.S.</label><input id="los" type="number" step="any" min="0.0001" max="0.5"></div>
        <div><label class="f" for="tail">Tail</label>
          <select id="tail"><option value="left">left</option><option value="right">right</option><option value="two">two</option></select>
        </div>
      </div>
      <div class="note">The model's whole job was producing these four numbers.
        Everything below is computed deterministically, the way the backend did it.</div>
    </div>
  </aside>

  <main class="main">
    <div class="crumb">Statistics / Hypothesis testing</div>
    <h1>t&amp;Z-testAI</h1>
    <div class="card"><div class="q" id="question"></div></div>
    <div class="card"><div class="sol" id="solution"></div><div class="verdict" id="verdict"></div></div>
    <div class="card"><div id="plot"></div></div>
    <div class="note">Test selected the way the course did: Z when n &gt; 30, otherwise t with n−1 degrees of
      freedom. Critical values from inverse CDFs, not tables.</div>
  </main>
</div>

<script>
/* ---------- numerics (validated against the original app's outputs) ---------- */
function lgamma(x){const g=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
 if(x<0.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);x-=1;let a=0.99999999999980993,t=x+7.5;
 for(let i=0;i<8;i++)a+=g[i]/(x+i+1);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);}
function gser(a,x){let ap=a,sum=1/a,del=sum;for(let n=1;n<500;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*1e-16)break;}return sum*Math.exp(-x+a*Math.log(x)-lgamma(a));}
function gcf(a,x){const F=1e-300;let b=x+1-a,c=1/F,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<F)d=F;c=b+an/c;if(Math.abs(c)<F)c=F;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-16)break;}return Math.exp(-x+a*Math.log(x)-lgamma(a))*h;}
function gammp(a,x){return x<a+1?gser(a,x):1-gcf(a,x);}
function normCdf(x){const z=Math.abs(x)/Math.SQRT2,p=0.5*gammp(0.5,z*z);return x>=0?0.5+p:0.5-p;}
function normPdf(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}
function normInvA(p){const a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00],
 b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01],
 c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00],
 d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00],pl=0.02425;let q,r;
 if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 if(p<=1-pl){q=p-0.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
 q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
function normInv(p){let x=normInvA(p);for(let i=0;i<3;i++){x-=(normCdf(x)-p)/normPdf(x);}return x;}
function betacf(a,b,x){const F=1e-300;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<F)d=F;d=1/d;let h=d;
 for(let m=1;m<=300;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<F)d=F;c=1+aa/c;if(Math.abs(c)<F)c=F;d=1/d;h*=d*c;
 aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<F)d=F;c=1+aa/c;if(Math.abs(c)<F)c=F;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-16)break;}return h;}
function betai(a,b,x){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));
 return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
function tCdf(t,df){const p=0.5*betai(df/2,0.5,df/(df+t*t));return t>0?1-p:p;}
function tPdf(t,df){return Math.exp(lgamma((df+1)/2)-lgamma(df/2))/Math.sqrt(df*Math.PI)*Math.pow(1+t*t/df,-(df+1)/2);}
function tInv(p,df){let lo=-1e3,hi=1e3;for(let i=0;i<300;i++){const m=(lo+hi)/2;if(tCdf(m,df)<p)lo=m;else hi=m;}return (lo+hi)/2;}

/* ---------- the three examples the app shipped with ---------- */
const EX=[
 {t:"A LED manufacturing company claims an average lifetime of 100 days. For a sample of 300 such LEDs, it was found that it had an average liftime of 84 days with a standard error of 3 days. Is the claim acceptable. Take 5% L.O.S.",
  mu:100,xbar:84.84,n:300,s:3,los:0.05,tail:"left"},
 {t:"A fashion brand claims that the average satisfaction rating for its new clothing line is at least 2.3312. A sample of 20 customers gave an average rating of 2.455 with a standard deviation of 0.6. Test at 10% L.O.S. using a left tailed t-test.",
  mu:2.3312,xbar:2.455,n:20,s:0.6,los:0.1,tail:"left"},
 {t:"A company manufacturing the bulbs claims that the average lifetime of a sample of 25 bulbs is 1550 hours with a S.D. of 120 hours, against a claimed 1600 hours. Is the claim acceptable at 5% L.O.S.?",
  mu:1600,xbar:1550,n:25,s:120,los:0.05,tail:"two"}];

const $=id=>document.getElementById(id);
const F=["mu","xbar","n","s","los"];
let active=0;

function tex(el,s,d){ if(window.katex){try{katex.render(s,el,{displayMode:!!d,throwOnError:false});return;}catch(e){}} el.textContent=s; }

function compute(){
  const mu=+$("mu").value, xbar=+$("xbar").value, n=+$("n").value, s=+$("s").value, los=+$("los").value, tail=$("tail").value;
  const sol=$("solution"), ver=$("verdict"), plot=$("plot");
  if(!isFinite(mu)||!isFinite(xbar)||!isFinite(s)||!isFinite(los)||!(n>1)||!(los>0&&los<0.5)){
    sol.innerHTML='<span class="err">Enter all four values, n &gt; 1 and 0 &lt; L.O.S. &lt; 0.5.</span>';
    ver.textContent=""; plot.innerHTML=""; return;}
  const useZ = n>30, df = n-1;
  const S = Math.sqrt(n/(n-1))*s;
  const stat = (xbar-mu)/(S/Math.sqrt(n));
  const name = useZ?"Z":"T";
  let crit, reject, rule;
  if(tail==="two"){ crit = useZ?normInv(1-los/2):tInv(1-los/2,df);
    reject = Math.abs(stat)>crit; rule="|"+name+"| "+(reject?">":"\\leq")+" "+name+"_{critical}"; }
  else if(tail==="left"){ crit = useZ?normInv(los):tInv(los,df);
    reject = stat<crit; rule=name+" "+(reject?"<":">")+" "+name+"_{critical}"; }
  else { crit = useZ?normInv(1-los):tInv(1-los,df);
    reject = stat>crit; rule=name+" "+(reject?">":"\\leq")+" "+name+"_{critical}"; }

  const critLabel = useZ ? "z("+los+")" : "t_{"+df+"}("+los+")";
  const lines=[
    "\\text{Sample size }(n) = "+n,
    "\\text{Level of significance (L.O.S.)} = "+los,
    "\\text{Population mean }(\\mu) = "+mu,
    "\\text{Sample mean }(\\bar{X}) = "+xbar,
    "\\text{Sample standard deviation }(s) = "+s,
    "S = \\sqrt{\\tfrac{n}{n-1}}\\times s = \\sqrt{\\tfrac{"+n+"}{"+(n-1)+"}}\\times "+s+" = "+S,
    name+"_{critical} = "+critLabel+" = "+crit,
    name+" = \\dfrac{\\bar{X}-\\mu}{S/\\sqrt{n}} = \\dfrac{"+xbar+"-"+mu+"}{"+S+"/\\sqrt{"+n+"}} = "+stat,
    rule];
  sol.innerHTML="";
  lines.forEach(l=>{const d=document.createElement("div");tex(d,l,false);sol.appendChild(d);});
  ver.className="verdict "+(reject?"reject":"accept");
  ver.innerHTML="";
  tex(ver, reject?"\\textbf{Reject the Null Hypothesis }(\\mathbf{H_0})":"\\textbf{Accept the Null Hypothesis }(\\mathbf{H_0})", false);
  draw(plot, useZ, df, crit, stat, tail, name);
}

function draw(host, useZ, df, crit, stat, tail, name){
  const W=760,H=330,ML=52,MR=18,MT=26,MB=38,PW=W-ML-MR,PH=H-MT-MB;
  const span=Math.max(3.6, Math.abs(stat)*1.15, Math.abs(crit)*1.4);
  const lo=-span, hi=span;
  const pdf=x=>useZ?normPdf(x):tPdf(x,df);
  const X=x=>ML+((x-lo)/(hi-lo))*PW, ymax=pdf(0)*1.12, Y=y=>MT+(1-y/ymax)*PH;
  const N=320, pts=[];
  for(let i=0;i<=N;i++){const x=lo+(i/N)*(hi-lo);pts.push(X(x)+","+Y(pdf(x)));}
  // rejection region(s)
  const regions=[];
  const shade=(a,b)=>{let d="M "+X(a)+" "+Y(0);for(let i=0;i<=120;i++){const x=a+(i/120)*(b-a);d+=" L "+X(x)+" "+Y(pdf(x));}
    d+=" L "+X(b)+" "+Y(0)+" Z";return d;};
  if(tail==="two"){regions.push(shade(lo,-Math.abs(crit)));regions.push(shade(Math.abs(crit),hi));}
  else if(tail==="left"){regions.push(shade(lo,crit));}
  else{regions.push(shade(crit,hi));}
  const ticks=[];for(let v=Math.ceil(lo);v<=Math.floor(hi);v++){if(Math.abs(v)%(span>6?2:1)===0)ticks.push(v);}
  const critMarks = tail==="two"?[-Math.abs(crit),Math.abs(crit)]:[crit];
  host.innerHTML=
   '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(useZ?"Z":"t")+'-distribution with the rejection region shaded, the critical value and the test statistic marked">'+
   '<text x="'+(ML+PW/2)+'" y="14" text-anchor="middle" font-size="12" font-weight="600" fill="#2b2e42">'+
     (useZ?"Z-Distribution PDF":"t-Distribution PDF (df="+df+")")+'</text>'+
   regions.map(d=>'<path d="'+d+'" fill="#f2a3a3" opacity=".55"/>').join("")+
   '<polyline points="'+pts.join(" ")+'" fill="none" stroke="#3b82c4" stroke-width="2"/>'+
   '<line x1="'+ML+'" x2="'+(ML+PW)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#c9cbdd"/>'+
   ticks.map(v=>'<text x="'+X(v)+'" y="'+(Y(0)+16)+'" text-anchor="middle" font-size="10" fill="#8b8fa6">'+v+'</text>').join("")+
   critMarks.map(c=>'<line x1="'+X(c)+'" x2="'+X(c)+'" y1="'+MT+'" y2="'+Y(0)+'" stroke="#1a1c2b" stroke-width="1.6" stroke-dasharray="5 4"/>').join("")+
   '<text x="'+(X(critMarks[0])+6)+'" y="'+(MT+12)+'" font-size="11" fill="#1a1c2b">'+name+'_critical</text>'+
   '<line x1="'+X(Math.max(lo,Math.min(hi,stat)))+'" x2="'+X(Math.max(lo,Math.min(hi,stat)))+'" y1="'+MT+'" y2="'+Y(0)+'" stroke="#1f7a4d" stroke-width="2"/>'+
   '<text x="'+(X(Math.max(lo,Math.min(hi,stat)))+6)+'" y="'+(MT+26)+'" font-size="11" fill="#1f7a4d">'+name+
     (Math.abs(stat)>span?" (off scale: "+stat.toPrecision(6)+")":"")+'</text>'+
   '</svg>';
}

function load(i){
  active=i; const e=EX[i];
  $("mu").value=e.mu; $("xbar").value=e.xbar; $("n").value=e.n; $("s").value=e.s; $("los").value=e.los; $("tail").value=e.tail;
  $("question").innerHTML=e.t.replace(/([\d.]+)/g,"<b>$1</b>");
  [...document.querySelectorAll(".ex")].forEach((b,k)=>b.classList.toggle("on",k===i));
  compute();
}

EX.forEach((e,i)=>{const b=document.createElement("button");b.className="ex";b.type="button";
  b.textContent=e.t.slice(0,72)+"…";b.onclick=()=>load(i);$("examples").appendChild(b);});
F.forEach(id=>$(id).addEventListener("input",compute));
$("tail").addEventListener("change",compute);
window.addEventListener("load",()=>load(0));
load(0);
</script>
</body>
</html>`;

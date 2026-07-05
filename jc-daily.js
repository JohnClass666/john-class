(function(){
  if(window.JCDaily)return;
  var IDLE_LIMIT=180000,TICK=5000,PAGE=location.pathname.split('/').pop()||'index.html';
  var MODULES={
    'vocab.html':{id:'vocab',label:'单词训练'},'reading_sentence.html':{id:'reading',label:'长难句分析',passive:true},
    'grammar.html':{id:'grammar',label:'语法训练'},'grammar_adventure.html':{id:'grammar',label:'语法闯关'},
    'writing.html':{id:'writing',label:'写作纠错'},'listening.html':{id:'listening',label:'听力精听'},
    'speaking.html':{id:'speaking',label:'口语训练'},'speaking-hub.html':{id:'speaking',label:'口语训练'},
    'survival-english.html':{id:'survival',label:'生存英语'},'exam.html':{id:'exam',label:'真题训练'},
    'programmer.html':{id:'programmer',label:'码神专区'},'vocab-programmer.html':{id:'programmer',label:'程序员单词'},
    'programmer-pronunciation.html':{id:'programmer',label:'发音纠正'},'programmer-oral.html':{id:'programmer',label:'程序员口语'}
  };
  var LABELS={vocab:'单词训练',reading:'长难句分析',grammar:'语法训练',writing:'写作纠错',survival:'生存英语',programmer:'码神专区',speaking:'口语训练',listening:'听力精听',exam:'真题训练'};
  var SCORE_FIELDS={vocab_score:'vocab',reading_score:'reading',grammar_score:'grammar',writing_score:'writing',survival_score:'survival',programmer_score:'programmer',speaking_score:'speaking',listening_score:'listening',exam_score:'exam'};
  var SB_URL='https://ghunrrtrdgicbmixsqrc.supabase.co';
  var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodW5ycnRyZGdpY2JtaXhzcXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mzg3OTMsImV4cCI6MjA5NjMxNDc5M30.n3_yRr6iR0gtEo7HSxGWO1jBGs1aaALAchVhqjgnOqs';
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function displayDate(){var d=new Date();return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');}
  function name(){return lsGet('jc_username')||lsGet('jc_student_name')||lsGet('jc_reading_name')||'同学';}
  function key(){return 'jc_daily_report_'+name()+'_'+today();}
  function empty(){return{date:today(),displayDate:displayDate(),user:name(),activeSeconds:0,onlineSeconds:0,modules:{},events:[],startedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};}
  function read(){try{return Object.assign(empty(),JSON.parse(lsGet(key())||'{}'));}catch(e){return empty();}}
  var syncTimer=0;
  function write(log){log.date=today();log.displayDate=displayDate();log.user=name();log.updatedAt=new Date().toISOString();lsSet(key(),JSON.stringify(log));scheduleSync(log);}
  function scheduleSync(log){if(syncTimer)return;syncTimer=setTimeout(function(){syncTimer=0;sync(log);},900);}
  function sync(log){if(!window.fetch||!log||!log.user||log.user==='同学')return;try{fetch(SB_URL+'/rest/v1/daily_logs?on_conflict=user_name,log_date',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_name:log.user,log_date:log.date,progress_data:log,updated_at:new Date().toISOString()})}).catch(function(){});}catch(e){}}
  function recordScore(module,points,label,count,unit){points=parseInt(points,10)||0;if(points<=0)return;module=module||(MODULES[PAGE]&&MODULES[PAGE].id)||'study';label=label||LABELS[module]||module;unit=unit||'分';var log=read(),cur=log.modules[module]||{label:label,points:0,count:0,unit:unit};cur.label=label;cur.unit=unit;cur.points=(cur.points||0)+points;if(count)cur.count=(cur.count||0)+count;log.modules[module]=cur;log.events.push({type:'score',module:module,label:label,points:points,count:count||0,time:new Date().toISOString()});if(log.events.length>80)log.events=log.events.slice(-80);write(log);}
  function addTime(seconds){seconds=parseInt(seconds,10)||0;if(seconds<=0)return;var log=read();log.activeSeconds=(log.activeSeconds||0)+seconds;log.onlineSeconds=(log.onlineSeconds||0)+seconds;write(log);}
  function summary(){var log=read(),mods=Object.keys(log.modules||{}).map(function(k){var m=log.modules[k];return{id:k,label:m.label||LABELS[k]||k,points:m.points||0,count:m.count||0,unit:m.unit||'分'};}).filter(function(m){return m.points>0||m.count>0;});var total=mods.reduce(function(a,m){return a+(m.points||0);},0),minutes=Math.max(0,Math.round((log.activeSeconds||0)/60)),days=Math.max(.5,Math.min(9.9,(minutes/30)+(total/600)));return{user:name(),date:displayDate(),minutes:minutes,totalPoints:total,modules:mods,days:Math.round(days*10)/10,raw:log};}
  function moduleFromKey(k){if(/^jc_reading_week_/.test(k))return'reading';if(/^jc_writing_week_/.test(k))return'writing';if(/^jc_programmer_week_/.test(k))return'programmer';return'';}
  var suppressSet=0,rawSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){var old=lsGet(k),out=rawSet.apply(this,arguments);try{if(suppressSet)return out;var m=moduleFromKey(k);if(m){var a=parseInt(old||'0',10)||0,b=parseInt(v||'0',10)||0;if(b>a)recordScore(m,b-a,LABELS[m],0,'分');}}catch(e){}return out;};
  function wrap(n,fn){var old=window[n];if(typeof old!=='function'||old.__jcDaily)return;var wrapped=fn(old);wrapped.__jcDaily=1;window[n]=wrapped;}
  function installWrappers(){wrap('addPoints',function(old){return function(n){recordScore('vocab',n,'单词训练',0,'分');return old.apply(this,arguments);};});wrap('addReadingWeekScore',function(old){return function(n){recordScore('reading',n,'长难句分析',n?Math.max(1,Math.round(n/50)):0,'句');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});wrap('addWritingWeekScore',function(old){return function(n){recordScore('writing',n,'写作纠错',n?Math.max(1,Math.round(n/15)):0,'题');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});wrap('addProgWeekScore',function(old){return function(n){recordScore('programmer',n,'码神专区',0,'分');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});wrap('awardGrammarScore',function(old){return function(levelId,pts){recordScore('grammar',pts,'语法训练',1,'关');return old.apply(this,arguments);};});wrap('sbUpsertScore',function(old){return function(user,pts){recordScore('survival',pts,'生存英语',1,'场景');return old.apply(this,arguments);};});}
  function patchFetch(){if(!window.fetch||window.fetch.__jcDaily)return;var oldFetch=window.fetch;var nf=function(input,init){try{var url=String(input&&input.url||input||''),body=init&&init.body;if(url.indexOf('/rest/v1/weekly_scores')>-1&&body){var payload=JSON.parse(body);Object.keys(SCORE_FIELDS).forEach(function(f){if(payload[f]>0)recordScore(SCORE_FIELDS[f],0,LABELS[SCORE_FIELDS[f]],0,'分');});}}catch(e){}return oldFetch.apply(this,arguments);};nf.__jcDaily=1;window.fetch=nf;}
  var current=MODULES[PAGE]||null,lastActive=Date.now(),lastTick=Date.now();
  ['click','keydown','touchstart','input','change','pointerdown','scroll','mousemove'].forEach(function(ev){window.addEventListener(ev,function(){lastActive=Date.now();},{passive:true});});
  if(current){setInterval(function(){var now=Date.now(),delta=Math.min(TICK,now-lastTick);lastTick=now;if(document.hidden)return;if(current.passive||now-lastActive<=IDLE_LIMIT)addTime(Math.round(delta/1000));},TICK);document.addEventListener('visibilitychange',function(){lastTick=Date.now();if(!document.hidden)lastActive=Date.now();});}
  setTimeout(installWrappers,0);setTimeout(installWrappers,800);setTimeout(installWrappers,2500);patchFetch();
  window.JCDaily={recordScore:recordScore,summary:summary,read:read,write:write,addTime:addTime};
})();

(function(){
  if(window.JCDaily)return;
  var IDLE_LIMIT=180000;
  var TICK=5000;
  var PAGE=location.pathname.split('/').pop()||'index.html';
  var MODULES={
    'vocab.html':{id:'vocab',label:'单词训练',unit:'分'},
    'reading_sentence.html':{id:'reading',label:'长难句分析',unit:'分',passive:true},
    'grammar.html':{id:'grammar',label:'语法训练',unit:'分'},
    'grammar_adventure.html':{id:'grammar',label:'语法闯关',unit:'分'},
    'writing.html':{id:'writing',label:'写作纠错',unit:'分'},
    'listening.html':{id:'listening',label:'听力精听',unit:'分'},
    'speaking.html':{id:'speaking',label:'口语训练',unit:'分'},
    'speaking-hub.html':{id:'speaking',label:'口语训练',unit:'分'},
    'survival-english.html':{id:'survival',label:'生存英语',unit:'分'},
    'exam.html':{id:'exam',label:'真题训练',unit:'分'},
    'programmer.html':{id:'programmer',label:'码神专区',unit:'分'},
    'vocab-programmer.html':{id:'programmer',label:'程序员单词',unit:'分'},
    'programmer-pronunciation.html':{id:'programmer',label:'发音纠正',unit:'分'},
    'programmer-oral.html':{id:'programmer',label:'程序员口语',unit:'分'}
  };
  var SCORE_FIELDS={
    vocab_score:'vocab',reading_score:'reading',grammar_score:'grammar',writing_score:'writing',
    survival_score:'survival',programmer_score:'programmer',speaking_score:'speaking',
    listening_score:'listening',exam_score:'exam'
  };
  var LABELS={
    vocab:'单词训练',reading:'长难句分析',grammar:'语法训练',writing:'写作纠错',
    survival:'生存英语',programmer:'码神专区',speaking:'口语训练',listening:'听力精听',exam:'真题训练'
  };
  var UNITS={vocab:'分',reading:'分',grammar:'分',writing:'分',survival:'分',programmer:'分',speaking:'分',listening:'分',exam:'分'};
  var SB_URL='https://ghunrrtrdgicbmixsqrc.supabase.co';
  var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodW5ycnRyZGdpY2JtaXhzcXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mzg3OTMsImV4cCI6MjA5NjMxNDc5M30.n3_yRr6iR0gtEo7HSxGWO1jBGs1aaALAchVhqjgnOqs';
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function displayDate(){var d=new Date();return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');}
  function name(){return lsGet('jc_username')||lsGet('jc_student_name')||lsGet('jc_reading_name')||'同学';}
  function key(){return 'jc_daily_report_'+name()+'_'+today();}
  function empty(){
    return {date:today(),displayDate:displayDate(),user:name(),activeSeconds:0,onlineSeconds:0,
      modules:{},events:[],startedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  }
  function read(){try{return Object.assign(empty(),JSON.parse(lsGet(key())||'{}'));}catch(e){return empty();}}
  var syncTimer=0;
  function write(log){log.date=today();log.displayDate=displayDate();log.user=name();log.updatedAt=new Date().toISOString();lsSet(key(),JSON.stringify(log));scheduleSync(log);}
  function scheduleSync(log){
    if(syncTimer)return;
    syncTimer=setTimeout(function(){syncTimer=0;sync(log);},900);
  }
  function sync(log){
    if(!window.fetch||!log||!log.user||log.user==='同学')return;
    try{
      fetch(SB_URL+'/rest/v1/daily_logs?on_conflict=user_name,log_date',{
        method:'POST',
        headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({user_name:log.user,log_date:log.date,progress_data:log,updated_at:new Date().toISOString()})
      }).catch(function(){});
    }catch(e){}
  }
  function normalizeModule(m){return MODULES[PAGE]&&MODULES[PAGE].id||m||'study';}
  function recordScore(module,points,label,count,unit){
    points=parseInt(points,10)||0;if(points<=0)return;
    module=normalizeModule(module);label=label||LABELS[module]||module;unit=unit||UNITS[module]||'分';
    var log=read(), cur=log.modules[module]||{label:label,points:0,count:0,unit:unit};
    cur.label=label;cur.unit=unit;cur.points=(cur.points||0)+points;
    if(count)cur.count=(cur.count||0)+count;
    log.modules[module]=cur;
    log.events.push({type:'score',module:module,label:label,points:points,count:count||0,time:new Date().toISOString()});
    if(log.events.length>80)log.events=log.events.slice(-80);
    write(log);
  }
  function ensureTimeFields(log){
    if(!log.activeMs)log.activeMs=(log.activeSeconds||0)*1000;
    if(!log.onlineMs)log.onlineMs=(log.onlineSeconds||0)*1000;
    return log;
  }
  function addElapsed(ms){
    ms=Math.floor(Number(ms)||0);if(ms<=0)return;
    var log=ensureTimeFields(read());
    log.activeMs=(log.activeMs||0)+ms;
    log.onlineMs=(log.onlineMs||0)+ms;
    log.activeSeconds=Math.floor((log.activeMs||0)/1000);
    log.onlineSeconds=Math.floor((log.onlineMs||0)/1000);
    write(log);
  }
  function addTime(seconds){
    seconds=Number(seconds)||0;if(seconds<=0)return;
    addElapsed(seconds*1000);
  }
  function formatTime(seconds){
    seconds=Math.max(0,Math.floor(Number(seconds)||0));
    var h=Math.floor(seconds/3600), m=Math.floor((seconds%3600)/60), s=seconds%60;
    if(h>0)return h+'小时'+String(m).padStart(2,'0')+'分';
    if(m>0)return m+'分'+String(s).padStart(2,'0')+'秒';
    return s+'秒';
  }
  function summary(){
    var log=ensureTimeFields(read()), mods=Object.keys(log.modules||{}).map(function(k){var m=log.modules[k];return {id:k,label:m.label||LABELS[k]||k,points:m.points||0,count:m.count||0,unit:m.unit||'分'};}).filter(function(m){return m.points>0||m.count>0;});
    var total=mods.reduce(function(a,m){return a+(m.points||0);},0);
    var seconds=Math.max(0,Math.floor((log.activeMs||0)/1000));
    var minutes=Math.floor(seconds/60);
    var days=Math.min(9.9,(seconds/60/30)+(total/600));
    return {user:name(),date:displayDate(),seconds:seconds,minutes:minutes,timeText:formatTime(seconds),totalPoints:total,modules:mods,days:Math.round(days*10)/10,raw:log};
  }
  function moduleFromKey(k){
    if(/^jc_reading_week_/.test(k))return 'reading';
    if(/^jc_writing_week_/.test(k))return 'writing';
    if(/^jc_programmer_week_/.test(k))return 'programmer';
    return '';
  }
  var suppressSet=0;
  var rawSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    var old=lsGet(k), out=rawSet.apply(this,arguments);
    try{
      if(suppressSet)return out;
      var m=moduleFromKey(k);
      if(m){
        var a=parseInt(old||'0',10)||0,b=parseInt(v||'0',10)||0;
        if(b>a)recordScore(m,b-a,LABELS[m],0,'分');
      }
    }catch(e){}
    return out;
  };
  function wrap(name,fn){
    var old=window[name];if(typeof old!=='function'||old.__jcDaily)return;
    var wrapped=fn(old);wrapped.__jcDaily=1;window[name]=wrapped;
  }
  function installWrappers(){
    wrap('addPoints',function(old){return function(n){recordScore('vocab',n,'单词训练',0,'分');return old.apply(this,arguments);};});
    wrap('addReadingWeekScore',function(old){return function(n){recordScore('reading',n,'长难句分析',n?Math.max(1,Math.round(n/50)):0,'句');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});
    wrap('addWritingWeekScore',function(old){return function(n){recordScore('writing',n,'写作纠错',n?Math.max(1,Math.round(n/15)):0,'题');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});
    wrap('addProgWeekScore',function(old){return function(n){recordScore('programmer',n,'码神专区',0,'分');suppressSet++;try{return old.apply(this,arguments);}finally{suppressSet--;}};});
    wrap('awardGrammarScore',function(old){return function(levelId,pts){recordScore('grammar',pts,'语法训练',1,'关');return old.apply(this,arguments);};});
    wrap('sbUpsertScore',function(old){return function(user,pts){recordScore('survival',pts,'生存英语',1,'场景');return old.apply(this,arguments);};});
  }
  function patchFetch(){
    if(!window.fetch||window.fetch.__jcDaily)return;
    var oldFetch=window.fetch;
    var nf=function(input,init){
      try{
        var url=String(input&&input.url||input||'');
        var body=init&&init.body;
        if(url.indexOf('/rest/v1/weekly_scores')>-1&&body){
          var payload=JSON.parse(body), fields=Object.keys(SCORE_FIELDS);
          fields.forEach(function(f){if(payload[f]>0){recordScore(SCORE_FIELDS[f],0,LABELS[SCORE_FIELDS[f]],0,'分');}});
        }
      }catch(e){}
      return oldFetch.apply(this,arguments);
    };
    nf.__jcDaily=1;window.fetch=nf;
  }
  var current=MODULES[PAGE]||null;
  function nowMs(){return (window.performance&&performance.now)?performance.now():Date.now();}
  var lastActive=Date.now(), lastMark=nowMs();
  function markActive(){lastActive=Date.now();}
  ['click','keydown','touchstart','input','change','pointerdown','scroll','mousemove'].forEach(function(ev){window.addEventListener(ev,markActive,{passive:true});});
  if(current){
    function flushTime(countEvenIfHidden){
      var now=nowMs(), delta=Math.max(0,now-lastMark);
      lastMark=now;
      if(document.hidden&&!countEvenIfHidden)return;
      if(current.passive||Date.now()-lastActive<=IDLE_LIMIT)addElapsed(delta);
    }
    setInterval(flushTime,TICK);
    document.addEventListener('visibilitychange',function(){flushTime(document.hidden);lastMark=nowMs();if(!document.hidden)markActive();});
    window.addEventListener('pagehide',function(){flushTime(true);});
    window.addEventListener('beforeunload',function(){flushTime(true);});
  }
  setTimeout(installWrappers,0);setTimeout(installWrappers,800);setTimeout(installWrappers,2500);patchFetch();
  window.JCDaily={recordScore:recordScore,summary:summary,read:read,write:write,addTime:addTime};
})();

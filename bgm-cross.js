/* bgm-cross.js — 跨页面 BGM 连续播放 */
(function(){
  var KEY_TIME = 'bgm_time';
  var KEY_PLAYING = 'bgm_playing';

  // 学习板块页面（进了就停 BGM）
  var LEARNING = ['vocab.html','reading_sentence.html','grammar.html','exam.html',
                   'writing.html','listening.html','grammar_adventure.html'];
  var isLearning = LEARNING.some(function(p){
    return location.pathname.indexOf(p) >= 0;
  });

  // 进入学习页：记录当前位置并停止
  if(isLearning){
    localStorage.setItem(KEY_PLAYING, '0');
    var stopTimer = setInterval(function(){
      var as = document.querySelectorAll('audio');
      for(var i=0; i<as.length; i++){
        if(!as[i].paused && as[i].currentTime > 0){
          localStorage.setItem(KEY_TIME, as[i].currentTime);
        }
        as[i].pause();
      }
    }, 500);
    setTimeout(function(){ clearInterval(stopTimer); }, 3000);
    return;
  }

  // Hub 页：恢复播放
  var savedTime = parseFloat(localStorage.getItem(KEY_TIME) || '0');
  var wasPlaying = localStorage.getItem(KEY_PLAYING) !== '0';
  localStorage.setItem(KEY_PLAYING, '1');

  if(savedTime > 0 || wasPlaying){
    var poll = setInterval(function(){
      var as = document.querySelectorAll('audio');
      for(var i=0; i<as.length; i++){
        var a = as[i];
        if(a.readyState >= 2 && savedTime > 0 && Math.abs(a.currentTime - savedTime) > 2){
          a.currentTime = savedTime;
        }
        if(a.paused){
          a.play().catch(function(){});
        }
      }
      if(as.length > 0 && !as[0].paused) savedTime = 0; // synced, stop seeking
    }, 300);
    setTimeout(function(){ clearInterval(poll); }, 10000);
  }

  // 离页存进度
  window.addEventListener('beforeunload', function(){
    var as = document.querySelectorAll('audio');
    for(var i=0; i<as.length; i++){
      if(!as[i].paused && as[i].currentTime > 0){
        localStorage.setItem(KEY_TIME, as[i].currentTime);
      }
    }
  });
})();

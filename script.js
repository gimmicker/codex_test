// Cat & Ball game logic using jQuery
$(function(){
  const $ball = $('#ball');
  const $cat = $('#cat');
  const $score = $('#score');
  const $status = $('#status');
  const $particles = $('#particles');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = $(window).width();
  let height = $(window).height();
  const radius = 30;
  let score = 0;
  let paused = false;
  let typed = '';

  const ball = {x: width/2, y: height/2, vx:2, vy:-2, dragging:false};

  function resize(){
    width = $(window).width();
    height = $(window).height();
  }
  $(window).on('resize', resize);

  function updateHUD(){
    $score.text('Score: '+score);
    $status.text(paused ? 'Paused' : '');
  }

  function reset(){
    ball.x = width/2;
    ball.y = height/2;
    ball.vx = 2;
    ball.vy = -2;
    score = 0;
    paused = false;
    updateHUD();
  }

  function playBounce(){
    if(!window.AudioContext) return;
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime+0.1);
  }

  function playMeow(){
    if(!window.AudioContext) return;
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type='sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime+0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime+0.5);
  }

  function emitParticle(){
    if(reduceMotion) return;
    const $p = $('<div class="particle"></div>');
    const size = Math.random()*8+4;
    $p.css({left:ball.x+radius, top:ball.y+radius, width:size, height:size});
    $particles.append($p);
    setTimeout(()=>{$p.remove();},1000);
  }

  function checkCatInteraction(){
    const catOffset = $cat.offset();
    const catW = $cat.width();
    const catH = $cat.height();
    const catX = catOffset.left + catW/2;
    const catY = catOffset.top + catH/2;
    const bx = ball.x + radius;
    const by = ball.y + radius;
    const dx = bx - catX;
    const dy = by - catY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < 150){
      $cat.addClass('hit');
      if(dist < 100){
        ball.vx += dx*0.02;
        ball.vy += -Math.abs(dy)*0.02;
        playMeow();
      }
    }else{
      $cat.removeClass('hit');
    }
  }

  function animate(){
    if(!paused){
      if(!ball.dragging){
        ball.vy += 0.2; // gravity
        ball.x += ball.vx;
        ball.y += ball.vy;
      }
      // collision with walls
      if(ball.x < 0){ ball.x = 0; ball.vx *= -1; score++; emitParticle(); playBounce(); }
      if(ball.x > width - radius*2){ ball.x = width - radius*2; ball.vx *= -1; score++; emitParticle(); playBounce(); }
      if(ball.y < 0){ ball.y = 0; ball.vy *= -1; score++; emitParticle(); playBounce(); }
      if(ball.y > height - radius*2){ ball.y = height - radius*2; ball.vy *= -0.9; score++; emitParticle(); playBounce(); }
      $ball.css({left:ball.x, top:ball.y});
      checkCatInteraction();
    }
    updateHUD();
    requestAnimationFrame(animate);
  }

  // Parallax effect
  $(document).on('mousemove', function(e){
    const px = (e.pageX/width - 0.5)*20;
    const py = (e.pageY/height - 0.5)*20;
    $('.layer').each(function(i){
      const depth = (i+1)*10;
      $(this).css('transform', `translate(${-px/depth}px, ${-py/depth}px)`);
    });
    // Eyes follow
    $('.pupil').each(function(){
      const $eye = $(this).parent();
      const off = $eye.offset();
      const ex = off.left + $eye.width()/2;
      const ey = off.top + $eye.height()/2;
      const angle = Math.atan2(e.pageY - ey, e.pageX - ex);
      const max = 8;
      $(this).css('transform', `translate(${Math.cos(angle)*max}px, ${Math.sin(angle)*max}px)`);
    });
  });

  // Dragging the ball
  $ball.on('mousedown touchstart', function(e){
    ball.dragging = true;
    paused = false;
    const startX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
    const startY = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
    const offsetX = startX - ball.x;
    const offsetY = startY - ball.y;
    let lastX = ball.x, lastY = ball.y;
    function move(ev){
      const x = ev.originalEvent.touches ? ev.originalEvent.touches[0].pageX : ev.pageX;
      const y = ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY;
      ball.x = x - offsetX;
      ball.y = y - offsetY;
      ball.vx = ball.x - lastX;
      ball.vy = ball.y - lastY;
      lastX = ball.x; lastY = ball.y;
      $ball.css({left:ball.x, top:ball.y});
    }
    function up(){
      $(document).off('mousemove touchmove', move);
      $(document).off('mouseup touchend', up);
      ball.dragging = false;
    }
    $(document).on('mousemove touchmove', move);
    $(document).on('mouseup touchend', up);
    return false;
  });

  // Keyboard controls
  $(document).on('keydown', function(e){
    if(e.key === ' '){
      paused = !paused; updateHUD();
    }else if(e.key === 'r' || e.key === 'R'){
      reset();
    }else if(e.key === 'ArrowLeft'){
      ball.vx -= 1;
    }else if(e.key === 'ArrowRight'){
      ball.vx += 1;
    }else if(e.key === 'ArrowUp'){
      ball.vy -= 3;
    }
    typed += e.key.toLowerCase();
    if(typed.length>4) typed = typed.slice(-4);
    if(typed === 'meow'){
      playMeow();
      ball.vx = (Math.random()*10-5);
      ball.vy = -10;
      typed='';
    }
  });

  // Mobile buttons
  $('#btn-left').on('mousedown touchstart', function(e){ball.vx -=2; e.preventDefault();});
  $('#btn-right').on('mousedown touchstart', function(e){ball.vx +=2; e.preventDefault();});
  $('#btn-jump').on('mousedown touchstart', function(e){ball.vy -=5; e.preventDefault();});

  reset();
  requestAnimationFrame(animate);
});

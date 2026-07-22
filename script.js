// *** NAV ***
const navToggle = document.querySelector('.nav__toggle');
const navList = document.querySelector('.nav__list');
if(navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) navList.querySelector('.nav__link, .nav__cta').focus();
  });
}
// Close mobile nav on link click
navList && navList.addEventListener('click', (e) => {
  if(e.target.matches('a') && window.innerWidth < 900){navList.classList.remove('open');navToggle.setAttribute('aria-expanded','false');}
});

// *** HERO IMAGE - FADE-IN ***
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    document.querySelector('.hero__image').classList.add('visible');
  }, 150);
});

// *** SCROLL ANIMATIONS (SECTION FADE IN-UP) ***
const observer = new window.IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
  });
},{threshold:0.2});
document.querySelectorAll('main > section, .service-card, .testimonial-card, .blog-card, .location-card').forEach(sec=>{
  sec.classList.add('fade-in-section');observer.observe(sec);
});

// *** SMOOTH SCROLL for in-page nav ***
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',function(e){
    const id = this.getAttribute('href');
    if(id.length>1 && document.querySelector(id)){
      e.preventDefault();
      document.querySelector(id).scrollIntoView({behavior:'smooth'});
    }
  });
});

// *** FORM VALIDATION & SUBMIT FEEDBACK (front only) ***
const form = document.querySelector('.contact__form');
const feedback = form?.querySelector('.form__feedback');
form && form.addEventListener('submit', function(e){
  e.preventDefault();
  if(!form.checkValidity()){
    feedback.style.display='block';feedback.textContent='Please fill in all required fields.';return;
  }
  feedback.style.display='block';
  feedback.textContent = 'Thank you! Your request has been received.';
  form.reset();
  setTimeout(()=>{feedback.style.display='none';},4000);
});

// *** ACCESSIBILITY: Text resize (A+) ***
const accBtn = document.querySelector('.accessibility-btn');
let textSize = 1;
accBtn && accBtn.addEventListener('click',() => {
  textSize = (textSize % 3) + 1; // cycles: 1x, 1.14x, 1.22x
  document.body.style.fontSize = `${1+0.12*(textSize-1)}rem`;
});

// **** CHATBOT WIDGET + VOICE ****
const cbWidget = document.getElementById('chatbot-widget');
const cbToggle = cbWidget.querySelector('.chatbot-toggle');
const cbPanel = cbWidget.querySelector('.chatbot-panel');
const cbClose = cbWidget.querySelector('.chatbot-close');
const cbForm = cbWidget.querySelector('.chatbot-form');
const cbInput = cbWidget.querySelector('.chatbot-input');
const cbHistory = cbWidget.querySelector('.chatbot-history');
const cbMicBtn = cbWidget.querySelector('.chatbot-mic');
let isRecording = false, mediaRecorder, audioChunks=[];

// Open/Close
cbToggle.addEventListener('click', ()=>{
  cbWidget.classList.add('open');
  cbPanel.setAttribute('aria-hidden','false');
  setTimeout(()=>cbInput.focus(),190);
});
cbClose.addEventListener('click', ()=>{
  cbWidget.classList.remove('open');
  cbPanel.setAttribute('aria-hidden','true');
});
// ESC to close
cbPanel.addEventListener('keydown', e=>{
  if(e.key==='Escape'){cbWidget.classList.remove('open');cbPanel.setAttribute('aria-hidden','true');cbToggle.focus();}
});
// Trap focus
cbPanel.addEventListener('keydown', function(e){
  if(e.key!=='Tab')return;
  const focusables = cbPanel.querySelectorAll('button, input, textarea');
  const firstF = focusables[0], lastF=focusables[focusables.length-1];
  if(e.shiftKey && document.activeElement===firstF){e.preventDefault();lastF.focus();}
  else if(!e.shiftKey && document.activeElement===lastF){e.preventDefault();firstF.focus();}
});
// Send message
cbForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const msg = cbInput.value.trim();
  if(!msg) return;
  chatAppend(msg,true);
  cbInput.value='';
  const resp = await fetch('https://overstay-choosy-succulent.ngrok-free.dev/webhook/chat',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:msg,companyId:'agha-khan-repo',companyName:'agha khan'})
  });
  const data = await resp.json();
  chatAppend(data.reply || 'Sorry, I did not understand.',false);
});
// Chat append
function chatAppend(msg,isUser){
  const d=document.createElement('div');
  d.className='chatbot-msg'+(isUser?' chatbot-msg--user':' chatbot-msg--bot');
  d.textContent=msg; cbHistory.appendChild(d);cbHistory.scrollTop=cbHistory.scrollHeight;
}
// Restore scroll to bottom if new
const origHist=cbHistory.innerHTML;
cbPanel.addEventListener('transitionend',function(){
  cbHistory.scrollTop=cbHistory.scrollHeight;
});
// Keyboard accessibility to open with Tab
cbToggle.addEventListener('keydown',function(e){
  if(e.key==="Enter"||e.key===' '){e.preventDefault();cbToggle.click();}
});

// VOICE MESSAGE
cbMicBtn.addEventListener('click', async function(){
  if(!isRecording){
    try{
      let stream = await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e=> { if(e.data.size) audioChunks.push(e.data);};
      mediaRecorder.onstop = sendVoice;
      mediaRecorder.start();
      isRecording = true;
      cbMicBtn.classList.add('recording');
    }catch(err){alert('Unable to access mic');}
  } else { mediaRecorder && mediaRecorder.state==='recording' && mediaRecorder.stop(); cbMicBtn.classList.remove('recording'); isRecording = false; }
});
function sendVoice(){
  const blob = new Blob(audioChunks, {type:'audio/webm'});
  let fd = new FormData();
  fd.append('audio', blob, 'vaudio.webm');
  fd.append('companyId', 'agha-khan-repo');
  fd.append('companyName', 'agha khan');
  chatAppend('[Voice message sent...]', true);
  fetch('https://overstay-choosy-succulent.ngrok-free.dev/webhook/voice-chat', {method:'POST', body: fd})
    .then(r => r.json()).then(data => {
      if(data.replyText) chatAppend(data.replyText, false);
      if(data.replyAudioBase64){
        let audio = new Audio();
        let src = atob(data.replyAudioBase64.split(',')[1]||data.replyAudioBase64);
        let arr = new Uint8Array(src.length);
        for(let i=0;i<src.length;i++) arr[i]=src.charCodeAt(i);
        let blob = new Blob([arr],{type:'audio/mp3'});
        audio.src = URL.createObjectURL(blob);
        audio.play();
      }
    }).catch(()=>chatAppend('Sorry, could not process voice.',false));
}
// Recording indicator - auto stop after 12 sec or prolonged silence
if (window.MediaRecorder) {
  let tmr = null;
  cbMicBtn.addEventListener('mousedown',()=>{tmr=setTimeout(()=>{if(isRecording) {mediaRecorder.stop();cbMicBtn.classList.remove('recording');isRecording=false;}},12000);});
  cbMicBtn.addEventListener('mouseup',()=>{if(tmr){clearTimeout(tmr);tmr=null;}});
}

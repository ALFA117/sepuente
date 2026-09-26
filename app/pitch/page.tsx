"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:var(--bg-deep);color:var(--cream);font-family:'Inter',sans-serif}
a{color:inherit;text-decoration:none}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}

#deck{position:fixed;inset:0;display:flex;flex-direction:column}
.slides-wrap{position:relative;flex:1;overflow:hidden}

@keyframes slideInRight{from{opacity:0;transform:translateX(70px);filter:blur(6px)}to{opacity:1;transform:translateX(0);filter:blur(0)}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-70px);filter:blur(6px)}to{opacity:1;transform:translateX(0);filter:blur(0)}}
@keyframes slideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-70px);filter:blur(6px)}}
@keyframes slideOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(70px);filter:blur(6px)}}
@keyframes enterUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes floatRotate{0%{transform:translateY(0) rotate(0deg);filter:drop-shadow(0 0 24px rgb(var(--gold-rgb) / 0.5))}33%{transform:translateY(-12px) rotate(120deg);filter:drop-shadow(0 0 48px rgb(var(--gold-rgb) / 0.85))}66%{transform:translateY(-5px) rotate(240deg)}100%{transform:translateY(0) rotate(360deg);filter:drop-shadow(0 0 24px rgb(var(--gold-rgb) / 0.5))}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 rgb(var(--gold-rgb) / 0)}50%{box-shadow:0 0 60px rgb(var(--gold-rgb) / 0.2)}}
@keyframes orb1{0%,100%{transform:translate(0,0)}33%{transform:translate(40px,-30px)}66%{transform:translate(-20px,40px)}}
@keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,30px)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes drawLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}

.slide{
  position:absolute;inset:0;
  display:flex;flex-direction:column;justify-content:center;
  padding:80px 10vw 100px;
  opacity:0;pointer-events:none;
  will-change:transform,opacity,filter;
}
.slide.active{opacity:1;pointer-events:auto}
.slide.anim-in-right{animation:slideInRight .55s cubic-bezier(.16,1,.3,1) both}
.slide.anim-in-left{animation:slideInLeft .55s cubic-bezier(.16,1,.3,1) both}
.slide.anim-out-left{animation:slideOutLeft .55s cubic-bezier(.16,1,.3,1) both}
.slide.anim-out-right{animation:slideOutRight .55s cubic-bezier(.16,1,.3,1) both}

.slide.active .animate-in{animation:enterUp .7s cubic-bezier(.16,1,.3,1) both}
.slide.active .animate-in:nth-child(2){animation-delay:.08s}
.slide.active .animate-in:nth-child(3){animation-delay:.16s}
.slide.active .animate-in:nth-child(4){animation-delay:.24s}
.slide.active .animate-in:nth-child(5){animation-delay:.32s}
.slide.active .animate-in:nth-child(6){animation-delay:.40s}

#nav-bar{
  display:flex;align-items:center;gap:16px;
  padding:0 24px;height:60px;flex-shrink:0;
  background:rgb(var(--navy-deep-rgb) / 0.85);backdrop-filter:blur(20px);
  border-top:1px solid rgb(var(--line-rgb) / 0.12);z-index:100;
}
.nav-brand{display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-weight:700;font-size:.9rem;flex-shrink:0}
.nav-sym{font-size:1.2rem;color:var(--gold)}
.nav-controls{display:flex;align-items:center;gap:10px;margin-left:auto}
.nav-btn{
  width:34px;height:34px;border-radius:8px;
  background:transparent;border:1px solid rgb(var(--line-rgb) / 0.12);
  color:var(--subtle);font-size:1rem;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:background .15s,border-color .15s,color .15s;
}
.nav-btn:hover:not(:disabled){background:rgb(var(--gold-rgb) / 0.08);border-color:rgb(var(--gold-rgb) / 0.25);color:var(--gold)}
.nav-btn:disabled{opacity:.3;cursor:default}
.slide-counter{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--subtle);min-width:50px;text-align:center}
.dots{display:flex;gap:6px;align-items:center}
.dot{width:6px;height:6px;border-radius:50%;background:var(--subtle);opacity:.35;transition:all .25s cubic-bezier(.16,1,.3,1);cursor:pointer;border:none}
.dot.active{width:22px;border-radius:3px;background:var(--gold);opacity:1}
.dot:hover{opacity:.7}
.nav-gh{
  display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:7px;
  border:1px solid rgb(var(--gold-rgb) / 0.25);font-size:.75rem;font-weight:600;color:var(--gold);
  transition:background .15s;flex-shrink:0;
}
.nav-gh:hover{background:rgb(var(--gold-rgb) / 0.08)}

#progress-line{
  position:fixed;top:0;left:0;height:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-hover),var(--info));
  transition:width .45s cubic-bezier(.16,1,.3,1);z-index:1000;
}

.slide-inner{width:100%;max-width:1100px;margin:0 auto}
.slide-label{
  font-family:'JetBrains Mono',monospace;
  font-size:.72rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
  color:var(--gold);margin-bottom:18px;opacity:.8;
}
.slide-h{
  font-family:var(--font-display);
  font-size:clamp(2.6rem,5vw,4.6rem);
  font-weight:800;line-height:1.05;letter-spacing:-.025em;
}
.slide-h .g{
  background:linear-gradient(90deg,var(--gold),var(--gold-hover));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.slide-h .b{color:var(--info)}
.slide-sub{font-size:1.05rem;color:var(--subtle);line-height:1.7;max-width:600px}
.mono{font-family:'JetBrains Mono',monospace;color:var(--info)}

/* ── SLIDE 1 ── */
#s1{text-align:center;align-items:center;justify-content:center;background:radial-gradient(ellipse 90% 70% at 50% 45%,var(--bg) 0%,var(--bg-deep) 70%)}
#s1::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgb(var(--info-rgb) / 0.03) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--info-rgb) / 0.03) 1px,transparent 1px);
  background-size:64px 64px;
  mask-image:radial-gradient(ellipse 70% 80% at 50% 50%,black 0%,transparent 75%);
}
.s1-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(60px)}
.s1-orb1{width:500px;height:500px;top:-10%;left:50%;transform:translateX(-50%);background:radial-gradient(rgb(var(--gold-rgb) / 0.1),transparent 70%);animation:orb1 10s ease-in-out infinite}
.s1-orb2{width:350px;height:350px;bottom:5%;right:10%;background:radial-gradient(rgb(var(--info-rgb) / 0.08),transparent 70%);animation:orb2 14s ease-in-out infinite}
.s1-orb3{width:300px;height:300px;bottom:0;left:5%;background:radial-gradient(rgb(var(--success-rgb) / 0.07),transparent 70%);animation:orb1 12s 3s ease-in-out infinite}
.s1-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
.s1-symbol{
  font-size:clamp(80px,14vw,150px);line-height:1;color:transparent;
  -webkit-text-stroke:1.5px rgb(var(--gold-rgb) / 0.35);font-family:var(--font-display);font-weight:800;
  margin-bottom:24px;animation:floatRotate 10s linear infinite;
}
.s1-title{
  font-family:var(--font-display);font-weight:800;
  font-size:clamp(2.8rem,6.5vw,5.8rem);line-height:1;letter-spacing:-.035em;
  background:linear-gradient(135deg,var(--cream) 0%,var(--gold) 50%,var(--info) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  background-size:200% auto;animation:shimmer 6s linear infinite;margin-bottom:14px;
}
.s1-subtitle{font-size:1.1rem;color:var(--subtle);margin-bottom:36px;max-width:480px;text-align:center;line-height:1.6}
.s1-tags{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.s1-tag{
  padding:5px 14px;border-radius:100px;border:1px solid rgb(var(--line-rgb) / 0.12);
  font-size:.72rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--subtle);
  transition:border-color .2s,color .2s;
}
.s1-tag.hi{border-color:rgb(var(--success-rgb) / 0.35);color:var(--success)}

/* ── SLIDE 2 ── */
#s2{background:linear-gradient(135deg,var(--bg-deep) 0%,var(--bg-deep) 100%)}
#s2 .grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;margin-top:40px}
.quote{font-family:var(--font-display);font-size:clamp(1.7rem,2.8vw,2.4rem);font-weight:700;line-height:1.25;color:var(--cream)}
.quote em{font-style:italic;background:linear-gradient(90deg,var(--gold),var(--gold-hover));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pain-items{display:flex;flex-direction:column;gap:0}
.pain{display:flex;align-items:flex-start;gap:16px;padding:18px 0;border-bottom:1px solid rgb(var(--line-rgb) / 0.12)}
.pain:first-child{border-top:1px solid rgb(var(--line-rgb) / 0.12)}
.pain-x{flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;margin-top:1px}
.pain-x.no{background:rgb(var(--danger-rgb) / 0.1);color:var(--danger)}
.pain-x.yes{background:rgb(var(--success-rgb) / 0.1);color:var(--success)}
.pain-t{font-size:.9rem;color:var(--subtle);line-height:1.6}
.pain-t strong{color:var(--cream);font-weight:600}

/* ── SLIDE 3 ── */
#s3{background:var(--bg-deep);text-align:center;align-items:center}
.big-desc{font-family:var(--font-display);font-weight:700;font-size:clamp(1.25rem,2.2vw,1.8rem);color:var(--subtle);line-height:1.55;max-width:700px;margin-top:28px;margin-bottom:36px}
.big-desc strong{color:var(--cream)}
.big-desc .hi{background:linear-gradient(90deg,var(--gold),var(--gold-hover));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-style:italic}
.stat-row{display:flex;gap:48px;justify-content:center;margin-bottom:40px;flex-wrap:wrap}
.big-stat{text-align:center;padding:20px 24px;border-radius:16px;background:rgb(var(--white-rgb) / 0.03);border:1px solid rgb(var(--line-rgb) / 0.12);min-width:130px}
.big-stat-n{font-family:var(--font-display);font-weight:800;font-size:clamp(2.4rem,4vw,3.5rem);color:var(--gold);line-height:1;letter-spacing:-.03em}
.big-stat-l{font-size:.73rem;color:var(--subtle);margin-top:6px;letter-spacing:.04em;text-transform:uppercase}
.attrs{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
.attr{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 28px;border-radius:16px;border:1px solid rgb(var(--line-rgb) / 0.12);background:var(--bg-deep);min-width:150px;transition:border-color .25s,transform .25s cubic-bezier(.34,1.56,.64,1)}
.attr:hover{border-color:rgb(var(--gold-rgb) / 0.25);transform:translateY(-4px)}
.attr-icon{width:40px;height:40px;display:flex;align-items:center;justify-content:center}
.attr-label{font-family:var(--font-display);font-weight:700;font-size:.85rem;color:var(--cream)}
.attr-sub{font-size:.72rem;color:var(--subtle);text-align:center;line-height:1.4}

/* ── SLIDE 4 ── */
#s4 .flow{display:flex;align-items:flex-start;gap:0;margin-top:44px;position:relative}
.flow-connector{
  position:absolute;top:36px;left:36px;right:36px;height:1px;
  background:linear-gradient(90deg,transparent,rgb(var(--gold-rgb) / 0.25),var(--gold),rgb(var(--gold-rgb) / 0.25),transparent);
  transform-origin:left;transform:scaleX(0);
}
.slide.active .flow-connector{animation:drawLine .8s .3s cubic-bezier(.16,1,.3,1) forwards}
.step{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 10px;position:relative}
.slide.active .step{animation:enterUp .6s cubic-bezier(.16,1,.3,1) both}
.slide.active .step:nth-child(2){animation-delay:.1s}
.slide.active .step:nth-child(3){animation-delay:.2s}
.slide.active .step:nth-child(4){animation-delay:.3s}
.slide.active .step:nth-child(5){animation-delay:.4s}
.slide.active .step:nth-child(6){animation-delay:.5s}
.step-n{width:72px;height:72px;border-radius:20px;background:var(--bg-deep);border:1.5px solid rgb(var(--gold-rgb) / 0.25);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:14px;flex-shrink:0;position:relative;z-index:1;transition:border-color .25s,transform .25s cubic-bezier(.34,1.56,.64,1)}
.step:hover .step-n{border-color:var(--gold);transform:translateY(-3px)}
.step-badge{position:absolute;top:-8px;right:-8px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:var(--bg-deep);font-family:var(--font-display);font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center}
.step-title{font-family:var(--font-display);font-weight:700;font-size:.78rem;letter-spacing:.05em;text-transform:uppercase;color:var(--gold);margin-bottom:7px}
.step-desc{font-size:.77rem;color:var(--subtle);line-height:1.55}
.step-code{display:inline-block;margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:.62rem;color:var(--info);background:rgb(var(--info-rgb) / 0.06);padding:2px 7px;border-radius:4px;border:1px solid rgb(var(--info-rgb) / 0.12)}

/* ── SLIDE 5 ── */
#s5{background:var(--bg-deep)}
#s5 .diag{margin-top:36px;background:rgb(var(--navy-deep-rgb) / 0.6);border:1px solid rgb(var(--line-rgb) / 0.12);border-radius:20px;padding:32px;overflow-x:auto;backdrop-filter:blur(4px)}
.d-row{display:flex;align-items:center;gap:0;min-width:640px}
.d-node{flex:1;background:rgb(var(--navy-rgb) / 0.9);border:1px solid rgb(var(--line-rgb) / 0.12);border-radius:14px;padding:18px 14px;text-align:center;transition:border-color .2s,transform .2s}
.d-node:hover{border-color:rgb(var(--info-rgb) / 0.25);transform:translateY(-2px)}
.d-node.center{background:linear-gradient(135deg,rgb(var(--gold-rgb) / 0.08),rgb(var(--info-rgb) / 0.04));border-color:rgb(var(--gold-rgb) / 0.3);flex:1.4}
.d-name{font-family:var(--font-display);font-weight:700;font-size:.85rem;color:var(--cream)}
.d-sub{font-size:.68rem;color:var(--subtle);margin-top:4px;line-height:1.4}
.d-badges{display:flex;gap:4px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.d-badge{padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:.6rem;background:rgb(var(--info-rgb) / 0.08);border:1px solid rgb(var(--info-rgb) / 0.15);color:var(--info)}
.d-arr{flex:0 0 auto;padding:0 8px;display:flex;flex-direction:column;align-items:center;gap:2px}
.d-arr-sym{color:var(--gold);opacity:.7;font-size:.9rem}
.d-arr-label{font-family:'JetBrains Mono',monospace;font-size:.56rem;color:var(--subtle);white-space:nowrap}

/* ── SLIDE 6 ── */
#s6 .seps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}
.sep{border:1px solid rgb(var(--line-rgb) / 0.12);border-radius:16px;padding:26px 18px;background:var(--bg-deep);position:relative;overflow:hidden;transition:border-color .25s,transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;cursor:default}
.sep:hover{border-color:rgb(var(--gold-rgb) / 0.35);transform:translateY(-4px);box-shadow:0 16px 48px rgb(var(--shadow-rgb) / 0.4)}
.sep::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--info));transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.16,1,.3,1)}
.sep:hover::before{transform:scaleX(1)}
.slide.active .sep:nth-child(1){animation:enterUp .6s .1s cubic-bezier(.16,1,.3,1) both}
.slide.active .sep:nth-child(2){animation:enterUp .6s .2s cubic-bezier(.16,1,.3,1) both}
.slide.active .sep:nth-child(3){animation:enterUp .6s .3s cubic-bezier(.16,1,.3,1) both}
.slide.active .sep:nth-child(4){animation:enterUp .6s .4s cubic-bezier(.16,1,.3,1) both}
.sep-n{font-family:var(--font-display);font-weight:800;font-size:2rem;line-height:1;color:transparent;-webkit-text-stroke:1.5px rgb(var(--gold-rgb) / 0.22);margin-bottom:10px;transition:-webkit-text-stroke-color .25s}
.sep:hover .sep-n{-webkit-text-stroke-color:var(--gold)}
.sep-name{font-family:var(--font-display);font-weight:700;font-size:.85rem;color:var(--cream);margin-bottom:8px}
.sep-desc{font-size:.76rem;color:var(--subtle);line-height:1.55}
.sep-check{display:inline-block;margin-top:10px;padding:2px 8px;border-radius:4px;font-size:.65rem;font-weight:600;background:rgb(var(--success-rgb) / 0.08);border:1px solid rgb(var(--success-rgb) / 0.2);color:var(--success)}

/* ── SLIDE 7 ── */
#s7{background:var(--bg-deep)}
#s7 .table-wrap{overflow-x:auto;margin-top:36px;border-radius:16px;border:1px solid rgb(var(--line-rgb) / 0.12)}
.ctable{width:100%;border-collapse:collapse;font-size:.85rem}
.ctable thead th{padding:12px 20px;text-align:left;font-size:.67rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--subtle);border-bottom:1px solid rgb(var(--line-rgb) / 0.12);background:rgb(var(--white-rgb) / 0.02)}
.ctable tbody tr{border-bottom:1px solid rgb(var(--line-rgb) / 0.12);transition:background .12s}
.ctable tbody tr:last-child{border-bottom:none}
.ctable tbody tr:hover{background:rgb(var(--white-rgb) / 0.025)}
.ctable td{padding:14px 20px;color:var(--subtle);line-height:1.5;vertical-align:middle}
.ctable td:first-child{font-weight:600;color:var(--cream)}
.ctable .hl{background:linear-gradient(90deg,rgb(var(--gold-rgb) / 0.07),rgb(var(--gold-rgb) / 0.03))}
.ctable .hl td:first-child{color:var(--gold)}
.y{color:var(--success);font-weight:600}
.n{color:rgb(var(--muted-rgb) / 0.288)}

/* ── SLIDE 8 ── */
#s8{text-align:center;align-items:center}
#s8 .stack-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px;max-width:820px;width:100%}
.slide.active .tech:nth-child(1){animation:enterUp .55s .05s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(2){animation:enterUp .55s .12s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(3){animation:enterUp .55s .19s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(4){animation:enterUp .55s .26s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(5){animation:enterUp .55s .33s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(6){animation:enterUp .55s .40s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(7){animation:enterUp .55s .47s cubic-bezier(.16,1,.3,1) both}
.slide.active .tech:nth-child(8){animation:enterUp .55s .54s cubic-bezier(.16,1,.3,1) both}
.tech{background:var(--bg-deep);border:1px solid rgb(var(--line-rgb) / 0.12);border-radius:14px;padding:22px 18px;text-align:center;transition:border-color .25s,transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
.tech:hover{border-color:rgb(var(--gold-rgb) / 0.25);transform:translateY(-3px);box-shadow:0 10px 36px rgb(var(--shadow-rgb) / 0.35)}
.tech-icon{width:36px;height:36px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center}
.tech-name{font-family:var(--font-display);font-weight:700;font-size:.87rem;color:var(--cream);margin-bottom:4px}
.tech-role{font-size:.7rem;color:var(--subtle)}

/* ── SLIDE 9 ── */
#s9{background:radial-gradient(ellipse 100% 85% at 50% 50%,var(--bg) 0%,var(--bg-deep) 65%);text-align:center;align-items:center;justify-content:center}
.s9-bg-sym{position:absolute;font-size:520px;color:rgb(var(--gold-rgb) / 0.025);font-family:var(--font-display);font-weight:800;top:50%;left:50%;transform:translate(-50%,-50%);line-height:1;pointer-events:none;user-select:none;animation:floatRotate 30s linear infinite}
.s9-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;border-radius:50%;background:radial-gradient(rgb(var(--gold-rgb) / 0.1),transparent 65%);filter:blur(30px);pointer-events:none;animation:pulseGlow 4s ease-in-out infinite}
.s9-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
.s9-domain{font-family:'JetBrains Mono',monospace;font-size:clamp(.88rem,1.4vw,1.1rem);color:var(--info);margin:24px 0 36px;padding:12px 24px;border-radius:10px;background:rgb(var(--info-rgb) / 0.06);border:1px solid rgb(var(--info-rgb) / 0.18);display:inline-block}
.s9-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn-p{display:flex;align-items:center;gap:8px;padding:14px 28px;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s,background .15s;text-decoration:none}
.btn-gold{background:var(--gold);color:var(--bg-deep);border:none;box-shadow:0 4px 20px rgb(var(--gold-rgb) / 0.2)}
.btn-gold:hover{background:var(--gold-hover);transform:translateY(-2px) scale(1.03);box-shadow:0 8px 36px rgb(var(--gold-rgb) / 0.45)}
.btn-border{background:transparent;color:var(--cream);border:1.5px solid rgb(var(--line-rgb) / 0.12)}
.btn-border:hover{border-color:var(--subtle);transform:translateY(-2px)}
.s9-sub{margin-top:36px;font-size:.82rem;color:var(--subtle);letter-spacing:.03em}
.s9-sub span{color:var(--gold);font-weight:600}

#hint{position:fixed;bottom:72px;right:20px;font-size:.68rem;color:rgb(var(--muted-rgb) / 0.324);font-family:'JetBrains Mono',monospace;pointer-events:none;animation:fadeOut 4s ease 4s both}

@media(max-width:800px){
  .slide{padding:70px 20px 90px}
  #s2 .grid{grid-template-columns:1fr;gap:24px}
  #s4 .flow{flex-direction:column;gap:12px}
  .flow-connector{display:none}
  #s6 .seps{grid-template-columns:1fr 1fr}
  #s8 .stack-grid{grid-template-columns:1fr 1fr}
  .stat-row{gap:16px}
  .attrs{gap:12px}
  .attr{padding:16px 18px;min-width:120px}
}
@media(max-width:500px){
  #s6 .seps{grid-template-columns:1fr}
  #s8 .stack-grid{grid-template-columns:repeat(2,1fr)}
  .slide-h{font-size:2.1rem}
  .s9-btns{flex-direction:column;align-items:center}
}
`;

/* ──────────── SVG ICONS ──────────── */
const GHIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const IconLock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconCloud = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);
const IconPlug = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 3l-3 3m-9 9l-3 3M13 7l1 1-8 8-1-1M7 13l1 1 8-8-1-1"/>
    <path d="M16 11c1.1 1.1 1.1 2.9 0 4L12 19a2.83 2.83 0 0 1-4 0L6 17"/>
    <path d="M8 13L5 10a2.83 2.83 0 0 1 0-4L9 2c1.1-1.1 2.9-1.1 4 0l2 2"/>
  </svg>
);

/* SVG tech icons */
const IconVercel = () => (
  <svg width="22" height="22" viewBox="0 0 116 100" fill="var(--cream)">
    <path d="M57.5 0L115 100H0L57.5 0z"/>
  </svg>
);
const IconStellar = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="rgb(var(--info-rgb) / 0.15)"/>
    <path d="M24 11.5l-1.3.7-10.4 5.4L7 20.5l-.7.4v-1.6l.7-.4 5.4-2.8v-.3L7 13v-1.6l.7.4 5.3 2.8h.3L7 11.8V10l.7.4L24 10l-.7.4-8.6 4.4-.3.1h9.3l.7-.4L24 13v-1.5z" fill="var(--info)"/>
  </svg>
);
const IconDB = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IconTS = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--info)">
    <rect width="24" height="24" rx="3" fill="rgb(var(--info-rgb) / 0.15)"/>
    <text x="3" y="18" fontSize="13" fontWeight="800" fontFamily="monospace" fill="var(--info)">TS</text>
  </svg>
);
const IconJWT = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1" fill="var(--gold-hover)"/>
  </svg>
);
const IconBank = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22"/>
    <line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/>
    <line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/>
    <polygon points="12 2 20 7 4 7"/>
  </svg>
);
const IconFlask = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6m-5 0v5l-4 9a1 1 0 0 0 .9 1.45h10.2A1 1 0 0 0 18 17l-4-9V3"/>
    <line x1="6.5" y1="15" x2="17.5" y2="15"/>
  </svg>
);

/* ──────────── COMPONENT ──────────── */
const TOTAL = 9;

export default function PitchPage() {
  const [cur, setCur] = useState(0);
  const [animDir, setAnimDir] = useState<"right"|"left"|null>(null);
  const [leaving, setLeaving] = useState<number|null>(null);
  const animating = useRef(false);
  const touchStart = useRef(0);

  const goTo = useCallback((next: number) => {
    if (next === cur || animating.current || next < 0 || next >= TOTAL) return;
    animating.current = true;
    const dir = next > cur ? "right" : "left";
    setLeaving(cur);
    setAnimDir(dir);
    setCur(next);
    setTimeout(() => {
      setLeaving(null);
      setAnimDir(null);
      animating.current = false;
    }, 600);
  }, [cur]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goTo(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cur, goTo]);

  const slideClass = (i: number) => {
    let cls = "slide";
    if (i === cur) {
      cls += " active";
      if (animDir === "right") cls += " anim-in-right";
      if (animDir === "left") cls += " anim-in-left";
    }
    if (i === leaving) {
      if (animDir === "right") cls += " anim-out-left";
      if (animDir === "left") cls += " anim-out-right";
    }
    return cls;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="progress-line" style={{ width: `${((cur + 1) / TOTAL) * 100}%` }} />
      <div id="deck">
        <div className="slides-wrap">

          {/* SLIDE 1 */}
          <section className={slideClass(0)} id="s1">
            <div className="s1-orb s1-orb1" />
            <div className="s1-orb s1-orb2" />
            <div className="s1-orb s1-orb3" />
            <div className="s1-content">
              <div className="s1-symbol animate-in">&#x27F4;</div>
              <div className="s1-title animate-in">SEPuente</div>
              <p className="s1-subtitle animate-in">El gateway open-source que conecta SPEI con Stellar</p>
              <div className="s1-tags animate-in">
                <span className="s1-tag hi">&#10003; Stellar Testnet</span>
                <span className="s1-tag">Open Source &middot; MIT</span>
                <span className="s1-tag">No custodial</span>
                <span className="s1-tag">Serverless</span>
              </div>
            </div>
          </section>

          {/* SLIDE 2 */}
          <section className={slideClass(1)} id="s2">
            <div className="slide-inner">
              <div className="slide-label animate-in">// El problema</div>
              <h2 className="slide-h animate-in">Rampas SPEI sin<br /><span className="g">est&#225;ndar com&#250;n</span></h2>
              <div className="grid animate-in">
                <blockquote className="quote">
                  Cada rampa MXN tiene su propia API.<br />
                  Cada wallet tiene que integrarlas <em>una por una.</em>
                </blockquote>
                <div className="pain-items">
                  <div className="pain">
                    <div className="pain-x no">&#10005;</div>
                    <div className="pain-t"><strong>Sin est&#225;ndar</strong> &mdash; Etherfuse, Bitso, Kushki exponen APIs propietarias incompatibles</div>
                  </div>
                  <div className="pain">
                    <div className="pain-x no">&#10005;</div>
                    <div className="pain-t"><strong>Descubrimiento manual</strong> &mdash; las wallets Stellar no pueden encontrar rampas MXN autom&#225;ticamente</div>
                  </div>
                  <div className="pain">
                    <div className="pain-x no">&#10005;</div>
                    <div className="pain-t"><strong>Vendor lock-in</strong> &mdash; una sola rampa ata al usuario a un &#250;nico proveedor regulado</div>
                  </div>
                  <div className="pain">
                    <div className="pain-x yes">&#10003;</div>
                    <div className="pain-t"><strong style={{ color: "var(--success)" }}>SEPuente</strong> &mdash; una integraci&#243;n para cualquier proveedor SPEI</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SLIDE 3 */}
          <section className={slideClass(2)} id="s3">
            <div className="slide-label animate-in">// La soluci&#243;n</div>
            <h2 className="slide-h animate-in">Una capa de <span className="g">protocolo</span>,<br />no una rampa nueva</h2>
            <p className="big-desc animate-in">
              SEPuente <strong>traduce el protocolo</strong>. El KYC y el dinero se quedan en el proveedor regulado.<br />
              SEPuente solo convierte la <span className="hi">interfaz</span>.
            </p>
            <div className="stat-row animate-in">
              <div className="big-stat">
                <div className="big-stat-n">4</div>
                <div className="big-stat-l">SEPs implementados</div>
              </div>
              <div className="big-stat">
                <div className="big-stat-n">0</div>
                <div className="big-stat-l">Fondos custodiados</div>
              </div>
              <div className="big-stat">
                <div className="big-stat-n">&#8734;</div>
                <div className="big-stat-l">Proveedores SPEI</div>
              </div>
            </div>
            <div className="attrs animate-in">
              <div className="attr">
                <div className="attr-icon"><IconLock /></div>
                <div className="attr-label">No custodial</div>
                <div className="attr-sub">Nunca toca fondos ni llaves de usuarios</div>
              </div>
              <div className="attr">
                <div className="attr-icon"><IconGlobe /></div>
                <div className="attr-label">Open source</div>
                <div className="attr-sub">MIT &middot; forkeable &middot; auditable</div>
              </div>
              <div className="attr">
                <div className="attr-icon"><IconCloud /></div>
                <div className="attr-label">Serverless</div>
                <div className="attr-sub">Sin background jobs &middot; pull-on-read</div>
              </div>
              <div className="attr">
                <div className="attr-icon"><IconPlug /></div>
                <div className="attr-label">Plug &amp; play</div>
                <div className="attr-sub">RampDriver &middot; cualquier proveedor</div>
              </div>
            </div>
          </section>

          {/* SLIDE 4 */}
          <section className={slideClass(3)} id="s4">
            <div className="slide-inner">
              <div className="slide-label animate-in">// Protocolo</div>
              <h2 className="slide-h animate-in">C&#243;mo funciona</h2>
              <div className="flow animate-in">
                <div className="flow-connector" />
                <div className="step">
                  <div className="step-n">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <div className="step-badge">1</div>
                  </div>
                  <div className="step-title">Discovery</div>
                  <p className="step-desc">La wallet lee</p>
                  <span className="step-code">stellar.toml</span>
                </div>
                <div className="step">
                  <div className="step-n">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <div className="step-badge">2</div>
                  </div>
                  <div className="step-title">SEP-10 Auth</div>
                  <p className="step-desc">Challenge tx + JWT firmado sin estado</p>
                </div>
                <div className="step">
                  <div className="step-n">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    <div className="step-badge">3</div>
                  </div>
                  <div className="step-title">SEP-38 Quote</div>
                  <p className="step-desc">Precio en tiempo real con TTL firmado</p>
                </div>
                <div className="step">
                  <div className="step-n">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                    <div className="step-badge">4</div>
                  </div>
                  <div className="step-title">SEP-24 Flow</div>
                  <p className="step-desc">CLABE + ref SPEI o Stellar + memo</p>
                </div>
                <div className="step">
                  <div className="step-n">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <div className="step-badge">5</div>
                  </div>
                  <div className="step-title">Liquidaci&#243;n</div>
                  <p className="step-desc">TMXN acreditan en la wallet. Pull-on-read</p>
                </div>
              </div>
            </div>
          </section>

          {/* SLIDE 5 */}
          <section className={slideClass(4)} id="s5">
            <div className="slide-inner">
              <div className="slide-label animate-in">// Arquitectura</div>
              <h2 className="slide-h animate-in">Dise&#241;o <span className="g">serverless</span></h2>
              <div className="diag animate-in">
                <div className="d-row">
                  <div className="d-node">
                    <div className="d-name">Wallet / App</div>
                    <div className="d-sub">Freighter &middot; Demo Wallet<br />Cualquier cliente SEP-24</div>
                  </div>
                  <div className="d-arr">
                    <div className="d-arr-sym">&#10230;</div>
                    <div className="d-arr-label">SEP-10</div>
                    <div className="d-arr-label">SEP-24</div>
                  </div>
                  <div className="d-node center">
                    <div className="d-name" style={{ color: "var(--gold)", fontSize: ".95rem" }}>&#x27F4; SEPuente</div>
                    <div className="d-sub">Next.js 15 &middot; Supabase &middot; Vercel</div>
                    <div className="d-badges">
                      <span className="d-badge">SEP-1</span>
                      <span className="d-badge">SEP-10</span>
                      <span className="d-badge">SEP-24</span>
                      <span className="d-badge">SEP-38</span>
                    </div>
                  </div>
                  <div className="d-arr">
                    <div className="d-arr-sym">&#10230;</div>
                    <div className="d-arr-label">RampDriver</div>
                  </div>
                  <div className="d-node">
                    <div className="d-name">Etherfuse</div>
                    <div className="d-sub">Sandbox API<br />SPEI &#8644; CETES</div>
                  </div>
                  <div className="d-arr">
                    <div className="d-arr-sym">&#10230;</div>
                    <div className="d-arr-label">SPEI</div>
                  </div>
                  <div className="d-node">
                    <div className="d-name">Banco</div>
                    <div className="d-sub">CLABE &middot; referencia<br />Red interbancaria MX</div>
                  </div>
                </div>
              </div>
              <p className="animate-in" style={{ marginTop: "18px", fontSize: ".8rem", color: "var(--subtle)", textAlign: "center" }}>
                <span className="mono">MockDriver</span> disponible para desarrollo en testnet sin dependencias externas
              </p>
            </div>
          </section>

          {/* SLIDE 6 */}
          <section className={slideClass(5)} id="s6">
            <div className="slide-inner">
              <div className="slide-label animate-in">// Est&#225;ndares</div>
              <h2 className="slide-h animate-in">Cuatro SEPs, <span className="g">una URL</span></h2>
              <div className="seps">
                <div className="sep">
                  <div className="sep-n">SEP-1</div>
                  <div className="sep-name">Stellar Info</div>
                  <p className="sep-desc"><span className="mono" style={{ fontSize: ".7rem" }}>stellar.toml</span> din&#225;mico con endpoints, activos y documentaci&#243;n del anchor</p>
                  <div className="sep-check">&#10003; implementado</div>
                </div>
                <div className="sep">
                  <div className="sep-n">SEP-10</div>
                  <div className="sep-name">Web Auth</div>
                  <p className="sep-desc">Challenge transaction + JWT HS256. Sin estado. Compatible con anchor-tests SDF</p>
                  <div className="sep-check">&#10003; implementado</div>
                </div>
                <div className="sep">
                  <div className="sep-n">SEP-24</div>
                  <div className="sep-name">Hosted Transfer</div>
                  <p className="sep-desc">UI en popup/iframe. Dep&#243;sito SPEI&#8594;TMXN y retiro TMXN&#8594;SPEI con historial completo</p>
                  <div className="sep-check">&#10003; implementado</div>
                </div>
                <div className="sep">
                  <div className="sep-n">SEP-38</div>
                  <div className="sep-name">Anchor RFQ</div>
                  <p className="sep-desc">Cotizaciones en tiempo real. Quotes firmados con TTL. Contexto sep24 integrado</p>
                  <div className="sep-check">&#10003; implementado</div>
                </div>
              </div>
            </div>
          </section>

          {/* SLIDE 7 */}
          <section className={slideClass(6)} id="s7">
            <div className="slide-inner">
              <div className="slide-label animate-in">// Diferenciaci&#243;n</div>
              <h2 className="slide-h animate-in">&#191;Por qu&#233; no<br /><span className="g">algo existente?</span></h2>
              <div className="table-wrap animate-in">
                <table className="ctable">
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Prop&#243;sito</th>
                      <th>SEP-24</th>
                      <th>Adapta rampas existentes</th>
                      <th>Sin KYC propio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Ramp Kit</td>
                      <td>SDK per-app</td>
                      <td><span className="n">&#8212;</span></td>
                      <td><span className="n">&#8212;</span></td>
                      <td><span className="n">&#8212;</span></td>
                    </tr>
                    <tr>
                      <td>StellarMesh</td>
                      <td>SEP-24 para exchanges</td>
                      <td><span className="y">&#10003;</span></td>
                      <td><span className="n">&#8212;</span></td>
                      <td><span className="n">&#8212;</span></td>
                    </tr>
                    <tr>
                      <td>Anchor Platform (SDF)</td>
                      <td>Ser anchor desde cero</td>
                      <td><span className="y">&#10003;</span></td>
                      <td><span className="n">&#8212;</span></td>
                      <td><span className="n">Requiere KYC</span></td>
                    </tr>
                    <tr className="hl">
                      <td>&#x27F4; SEPuente</td>
                      <td>Adaptador para rampas reguladas</td>
                      <td><span className="y">&#10003;</span></td>
                      <td><span className="y">&#10003; Exactamente eso</span></td>
                      <td><span className="y">&#10003; KYC del proveedor</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SLIDE 8 */}
          <section className={slideClass(7)} id="s8">
            <div className="slide-label animate-in">// Stack tecnol&#243;gico</div>
            <h2 className="slide-h animate-in">Construido sobre<br /><span className="g">tecnolog&#237;a probada</span></h2>
            <div className="stack-grid">
              <div className="tech"><div className="tech-icon"><IconVercel /></div><div className="tech-name">Next.js 15</div><div className="tech-role">App Router &middot; API Routes</div></div>
              <div className="tech"><div className="tech-icon"><IconStellar /></div><div className="tech-name">Stellar SDK</div><div className="tech-role">v12 &middot; WebAuth &middot; Horizon</div></div>
              <div className="tech"><div className="tech-icon"><IconDB /></div><div className="tech-name">Supabase</div><div className="tech-role">Postgres &middot; RLS &middot; realtime</div></div>
              <div className="tech">
                <div className="tech-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                </div>
                <div className="tech-name">Vercel</div>
                <div className="tech-role">Edge &middot; Serverless &middot; CI/CD</div>
              </div>
              <div className="tech"><div className="tech-icon"><IconJWT /></div><div className="tech-name">jose</div><div className="tech-role">JWT HS256 &middot; SEP-10</div></div>
              <div className="tech"><div className="tech-icon"><IconBank /></div><div className="tech-name">Etherfuse</div><div className="tech-role">Sandbox SPEI API</div></div>
              <div className="tech"><div className="tech-icon"><IconTS /></div><div className="tech-name">TypeScript</div><div className="tech-role">Strict &middot; end-to-end types</div></div>
              <div className="tech"><div className="tech-icon"><IconFlask /></div><div className="tech-name">MockDriver</div><div className="tech-role">Testnet &middot; 1 TMXN = 1 MXN</div></div>
            </div>
          </section>

          {/* SLIDE 9 */}
          <section className={slideClass(8)} id="s9">
            <div className="s9-glow" />
            <div className="s9-bg-sym">&#x27F4;</div>
            <div className="s9-inner">
              <div className="slide-label animate-in">// Empezar</div>
              <h2 className="slide-h animate-in" style={{ maxWidth: "700px" }}>Listo para usar<br />en <span className="g">testnet hoy</span></h2>
              <div className="s9-domain animate-in">github.com/ALFA117/sepuente</div>
              <div className="s9-btns animate-in">
                <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className="btn-p btn-gold">
                  <GHIcon /> Ver en GitHub
                </a>
                <a href="/demo" className="btn-p btn-border">&#8599; Live Demo</a>
                <a href="/devs" className="btn-p btn-border">Docs</a>
              </div>
              <p className="s9-sub animate-in">Ancla Stellar &middot; <span>SPEI &#8644; TMXN</span> &middot; Open source</p>
            </div>
          </section>

        </div>

        {/* NAV BAR */}
        <div id="nav-bar">
          <div className="nav-brand"><span className="nav-sym">&#x27F4;</span> SEPuente</div>
          <div className="dots">
            {Array.from({ length: TOTAL }, (_, i) => (
              <button key={i} className={"dot" + (i === cur ? " active" : "")} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
          <div className="nav-controls">
            <button className="nav-btn" onClick={() => goTo(cur - 1)} disabled={cur === 0} title="Anterior (&#8592;)">&#8592;</button>
            <span className="slide-counter">{cur + 1} / {TOTAL}</span>
            <button className="nav-btn" onClick={() => goTo(cur + 1)} disabled={cur === TOTAL - 1} title="Siguiente (&#8594;)">&#8594;</button>
          </div>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className="nav-gh">
            <GHIcon /> GitHub
          </a>
        </div>
      </div>

      <div id="hint">&#8592; &#8594; para navegar &middot; Space para avanzar</div>

      {/* Touch swipe */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 50) { dx < 0 ? goTo(cur + 1) : goTo(cur - 1); }
        }}
      />
    </>
  );
}

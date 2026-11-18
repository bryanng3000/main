'use strict';
(() => {
  const config=window.BRYAN_CONFIG,copy=window.BRYAN_COPY,questions=window.BRYAN_QUESTIONS;
  let featuredFilmIndex=0;
  let lang='en',region='my',step=0,answers={},finished=false,toastTimer,activeRateCategory=null,partnersPaused=false,editedBrief={en:null,zh:null};
  try {const saved=localStorage.getItem('bryan-language');if(saved==='zh'||saved==='en')lang=saved;const savedRegion=localStorage.getItem('bryan-region');if(config.regions[savedRegion])region=savedRegion;}catch{}
  const requestedRegion=new URLSearchParams(location.search).get('region');if(config.regions[requestedRegion])region=requestedRegion;
  const requestedLang=new URLSearchParams(location.search).get('lang');if(requestedLang==='en'||requestedLang==='zh')lang=requestedLang;
  const $=s=>document.querySelector(s);
  const contact=()=>config.regions[region];
  const t=key=>contact().copy?.[lang]?.[key]??copy[lang][key]??key;
  const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
  const uiButton=(label,cls,fn)=>{const x=el('button',cls,label);x.type='button';x.addEventListener('click',fn);return x;};
  function decorateIcons(root=document.body){
    const nodes=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style,textarea,svg')&&/[↗↘↶→←↑↳✳▶]/.test(n.textContent))nodes.push(n);}
    for(const node of nodes){
      const fragment=document.createDocumentFragment();
      for(const part of node.textContent.split(/([↗↘↶→←↑↳✳▶])/)){
        if(!/^[↗↘↶→←↑↳✳▶]$/.test(part)){fragment.append(document.createTextNode(part));continue;}
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
        if(part==='✳'){svg.innerHTML='<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" stroke-width="2.4"/>';}
        else if(part==='▶'){svg.innerHTML='<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>';}
        else if(part==='↶'){svg.innerHTML='<path d="M4 10h6M4 10V4m0 6a8 8 0 1 1 0 6"/>';}
        else if(part==='↳'){svg.innerHTML='<path d="M5 4v11h15m-5-5 5 5-5 5"/>';}
        else {svg.innerHTML='<path d="M5 19 19 5M5 5h14v14"/>';const angle={'↗':0,'↘':90,'→':45,'←':225,'↑':315}[part];if(angle)svg.style.transform='rotate('+angle+'deg)';}
        fragment.append(svg);
      }
      node.replaceWith(fragment);
    }
  }
  function toast(message){const x=$('#toast');clearTimeout(toastTimer);x.textContent=message;x.classList.add('visible');toastTimer=setTimeout(()=>x.classList.remove('visible'),3500);}
  function changeLanguage(value){
    lang=value;document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.documentElement.dataset.region=region;
    document.querySelectorAll('[data-region-only]').forEach(x=>x.hidden=x.dataset.regionOnly!==region);
    $('#region-select').value=region;
    document.querySelectorAll('[data-current-region]').forEach(x=>x.textContent=t(region==='cn'?'regionChina':'regionMalaysia'));
    document.querySelectorAll('[data-i18n]').forEach(x=>{const key=x.dataset.i18n;if(t(key)!==key){x.textContent=t(key);if(key==='contactAside')x.style.whiteSpace='pre-line';}});
    document.querySelectorAll('[data-i18n-aria-label]').forEach(x=>x.setAttribute('aria-label',t(x.dataset.i18nAriaLabel)));
    document.querySelectorAll('.top-social-button').forEach(x=>x.title=x.getAttribute('aria-label'));
    document.querySelectorAll('[data-lang]').forEach(x=>{const active=x.dataset.lang===lang;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});
    $('#menu-button').setAttribute('aria-label',t($('#main-nav').classList.contains('open')?'menuClose':'menuOpen'));
    try{localStorage.setItem('bryan-language',lang);}catch{}
    renderFilms();renderQuiz();renderSocialLinks();renderFollowers();renderRateDialog();renderPartners();renderReviews();setupContacts();setupRegionalLinks();setupPageNavigation();decorateIcons();
  }
  function changeRegion(value){
    if(!config.regions[value])return;region=value;
    try{localStorage.setItem('bryan-region',region);}catch{}
    const url=new URL(location.href);url.searchParams.set('region',region);history.replaceState(null,'',url);
    changeLanguage(lang);
  }
  function renderFilms(){
    const grid=$('#work-grid');if(!grid)return;grid.replaceChildren();
    const ids=grid.dataset.filmIds?.split(',');
    const films=config.films.filter(film=>!ids||ids.includes(film.id));
    if(grid.dataset.carousel!=='true'){films.forEach((film,i)=>grid.append(createFilmCard(film,i)));return;}
    if(!films.length)return;
    grid.classList.add('film-carousel');grid.tabIndex=0;
    grid.setAttribute('role','region');grid.setAttribute('aria-roledescription',lang==='zh'?'轮播':'carousel');grid.setAttribute('aria-label',t('featuredFilms'));
    const stage=el('div','film-carousel-stage'),slide=el('div','film-carousel-slide');slide.id='film-carousel-slide';slide.setAttribute('role','group');
    const controls=el('div','film-carousel-controls');
    const previous=uiButton('←','film-carousel-arrow film-carousel-previous',()=>show(featuredFilmIndex-1));
    const next=uiButton('→','film-carousel-arrow film-carousel-next',()=>show(featuredFilmIndex+1));
    for(const [button,label] of [[previous,t('previousFilm')],[next,t('nextFilm')]]){button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-controls',slide.id);button.disabled=films.length<2;}
    controls.append(previous,next);stage.append(slide,controls);
    const status=el('p','film-carousel-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
    grid.append(stage,status);
    function show(index){
      const restoreFocus=slide.contains(document.activeElement);
      featuredFilmIndex=(index%films.length+films.length)%films.length;
      const film=films[featuredFilmIndex];slide.replaceChildren(createFilmCard(film,featuredFilmIndex));
      slide.setAttribute('aria-label',lang==='zh'?'第 '+(featuredFilmIndex+1)+' 支，共 '+films.length+' 支':(featuredFilmIndex+1)+' of '+films.length);
      status.textContent=String(featuredFilmIndex+1).padStart(2,'0')+' / '+String(films.length).padStart(2,'0');
      decorateIcons(slide);
      if(restoreFocus)slide.querySelector('.work-card').focus({preventScroll:true});
    }
    grid.onkeydown=event=>{
      const position={ArrowLeft:featuredFilmIndex-1,ArrowRight:featuredFilmIndex+1,Home:0,End:films.length-1}[event.key];
      if(position===undefined)return;event.preventDefault();show(position);
    };
    show(featuredFilmIndex);decorateIcons(controls);
  }
  function createFilmCard(film,index){
    const card=uiButton('','work-card',()=>openFilm(film));card.dataset.filmId=film.id;card.setAttribute('aria-label',t('watchFilm')+': '+film[lang]);
    const image=el('div','work-image'),img=el('img');img.src=film.image;img.alt=film[lang];img.loading='lazy';img.width=720;img.height=405;
    image.append(img,el('span','work-overlay'),el('span','work-index',String(index+1).padStart(2,'0')+(lang==='zh'?' / 精选作品':' / SELECTED FILM')),el('span','work-play','▶'),el('span','work-length',lang==='zh'?'观看影片 ↗':'WATCH FILM ↗'));
    const info=el('div','work-info'),text=el('div');text.append(el('h3','',film[lang]),el('p','work-type',lang==='zh'?film.typeZh:film.typeEn));info.append(text,el('span','work-arrow','↗'));card.append(image,info);return card;
  }
  function openFilm(film){
    $('#film-dialog-title').textContent=film[lang];$('#film-external').href='https://www.youtube.com/watch?v='+film.id;
    const frame=el('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+film.id;frame.title=film[lang];frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';$('#film-player').replaceChildren(frame);openDialog($('#film-dialog'));
  }
  function openDialog(dialog){dialog.showModal();document.body.classList.add('dialog-open');}
  document.querySelectorAll('dialog').forEach(dialog=>{
    const close=()=>dialog.close();dialog.querySelector('.close-dialog').addEventListener('click',close);
    dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
    dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(dialog.id==='film-dialog')$('#film-player').replaceChildren();});
  });
  $('#menu-button').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('open');$('#menu-button').setAttribute('aria-expanded',String(open));$('#menu-button').setAttribute('aria-label',t(open?'menuClose':'menuOpen'));});
  document.querySelectorAll('#main-nav a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');$('#menu-button').setAttribute('aria-label',t('menuOpen'));}));
  document.querySelectorAll('[data-lang]').forEach(x=>x.addEventListener('click',()=>changeLanguage(x.dataset.lang)));
  $('#region-select').addEventListener('change',e=>changeRegion(e.target.value));
  $('#partner-motion')?.addEventListener('click',()=>{partnersPaused=!partnersPaused;updatePartnerMotion();});
  document.querySelectorAll('[data-rate-category]').forEach(x=>x.addEventListener('click',()=>{
    if(region!=='my')return;activeRateCategory=x.dataset.rateCategory;renderRateDialog();openDialog($('#service-rates-dialog'));
  }));
  $('#rate-contact-link').addEventListener('click',()=>$('#service-rates-dialog').close());
  document.querySelectorAll('[data-open-wechat]').forEach(x=>x.addEventListener('click',()=>openDialog($('#wechat-dialog'))));
  document.querySelectorAll('[data-copy-wechat]').forEach(x=>x.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(config.regions.cn.wechat);toast(t('wechatCopied'));}catch{toast(t('wechatCopyFailed'));}}));
  function setupContacts(){
    const details=contact(),email='mailto:'+details.email;document.querySelectorAll('a[href^="mailto:"]').forEach(x=>{if(x.id!=='brief-email')x.href=email;});
    document.querySelectorAll('[data-contact-email]').forEach(x=>{x.textContent=details.email;});
    const wa=$('#whatsapp-button');if(wa){wa.textContent=t('whatsappLabel');if(details.whatsapp)wa.href='https://wa.me/'+details.whatsapp;else wa.removeAttribute('href');}
    document.querySelectorAll('[data-contact-whatsapp]').forEach(x=>{if(details.whatsapp)x.href='https://wa.me/'+details.whatsapp;else x.removeAttribute('href');});
    document.querySelectorAll('[data-whatsapp-number]').forEach(x=>{x.textContent=details.whatsappDisplay||'';});
    document.querySelectorAll('[data-wechat-id]').forEach(x=>x.textContent=config.regions.cn.wechat);
  }
  function renderSocialLinks(){
    const target=$('#footer-socials');target.replaceChildren();
    contact().socialIds.map(id=>config.socials.find(social=>social.id===id)).filter(Boolean).forEach(social=>{
      if(social.url){const link=el('a','',social[lang]+' ↗');link.href=social.url;link.target='_blank';link.rel='noopener noreferrer';target.append(link);}
      else target.append(el('span','social-pending',social[lang]+' · '+t('socialPending')));
    });
  }
  function renderFollowers(){
    if(!$('#total-followers'))return;
    const display=contact().metricDisplay?.[lang];
    $('#total-followers').textContent=display?.followers??config.totalFollowers;
    $('#monthly-metric').textContent=display?.monthly??config.monthlyMetric.value;
  }
  function setupRegionalLinks(){
    if($('#all-films-link'))$('#all-films-link').href=contact().workUrl;if($('#follow-journey-link'))$('#follow-journey-link').href=contact().followUrl;
  }
  function setupPageNavigation(){
    const url=new URL(location.href);url.searchParams.set('region',region);url.searchParams.set('lang',lang);history.replaceState(null,'',url);
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href');
      if(!href||href.startsWith('#')||!/^\w[\w-]*\.html(?:[?#]|$)/.test(href))return;
      const target=new URL(href,location.href);target.searchParams.set('region',region);target.searchParams.set('lang',lang);
      a.setAttribute('href',target.pathname.split('/').pop()+target.search+target.hash);
    });
    const page=document.body.dataset.page;
    document.querySelectorAll('[data-nav]').forEach(a=>{
      const active=a.dataset.nav===page||(a.dataset.nav==='solutions'&&['documentary','explainers','social'].includes(page));
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    const title=document.body.dataset.pageTitle;if(title)document.title=(page==='index'?(lang==='zh'?'人物纪录片与品牌内容制作':'Documentaries & content for business'):t(title))+' — Bryan Ng';
    const meta=$('meta[name="description"]');if(meta)meta.content=page==='index'?t('homeIntro'):t(({documentary:'docPageIntro',explainers:'explainPageIntro',social:'socialPageIntro',work:'workNote',about:'aboutLead',finder:'finderIntro',contact:'contactIntro',clients:'partnersIntro'})[page]||'homeIntro');
  }
  function renderRateDialog(){
    const dialog=$('#service-rates-dialog'),body=$('#category-rates-body'),usagePrice=$('#usage-rate');body.replaceChildren();usagePrice.textContent='';
    if(region!=='my'){if(dialog.open)dialog.close();activeRateCategory=null;return;}
    if(!activeRateCategory)return;
    $('#service-rates-title').textContent=t(activeRateCategory==='instagram'?'ratesInstagramTitle':'ratesYouTubeTitle');
    config.rates.filter(rate=>rate.category===activeRateCategory).forEach(rate=>{
      const row=el('tr'),name=el('th','',rate[lang]);name.scope='row';row.append(name,el('td','','RM '+rate.amount.toLocaleString('en-MY')));body.append(row);
    });
    const usage=config.rates.find(rate=>rate.category==='usage');$('.usage-option').hidden=!usage;if(usage)usagePrice.textContent='RM '+usage.amount.toLocaleString('en-MY');
  }
  function renderPartners(){
    const grid=$('#partner-grid');if(!grid)return;grid.replaceChildren();
    const note=$('#partners .placeholder-note');if(note)note.hidden=!config.partners.some(x=>x.placeholder);
    config.partners.forEach((partner,index)=>{
      const card=el('article','partner-card'+(partner.placeholder?' is-placeholder':''));
      if(partner.logo&&!partner.placeholder){const logo=el('img','partner-logo');logo.src=partner.logo;logo.alt=partner.name;logo.loading='lazy';card.append(logo);}
      else {const mark=el('div','partner-logo-placeholder','+');mark.setAttribute('aria-hidden','true');card.append(mark);}
      card.append(el('h3','partner-name',partner.name||'Brand '+String(index+1).padStart(2,'0')));
      if(partner.placeholder)card.append(el('span','partner-status',t('brandPlaceholder')+' · '+t('brandLogoPending')));
      grid.append(card);
    });
    const track=$('#brand-track');if(track){
      track.querySelectorAll('[data-marquee-copy]').forEach(x=>x.remove());
      const duplicate=grid.cloneNode(true);duplicate.removeAttribute('id');duplicate.setAttribute('aria-hidden','true');duplicate.setAttribute('inert','');duplicate.dataset.marqueeCopy='';track.append(duplicate);
      updatePartnerMotion();
    }
  }
  function updatePartnerMotion(){
    const track=$('#brand-track'),button=$('#partner-motion');if(!track||!button)return;
    track.classList.toggle('is-paused',partnersPaused);button.setAttribute('aria-pressed',String(partnersPaused));button.textContent=t(partnersPaused?'resumePartners':'pausePartners');
  }
  function renderReviews(){
    const grid=$('#review-grid');if(!grid)return;grid.replaceChildren();
    $('#reviews-placeholder-note').hidden=!config.testimonials.some(x=>x.placeholder);
    const category=$('#reviews')?.dataset.reviewCategory;
    config.testimonials.filter(review=>!category||review.category===category).forEach(review=>{
      const card=el('article','review-card');
      if(review.placeholder)card.append(el('span','sample-badge',t('reviewPlaceholder')));
      const quote=el('blockquote','review-quote',lang==='zh'?review.quoteZh:review.quoteEn);
      const person=el('div','review-person'),avatar=el('span','review-avatar',review.name.slice(0,1).toUpperCase());avatar.setAttribute('aria-hidden','true');
      const identity=el('div');identity.append(el('strong','',review.name),el('span','',lang==='zh'?review.roleZh:review.roleEn));person.append(avatar,identity);card.append(quote,person);grid.append(card);
    });
  }
  function renderQuiz(){
    const content=$('#quiz-content');if(!content)return;content.replaceChildren();
    $('#quiz-counter').textContent=finished?t('results'):String(step+1).padStart(2,'0')+' / 05';
    $('#quiz-progress-fill').style.width=(finished?100:(step+1)*20)+'%';$('.quiz-progress').setAttribute('aria-valuenow',finished?'5':String(step+1));
    if(finished){renderResult(content);return;}
    const q=questions[step],title=el('h3','',q[lang]);title.tabIndex=-1;title.id='question-title';content.append(title,el('p','question-note',t('questionHint')));
    const options=el('div','quiz-options');options.setAttribute('role','radiogroup');options.setAttribute('aria-labelledby','question-title');
    q.options.forEach((option,index)=>{
      const selected=answers[q.id]===option.id;
      const b=uiButton('','quiz-option'+(selected?' selected':''),()=>choose(option.id));b.setAttribute('role','radio');b.setAttribute('aria-checked',String(selected));b.dataset.option=option.id;
      b.append(el('span','option-marker'),el('span','',option[lang]));
      b.addEventListener('keydown',e=>{if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();const offset=e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1;const next=(index+offset+q.options.length)%q.options.length;choose(q.options[next].id);options.children[next].focus();}});
      options.append(b);
    });
    content.append(options);
    const nav=el('div','quiz-navigation');const back=uiButton(t('previous'),'quiz-back',()=>{if(step>0){step--;renderQuiz();$('#question-title').focus({preventScroll:true});}});back.disabled=step===0;back.style.visibility=step===0?'hidden':'visible';
    const next=uiButton(step===4?t('showResult'):t('next'),'button blue quiz-next',()=>{if(!answers[q.id])return;if(step===4)finished=true;else step++;renderQuiz();const heading=$('#quiz-content h3');heading?.focus({preventScroll:true});});next.id='quiz-next';next.disabled=!answers[q.id];nav.append(back,next);content.append(nav,el('p','quiz-privacy',t('quizPrivacy')));decorateIcons(content);
  }
  function choose(id){const q=questions[step];answers[q.id]=id;document.querySelectorAll('.quiz-option').forEach(b=>{const checked=b.dataset.option===id;b.classList.toggle('selected',checked);b.setAttribute('aria-checked',String(checked));});$('#quiz-next').disabled=false;}
  function recommendation(){
    const goal=answers.goal,channel=answers.channel,asset=answers.assets;
    if(goal==='unsure')return 'discovery';
    if(goal==='person'||goal==='understand')return 'documentary';
    if(goal==='explain')return 'longform';
    if(goal==='awareness'&&(asset==='research'||(channel==='bryan'&&asset==='work')))return 'longform';
    return 'shortform';
  }
  const resultCopy={
    en:{
      documentary:{title:'A person-led documentary',body:'Your priority is helping people understand who is behind the work. A documentary can connect a person’s decisions with real examples of what they do.',items:['A focused interview and real working scenes','A main film with a clear story','Optional short edits and an agreed publication plan'],extra:'A shorter cut can introduce the story on Instagram and lead interested viewers to the full film.'},
      longform:{title:'A long-form explainer or YouTube collaboration',body:'You want to explain an idea with enough room for context. A focused long-form video can connect the question, evidence and practical examples.',items:['Research and a clear editorial angle','A dedicated video or relevant sponsored integration','Platforms, scope and usage agreed together'],extra:'For a commercial collaboration, the topic should be useful to viewers and relevant to the intended audience.'},
      shortform:{title:'A focused short-form campaign',body:'You want to introduce something and make its main point quickly. A short video or small content set is a useful starting point to discuss.',items:['One clear message and a defined audience','Instagram Reel, Stories or a carousel','A practical next step for interested viewers'],extra:'If the product needs more explanation, we can pair the short introduction with a longer film or a useful landing page.'},
      discovery:{title:'A short discovery conversation',body:'You’re still exploring. Before choosing a video format, let’s clarify what you want to change and who needs to see the story.',items:['Identify the audience and the main question','Review the real examples available to film','Agree on whether content production is the next step'],extra:'You do not need to commit to a film before knowing what it should achieve.'}
    },
    zh:{
      documentary:{title:'人物与职业纪录片',body:'如果客户不了解您的专长，或想知道合作过程，可以通过人物访谈和工作现场来介绍。例如跟拍一次服务流程，结合已完成的项目，说明您怎样处理客户的问题。',items:['采访创办人或团队，介绍经历与专长','拍摄工作过程，结合项目或产品的实际案例','制作完整视频，按需要讨论短版剪辑'],extra:'这种方式适合需要展示专业、服务过程或团队经验的业务。具体拍谁、拍什么，会先和您一起策划。'},
      longform:{title:'YouTube 专题或视频广告合作',body:'如果产品原理、服务价值或相关话题需要详细解释，可以考虑 YouTube 长视频。例如从客户常问的问题切入，再用案例、演示和资料逐步说明。',items:['围绕一个问题策划专题内容','制作完整品牌专题，或在相关视频中加入广告介绍','提前确认产品信息、发布平台和使用授权'],extra:'先选一个观众会关心、又和业务相关的话题，再讨论品牌应该怎样出现在内容中。'},
      shortform:{title:'社交媒体短视频与图文',body:'如果想宣传新品、活动，或让观众快速认识一个产品，可以先做短视频或图文。例如展示一个使用场景、回答一个常见问题，或介绍活动亮点。',items:['每条内容聚焦一个产品特点或使用场景','按需要制作 Reels、Stories 或多图轮播','写明咨询方式、活动信息或产品链接'],extra:'如果一条短视频讲不完，可以拆成系列内容，或搭配完整介绍视频。'},
      discovery:{title:'先聊聊您的业务与需求',body:'还没确定拍什么很正常。可以先聊聊您的业务、客户最常问的问题，以及现有的产品和案例，再判断视频能帮上什么忙。',items:['了解您最希望接触的客户','找出客户目前不理解、或最常犹豫的问题','看看有哪些工作现场、产品或案例可以展示'],extra:'聊清楚这些之后，再决定是否拍摄，以及适合采用哪种形式。'}
    }
  };
  function createBrief(result){
    if(lang==='zh'){
      const goal={understand:'让潜在客户更了解我们的服务与专长',person:'介绍创办人或专业人士的经历',explain:'详细介绍一个产品或话题',awareness:'宣传品牌、新品或活动',unsure:'先了解视频合作有哪些可能'}[answers.goal];
      const audience={clients:'潜在客户或消费者',partners:'合作伙伴或同行',talent:'有意加入团队的人',public:'对这个话题感兴趣的观众',unsure:'哪些受众还没有确定'}[answers.audience];
      const channel={website:'视频主要想放在公司官网，或发给客户介绍业务。',social:'视频主要想发布在我们自己的社交账号。',bryan:'我希望内容能在您的频道发布。',both:'我希望我们的账号和您的频道都可以使用这些内容。',unsure:'发布平台还没确定，想听听您的建议。'}[answers.channel];
      const assets={person:'我们可以介绍创办人或团队成员的经历与工作。',work:'我们有工作现场、已完成的项目或客户案例可以介绍。',product:'我们有产品、服务或活动可以拍摄。',research:'我们有一个想深入介绍的话题，也准备了一些相关资料。',none:'目前还没确定拍什么，希望和您一起梳理。'}[answers.assets];
      const stage={ready:'已有具体项目和大致时间',comparing:'正在寻找合适的拍摄与制作伙伴',exploring:'还在了解合作方式，尚未决定是否拍摄'}[answers.stage];
      return [t('briefHeading'),'','我的公司／品牌是【名称】，主要做【业务简介】。','这次主要想'+goal+'。',answers.audience==='unsure'?'目标受众还没确定，也想听听您的建议。':'希望让'+audience+'看到。',channel,assets,'','目前'+stage+'。想先和您聊聊「'+result.title+'」是否适合我们的需求，以及大概的制作安排和费用。','','预计拍摄地点：【城市／地区】','预计时间：【日期或月份】','预算范围（选填）：【金额与币种】'].join('\n');
    }
    const goal={understand:'help prospective clients understand our services',person:'introduce a founder or professional and their experience',explain:'explain a product or topic in detail',awareness:'promote a brand, launch or event',unsure:'explore what a video collaboration could look like'}[answers.goal];
    const audience={clients:'potential customers',partners:'business partners or industry peers',talent:'people who might join our team',public:'a wider audience interested in this subject'}[answers.audience];
    const channel={website:'We would use the video on our website and in conversations with clients.',social:'We would publish it on our own social accounts.',bryan:'We would like it to appear on your channels.',both:'We would like to use it on both our channels and yours.',unsure:'We would appreciate your advice on where to publish it.'}[answers.channel];
    const assets={person:'We can feature a founder or team member and their work.',work:'We have real projects, working scenes or customer cases to share.',product:'We have a product, service or event to film.',research:'We have a topic to explore and some supporting material.',none:'We would appreciate help deciding what to feature.'}[answers.assets];
    const stage={ready:'We have a specific project and an approximate timeline.',comparing:'We are looking for a production partner.',exploring:'We are exploring our options before deciding whether to commission a video.'}[answers.stage];
    return [t('briefHeading'),'','I’m from [company / brand]. We [briefly describe the business].','We would like to '+goal+'.',audience?'We hope to reach '+audience+'.':'We are still deciding who to focus on.',channel,assets,'',stage,'I’m interested in this option: '+result.title+'. Could we discuss your approach and a quote?','','Filming location: [city / region]','Timing: [date or month]','Budget, if known: [amount and currency]'].join('\n');
  }
  function getResult(){
    const kind=recommendation(),base=resultCopy[lang][kind];if(region!=='cn')return base;
    const regional={
      zh:{
        documentary:{extra:'如果需要，也可以从完整纪录片中剪出短版，用于不同的社交平台。具体拍谁、拍什么，会先和您一起策划。'},
        longform:{title:'专题解说与品牌内容',body:'如果产品原理、服务价值或行业知识需要详细介绍，可以围绕一个具体问题制作专题，用案例、演示和资料逐步说明。发布平台根据目标受众和项目需求确定。',items:['从目标客户关心的问题切入','制作完整品牌专题，或在相关内容中介绍品牌','提前确认发布平台、内容形式和使用授权'],extra:'可以考虑哔哩哔哩的完整专题，也可以按需要制作适合其他平台的版本。'},
        shortform:{title:'短视频与图文内容',body:'如果想宣传产品、活动或展示实际案例，可以先做短视频、图文或系列内容，再根据受众选择抖音、小红书、哔哩哔哩等平台。',items:['每条内容集中介绍一个特点或使用场景','按目标平台制作短视频、图文或系列内容','给观众留下咨询方式或进一步了解的入口'],extra:'如果一条短视频讲不完，可以拆成系列，或搭配一支完整专题。'},
        discovery:{body:'还没确定拍什么很正常。可以先聊聊您的业务、希望解决的问题和现有素材，再判断视频能在哪一步帮上忙。'}
      },
      en:{
        documentary:{extra:'We can also discuss shorter edits for different social platforms. The subject and filming plan will be developed together.'},
        longform:{title:'An explainer or brand feature',body:'A focused feature can explain a product, specialist service or industry using research, cases and demonstrations. The platform is selected around your audience and project.',items:['Start with a question your audience cares about','Create a dedicated feature or a relevant brand introduction','Agree on platforms, formats and usage rights'],extra:'A longer feature may suit Bilibili, with other versions prepared for selected platforms.'},
        shortform:{title:'Short videos and social posts',body:'Introduce a product, event or real case through short videos, photo posts or a series. Choose a platform, such as Douyin, Xiaohongshu or Bilibili, that suits the audience.',items:['Focus each piece on one feature or use case','Prepare videos, posts or a series for the selected platform','Give viewers a clear way to enquire or learn more'],extra:'A series or a longer companion feature can provide more detail when needed.'}
      }
    };
    return {...base,...regional[lang][kind]};
  }
  function renderResult(content){
    const result=getResult();
    const title=el('h3','result-title',result.title);title.tabIndex=-1;
    content.append(el('p','result-badge',t('resultKicker')),title,el('p','result-copy',result.body));
    const solutionPath={documentary:'documentary.html',longform:'explainers.html',shortform:'social.html'}[recommendation()];
    if(solutionPath){const solution=el('a','text-link result-solution',t('resultSolution')+' ↗');solution.href=solutionPath+'?region='+region+'&lang='+lang;content.append(solution);}
    const list=el('ul','result-list');result.items.forEach(item=>list.append(el('li','',item)));content.append(list);
    let extra=result.extra;
    if(answers.channel==='website'||answers.channel==='social')extra+=' '+t('ownChannel');
    if(answers.channel==='bryan')extra+=' '+t('myChannel');
    if(answers.channel==='both')extra+=' '+t('bothChannels');
    if(answers.assets==='none')extra+=' '+t('noAssets');
    content.append(el('p','result-secondary',extra));
    const next=el('p','result-copy',answers.stage==='ready'||answers.stage==='comparing'?t('readyIntro'):t('readySoon'));content.append(next);
    const label=el('label','result-caption',t('resultLabel'));label.htmlFor='project-brief';const brief=el('textarea','result-brief');brief.id='project-brief';brief.value=editedBrief[lang]??createBrief(result);brief.spellcheck=false;brief.addEventListener('input',()=>{editedBrief[lang]=brief.value;});content.append(label,brief);
    const actions=el('div','result-actions');
    actions.append(uiButton(t('copyBrief'),'button outline',async()=>{try{await navigator.clipboard.writeText(brief.value);toast(t('copied'));}catch{brief.focus();brief.select();toast(t('copyFailed'));}}));
    const email=el('a','button blue',t('emailBrief'));email.id='brief-email';actions.append(email);
    const whatsapp=contact().whatsapp?el('a','button outline',t('whatsappBrief')):null;
    if(whatsapp){whatsapp.id='brief-whatsapp';whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';actions.append(whatsapp);}
    if(contact().wechat){const wechat=uiButton(t('wechatBrief'),'button outline',async()=>{try{await navigator.clipboard.writeText(brief.value);toast(t('copied'));}catch{toast(t('copyFailed'));}openDialog($('#wechat-dialog'));});wechat.id='brief-wechat';actions.append(wechat);}
    function setDraftLinks(){email.href='mailto:'+contact().email+'?subject='+encodeURIComponent(lang==='zh'?'网站合作需求':'Project inquiry — Bryan Ng')+'&body='+encodeURIComponent(brief.value);if(whatsapp)whatsapp.href='https://wa.me/'+contact().whatsapp+'?text='+encodeURIComponent(brief.value);}
    setDraftLinks();email.addEventListener('click',setDraftLinks);whatsapp?.addEventListener('click',setDraftLinks);brief.addEventListener('input',setDraftLinks);
    content.append(actions,el('p','result-footnote',t('resultNote')));
    if(contact().wechat)content.append(el('p','result-footnote',t('wechatBriefNote')));
    content.append(uiButton(t('restart'),'quiz-back result-restart',()=>{step=0;answers={};finished=false;editedBrief={en:null,zh:null};renderQuiz();$('#question-title').focus({preventScroll:true});}));decorateIcons(content);
  }
  $('#year').textContent=String(new Date().getFullYear());changeLanguage(lang);
})();

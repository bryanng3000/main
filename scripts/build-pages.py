"""Generate the static pages from the shared layout; Python standard library only."""
from pathlib import Path
import re
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
template = (ROOT / 'src/layout.html').read_text()
copy_text = (ROOT / 'content.js').read_text()
english = json.loads(re.search(r'window.BRYAN_COPY = (\{.*?\});\n', copy_text, re.S).group(1))['en']
prefix, rest = template.split('<main id="main">', 1)
_, suffix = rest.split('</main>', 1)
suffix = suffix.replace('<a href="#top" data-i18n="backTop">','<a href="index.html#faq" data-i18n="faqNav">FAQ</a><a href="#top" data-i18n="backTop">')

def section(name):
    return re.search(r'<section\b[^>]*\bid="'+name+r'"[^>]*>.*?</section>', template, re.S).group()

def i(key, tag='span', cls=''):
    return f'<{tag}'+(f' class="{cls}"' if cls else '')+f' data-i18n="{key}">{escape(english[key])}</{tag}>'

def link(href, key, cls='text-link'):
    return f'<a class="{cls}" href="{href}">{i(key)}<span aria-hidden="true">↗</span></a>'

def breadcrumbs(key=None, back=False):
    trail='<div class="breadcrumb-trail">'+link('index.html','breadcrumbHome','')+(f'<span aria-hidden="true">/</span>{i(key)}' if key else '')+'</div>'
    button='<a class="button back-to-solutions" href="index.html#solutions"><span aria-hidden="true">←</span>'+i('detailBack')+'</a>' if back else ''
    return '<nav class="wrap breadcrumbs" aria-label="Breadcrumb">'+trail+button+'</nav>'

def solution_cards():
    cards=[]
    for n, path in enumerate(['documentary.html','explainers.html','social.html'],1):
        cards.append(f'<a class="solution-card" href="{path}"><div class="solution-card-top"><span>0{n}</span><span aria-hidden="true">↗</span></div>'+i(f'solution{n}Title','h3')+i(f'solution{n}Body','p')+'<div class="solution-card-bottom">'+i(f'solution{n}Format','span','solution-format')+i('solutionMore','span','solution-link')+'</div></a>')
    return '<div class="solution-grid">'+''.join(cards)+'</div>'

def contact_cta():
    return '<section class="wrap page-contact section"><div>'+i('pageContact','h2')+i('pageContactBody','p')+'</div>'+link('contact.html','homeContactCTA','button blue')+'</section>'

def partners_strip():
    return '<section class="home-partners" id="partners" aria-labelledby="partners-title"><div class="wrap"><div class="partner-strip-heading"><h2 id="partners-title">'+i('partnersTitle')+'</h2><button id="partner-motion" class="motion-toggle" type="button" aria-pressed="false" aria-controls="brand-track">'+i('pausePartners')+'</button></div>'+i('partnersPlaceholder','p','placeholder-note')+'<div class="brand-marquee"><div class="brand-track" id="brand-track"><div class="brand-group" id="partner-grid"></div></div></div></div></section>'

def work_solutions():
    return '<section class="work-solutions solutions-section section" id="solutions"><div class="wrap"><div class="section-top"><div>'+i('workSolutionsKicker','div','eyebrow')+i('workSolutionsTitle','h2')+'</div></div>'+solution_cards()+'</div></section>'

def feedback(category):
    return section('reviews').replace('class="reviews-section"','class="reviews-section service-feedback" data-review-category="'+category+'"')

home = '''<section class="home-hero wrap" aria-labelledby="hero-title"><div class="home-hero-copy">'''+i('homeKicker','div','eyebrow')+'<h1 id="hero-title">'+i('homeTitle')+'<em data-i18n="homeTitle2"></em></h1>'+i('homeIdentity','p','home-identity')+i('homeIntro','p','home-intro')+'<div class="hero-buttons">'+link('#solutions','homePrimary','button blue')+link('contact.html','homeSecondary')+'</div><a class="home-unsure" href="finder.html">'+i('homeUnsure')+' <span aria-hidden="true">↗</span></a></div><figure class="home-portrait"><img src="assets/bryan-original.jpg" alt="Bryan Ng 黄钲权" width="1895" height="2527" fetchpriority="high"><figcaption><span>Bryan Ng 黄钲权</span>'+i('photoNote')+'</figcaption></figure></section>'
home += '<section class="solutions-section section" id="solutions"><div class="wrap"><div class="section-top"><div>'+i('solutionsKicker','div','eyebrow')+'<h2>'+i('solutionsTitle')+i('solutionsTitle2','em')+'</h2></div>'+i('solutionsIntro','p','section-description')+'</div>'+solution_cards()+'</div></section>'
home += section('audience')
home += '<section class="wrap home-more section" aria-labelledby="home-more-title"><div class="home-more-heading">'+i('homeMoreKicker','div','eyebrow')+'<h2 id="home-more-title">'+i('homeMoreTitle')+i('homeMoreTitle2','em')+'</h2></div><div class="home-featured"><div class="work-grid" id="work-grid" data-film-ids="rvwYqiqj8wg"></div></div><div class="home-more-links"><article>'+i('navWork','h3')+i('homeWorkBody','p')+link('work.html','exploreWork')+'</article><article>'+i('navAbout','h3')+i('homeAboutBody','p')+link('about.html','navAbout')+'</article></div></section>'
home += partners_strip()
home += '<section class="home-next"><div class="wrap home-next-grid"><article>'+i('homeFinderTitle','h2')+i('homeFinderBody','p')+link('finder.html','homeFinderCTA','button outline')+'</article><article>'+i('homeContactTitle','h2')+i('homeContactBody','p')+link('contact.html','homeContactCTA','button blue')+'</article></div></section>'
home += section('faq')

services = re.search(r'<div class="service-grid">(.*?)</div>\s*<div class="production-note">', template, re.S).group(1)
service_articles = re.findall(r'<article\b.*?</article>', services, re.S)

def detail(n, slug, image, filmids):
    key=['doc','explain','social'][n]
    intro=breadcrumbs('breadcrumbSolutions', back=True)
    intro+='<section class="wrap detail-hero" aria-labelledby="page-title"><div>'+i(f'solution{n+1}Format','div','eyebrow')+'<h1 id="page-title">'+i(key+'PageTitle')+i(key+'PageTitle2','em')+'</h1>'+i(key+'PageIntro','p','detail-intro')+'<div class="hero-buttons">'+link('contact.html','detailDiscuss','button blue')+link('finder.html','navFinder')+'</div></div><figure><img src="'+image+'" alt="" width="720" height="405"></figure></section>'
    intro+='<section class="detail-fit"><div class="wrap detail-fit-grid">'+i('detailFit','h2')+'<ul>'+''.join(i(key+f'Fit{x}','li') for x in [1,2,3])+'</ul></div></section>'
    intro+='<section class="wrap section detail-production" id="scope"><div>'+i('detailScope','h2')+i('scopeNote','p')+i('productionNote','p','section-note')+'</div><div class="detail-service">'+service_articles[n]+'</div></section>'
    intro+='<section class="detail-work"><div class="wrap section"><div class="section-top"><div>'+i('detailExample','h2')+i('detailExampleNote','p','detail-example-note')+'</div>'+link('work.html','exploreWork')+'</div><div class="work-grid" id="work-grid" data-film-ids="'+filmids+'"></div></div></section>'
    intro+=feedback(slug)+contact_cta()+'<div class="wrap return-solutions">'+link('index.html#solutions','detailOther')+'</div>'
    return intro

pages={
 'index':(home,'homeTitle','Content production & documentaries'),
 'documentary':(detail(0,'documentary','assets/work-lawyer.jpg','rvwYqiqj8wg,cFNUXOzF8o8'),'solution1Title','People & professional documentaries'),
 'explainers':(detail(1,'explainers','assets/work-retirement.jpg','kB9ajFAxLaw,CP6NEL7REYQ'),'solution2Title','Explainers & brand features'),
 'social':(detail(2,'social','assets/work-4.jpg','9E874nT2Ggc'),'solution3Title','Short-form & social content'),
 'work':(breadcrumbs('workPageTitle')+section('work')+work_solutions()+contact_cta(),'workPageTitle','Work'),
 'about':(breadcrumbs('aboutPageTitle')+section('about')+section('audience')+contact_cta(),'aboutPageTitle','About'),
 'finder':(breadcrumbs('finderPageTitle')+section('finder'),'finderPageTitle','Project finder'),
 'contact':(breadcrumbs('contactPageTitle')+section('contact')+section('faq'),'contactPageTitle','Contact'),
}

nav = '<a href="index.html#solutions" data-nav="solutions" data-i18n="navSolutions">Solutions</a><a href="work.html" data-nav="work" data-i18n="navWork">Work</a><a href="about.html" data-nav="about" data-i18n="navAbout">About</a>'
prefix=re.sub(r'(<nav class="main-nav"[^>]*>).*?</nav>', lambda m:m.group(1)+nav+'</nav>',prefix,flags=re.S)
prefix=prefix.replace('<link rel="stylesheet" href="styles.css">','<link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="pages.css">\n  <link rel="stylesheet" href="theme.css">')
prefix=prefix.replace('content="#2249da"','content="#ffffff"')
for slug,(main,title_key,title) in pages.items():
    page_prefix=prefix.replace('<body>',f'<body data-page="{slug}" data-page-title="{title_key}">')
    page_prefix=page_prefix.replace('<title>Bryan Ng — Content Creator</title>',f'<title>{title} — Bryan Ng</title>')
    if slug not in ('index','documentary','explainers','social'):
        # Give every standalone information page one primary heading.
        main=re.sub(r'<h2\b([^>]*)>',r'<h1\1>',main,count=1)
        main=main.replace('</h2>','</h1>',1)
    html=page_prefix+'<main id="main">'+main+'</main>'+suffix
    html=html.replace('<br><em','<em')
    targets={'#work':'work.html','#about':'about.html','#collaborate':'index.html#solutions','#partners':'index.html#partners','#finder':'finder.html','#contact':'contact.html'}
    for old,new in targets.items():
        html=html.replace(f'href="{old}"',f'href="{new}"')
    # Wordmarks always return home; back-to-top remains local.
    html=re.sub(r'(class="wordmark" href=")#top',r'\1index.html',html)
    (ROOT/f'{slug}.html').write_text(html)
# Keep old bookmarks useful without retaining a separate Clients page.
(ROOT/'clients.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Brand collaborations — Bryan Ng</title><script>location.replace('index.html'+location.search+'#partners')</script></head><body><a href="index.html#partners">Brand collaborations / 合作品牌</a></body></html>''')
print('Generated '+str(len(pages))+' static pages.')

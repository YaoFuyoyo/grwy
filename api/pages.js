const { applyCors } = require('./_util/cors')
const { verifyToken } = require('./_util/auth')
const { getCollection, generatePageId } = require('./_util/db')

const themeMapping = {
  'minimal-white': 'theme-simple-white',
  'graphite-gray': 'theme-graphite-gray',
  'obsidian-black': 'theme-onyx-black',
  'oriental-red': 'theme-red-east',
  'vibrant-orange': 'theme-vibrant-orange',
  'amber-yellow': 'theme-amber-yellow',
  'forest-green': 'theme-forest-green',
  'tech-blue': 'theme-tech-blue',
  'future-purple': 'theme-future-purple'
}

function renderPage(pageData) {
  const { config, ...data } = pageData

  // 提取照片 URL（兼容 base64 字符串和 {url,name} 对象两种格式）
  const photoSrc = (img) => {
    if (typeof img === 'string') return img
    if (img && img.url) return img.url
    return ''
  }

  const themeClass = themeMapping[config.colorTheme] || 'theme-simple-white'

  const headerButtons = config.headerButtons || []
  const homeButtons = config.homeButtons || []

  const hasHeaderPortfolio = headerButtons.includes('header-portfolio')
  const hasHeaderResume = headerButtons.includes('header-resume')
  const hasHeaderContact = headerButtons.includes('header-contact')

  const hasHomePortfolio = homeButtons.includes('home-portfolio')
  const hasHomeResume = homeButtons.includes('home-resume')
  const hasHomeContact = homeButtons.includes('home-contact')

  const modules = config.modules || ['home', 'about', 'portfolio', 'skills']

  // 占位 SVG 常量（用于未上传文件时显示）
  const PH = {
    result: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 200%22 fill=%22%23e2e8f0%22%3E%3Crect width=%22300%22 height=%22200%22 rx=%2212%22/%3E%3Ctext x=%22150%22 y=%22100%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%2394a3b8%22 font-size=%2216%22%3E成果展示%3C/text%3E%3C/svg%3E",
    diploma: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280' fill='%23f8fafc'%3E%3Crect width='200' height='280' rx='4' stroke='%23e2e8f0' stroke-width='1'/%3E%3Ctext x='100' y='140' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-size='12'%3E毕业证书%3C/text%3E%3C/svg%3E",
    design: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280' fill='%23f8fafc'%3E%3Crect width='200' height='280' rx='4' stroke='%23e2e8f0' stroke-width='1'/%3E%3Ctext x='100' y='140' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-size='12'%3E毕业设计%3C/text%3E%3C/svg%3E",
    cover: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400' fill='white'%3E%3Crect width='300' height='400' rx='8' stroke='%23e2e8f0' stroke-width='1'/%3E%3Crect x='20' y='20' width='260' height='50' fill='%23f1f5f9' rx='4'/%3E%3Ctext x='150' y='180' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-size='12'%3E论文首页%3C/text%3E%3C/svg%3E",
    cert: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 420%22 fill=%22white%22%3E%3Crect width=%22300%22 height=%22420%22 rx=%228%22 stroke=%22%23e2e8f0%22 stroke-width=%221%22/%3E%3Ctext x=%22150%22 y=%22210%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%2394a3b8%22 font-size=%2214%22%3E证书%3C/text%3E%3C/svg%3E",
    honor: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='%23f1f5f9'%3E%3Crect width='200' height='200' rx='12'/%3E%3Ctext x='100' y='100' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-size='14'%3E荣誉奖项%3C/text%3E%3C/svg%3E",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='%23f8fafc'%3E%3Crect width='200' height='200' rx='12' stroke='%23e2e8f0' stroke-width='1'/%3E%3Ctext x='100' y='100' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-size='14'%3E商标图案%3C/text%3E%3C/svg%3E"
  }

  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.pageTitle || data.name || '个人主页'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/preview-style.css">
</head>
<body class="${themeClass}">
  <nav>
    <div class="nav-left">
      ${data.avatar ? `<img src="${data.avatar}" alt="头像" class="nav-logo">` : ''}
      <div class="nav-brand">
        <span class="nav-name">${data.name || '姓名'}</span>
        ${data.slogan ? `<span class="nav-slogan">${data.slogan}</span>` : ''}
      </div>
    </div>
    <div class="nav-center">
      <ul>
        ${modules.includes('home') ? '<li><a href="#home" onclick="scrollToSection(event, \'home\')">首页</a></li>' : ''}
        ${modules.includes('about') ? '<li><a href="#about" onclick="scrollToSection(event, \'about\')">关于我</a></li>' : ''}
        ${modules.includes('portfolio') ? '<li><a href="#portfolio" onclick="scrollToSection(event, \'portfolio\')">作品集</a></li>' : ''}
        ${modules.includes('skills') ? '<li><a href="#skills" onclick="scrollToSection(event, \'skills\')">专业技能</a></li>' : ''}
        ${modules.includes('work') ? '<li><a href="#work" onclick="scrollToSection(event, \'work\')">工作经历</a></li>' : ''}
        ${modules.includes('internship') ? '<li><a href="#internship" onclick="scrollToSection(event, \'internship\')">实习经历</a></li>' : ''}
        ${modules.includes('project') ? '<li><a href="#projects" onclick="scrollToSection(event, \'projects\')">项目经历</a></li>' : ''}
        ${modules.includes('education') ? '<li><a href="#education" onclick="scrollToSection(event, \'education\')">教育背景</a></li>' : ''}
        ${modules.includes('papers') ? '<li><a href="#papers" onclick="scrollToSection(event, \'papers\')">学术论文</a></li>' : ''}
        ${modules.includes('ip') ? '<li><a href="#intellectual" onclick="scrollToSection(event, \'intellectual\')">知识产权</a></li>' : ''}
        ${modules.includes('certifications') ? '<li><a href="#certifications" onclick="scrollToSection(event, \'certifications\')">资格证书</a></li>' : ''}
        ${modules.includes('honors') ? '<li><a href="#awards" onclick="scrollToSection(event, \'awards\')">荣誉奖项</a></li>' : ''}
      </ul>
    </div>
    <div class="nav-right">
      <div class="btn-group">
        ${hasHeaderPortfolio ? '<a href="#portfolio" class="btn" onclick="scrollToSection(event, \'portfolio\')">查看作品集</a>' : ''}
        ${hasHeaderResume ? `<a href="${data.resumeUrl || '#'}" class="btn" target="_blank">下载简历</a>` : ''}
        ${hasHeaderContact ? '<a href="#footer" class="btn" onclick="scrollToSection(event, \'footer\')">请联系我</a>' : ''}
      </div>
    </div>
  </nav>

  ${modules.includes('home') ? `
  <section class="hero hero-${config.homeDisplay}" id="home">
    ${config.homeDisplay === 'life-large' ? `
    <!-- 背景轮播模式 -->
    <div class="hero-bg-slider">
      ${(data.lifePhotoLarge && data.lifePhotoLarge.length > 0) ? data.lifePhotoLarge.map((img, i) => `
        <div class="hero-bg-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${photoSrc(img)}')"></div>
      `).join('') : ''}
    </div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-text hero-text-center">
        <h1>${data.name || '姓名'}</h1>
        <p class="subtitle">${data.position || ''}</p>
        <p class="intro">${(data.bio || '').replace(/\n/g, '<br>')}</p>
        <div class="hero-buttons">
          ${hasHomePortfolio ? '<a href="#portfolio" class="btn" onclick="scrollToSection(event, \'portfolio\')">查看作品集</a>' : ''}
          ${hasHomeResume ? `<a href="${data.resumeUrl || '#'}" class="btn" target="_blank">下载简历</a>` : ''}
          ${hasHomeContact ? '<a href="#footer" class="btn" onclick="scrollToSection(event, \'footer\')">请联系我</a>' : ''}
        </div>
      </div>
    </div>
    ` : `
    <!-- 照片展示模式（证件照 / 生活照中） -->
    <div class="hero-content">
      ${config.homeDisplay === 'life-small' && data.lifePhotoMedium && data.lifePhotoMedium.length > 0 ? `
      <!-- 多张照片轮播（1:1比例） -->
      <div class="hero-photo-slider" id="heroPhotoSlider" data-images='${JSON.stringify(data.lifePhotoMedium.map(photoSrc))}'>
        ${data.lifePhotoMedium.map((img, i) => `
        <div class="hero-photo-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${photoSrc(img)}')"></div>
        `).join('')}
        ${data.lifePhotoMedium.length > 1 ? `
        <div class="hero-slider-dots">
          ${data.lifePhotoMedium.map((_, i) => `<span class="hero-slider-dot ${i === 0 ? 'active' : ''}" onclick="heroSliderGoTo(${i})"></span>`).join('')}
        </div>
        ` : ''}
      </div>
      ` : `
      <!-- 单张证件照 -->
      <div class="hero-photo">
        <img src="${data.idPhoto || ''}" alt="照片">
      </div>
      `}
      <div class="hero-text">
        <h1>${data.name || '姓名'}</h1>
        <p class="subtitle">${data.position || ''}</p>
        <p class="intro">${(data.bio || '').replace(/\n/g, '<br>')}</p>
        <div class="hero-buttons">
          ${hasHomePortfolio ? '<a href="#portfolio" class="btn" onclick="scrollToSection(event, \'portfolio\')">查看作品集</a>' : ''}
          ${hasHomeResume ? `<a href="${data.resumeUrl || '#'}" class="btn" target="_blank">下载简历</a>` : ''}
          ${hasHomeContact ? '<a href="#footer" class="btn" onclick="scrollToSection(event, \'footer\')">请联系我</a>' : ''}
        </div>
      </div>
    </div>
    `}
  </section>
  ` : ''}

  ${modules.includes('about') ? `
  <section id="about">
    <div class="container">
      <div class="section-title fade-in">
        <h2>关于我</h2>
        <div class="line"></div>
      </div>
      <div class="about-content">
        <div class="about-info fade-in">
          <h3>基本信息</h3>
          ${data.name ? `<div class="info-item"><span class="label">姓名</span><span class="value">${data.name}</span></div>` : ''}
          ${data.birthday ? `<div class="info-item"><span class="label">出生日期</span><span class="value">${data.birthday}</span></div>` : ''}
          ${data.phone ? `<div class="info-item"><span class="label">电话</span><span class="value">${data.phone}</span></div>` : ''}
          ${data.email ? `<div class="info-item"><span class="label">邮箱</span><span class="value">${data.email}</span></div>` : ''}
          ${data.github ? `<div class="info-item"><span class="label">GitHub网址</span><span class="value">${data.github}</span></div>` : ''}
          ${data.hometown ? `<div class="info-item"><span class="label">籍贯</span><span class="value">${data.hometown}</span></div>` : ''}
          ${data.educationLevel ? `<div class="info-item"><span class="label">学历</span><span class="value">${data.educationLevel}</span></div>` : ''}
          ${data.driving ? `<div class="info-item"><span class="label">驾龄</span><span class="value">${data.driving}</span></div>` : ''}
          ${data.zodiac ? `<div class="info-item"><span class="label">星座</span><span class="value">${data.zodiac}</span></div>` : ''}
          ${data.mbti ? `<div class="info-item"><span class="label">MBTI</span><span class="value">${data.mbti}</span></div>` : ''}
          ${data.personality ? `<div class="info-item"><span class="label">性格</span><span class="value">${data.personality}</span></div>` : ''}
          ${data.hobby ? `<div class="info-item"><span class="label">爱好</span><span class="value">${data.hobby}</span></div>` : ''}
        </div>
        <div class="about-info fade-in">
          <h3>个人优势</h3>
          <div class="strengths-list">
            ${data.advantages && data.advantages.length > 0 ? data.advantages.map(adv => `
            <div class="strength-item">
              <h4>${adv.name || '优势名称'}</h4>
              <p>${(adv.desc || '暂无描述').replace(/\n/g, '<br>')}</p>
            </div>
            `).join('') : ''}
          </div>
        </div>
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('skills') ? `
  <section id="skills">
    <div class="container">
      <div class="section-title fade-in">
        <h2>专业技能</h2>
        <div class="line"></div>
      </div>
      ${data.skills && data.skills.length > 0 ? `
      <div class="skills-grid fade-in">
        ${data.skills.map(skill => `
        <div class="skill-card">
          <div class="icon">
            <img src="${skill.icon || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath d=\'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\'/%3E%3Cpolyline points=\'14 2 14 8 20 8\'/%3E%3Cline x1=\'16\' y1=\'13\' x2=\'8\' y2=\'13\'/%3E%3Cline x1=\'16\' y1=\'17\' x2=\'8\' y2=\'17\'/%3E%3Cpolyline points=\'10 9 9 9 8 9\'/%3E%3C/svg%3E'}" alt="${skill.name || '技能'}">
          </div>
          <h3>${skill.name || '技能名称'}</h3>
          <p>${skill.level || '熟练程度'}</p>
        </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </section>
  ` : ''}

  ${modules.includes('portfolio') ? `
  <section id="portfolio">
    <div class="container">
      <div class="section-title fade-in">
        <h2>作品集</h2>
        <div class="line"></div>
      </div>
      ${(data.portfolioItems || []).length > 0 ? `
      <div class="portfolio-scroll-container fade-in" id="portfolio-scroll-container">
        <button class="scroll-btn scroll-prev" id="portfolio-prev" style="display:none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="portfolio-scroll-track" id="portfolio-track">
          <div class="portfolio-images" id="portfolio-images-scroll">
            ${(data.portfolioItems || []).map((item, index) => `
            <div class="portfolio-image-item">
              <img src="${item.url}" alt="${item.name}">
              <div class="portfolio-name-overlay"><p>${item.name}</p></div>
            </div>
            `).join('')}
          </div>
        </div>
        <button class="scroll-btn scroll-next" id="portfolio-next" style="display:none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      ` : ''}
    </div>
  </section>
  ` : ''}

  ${modules.includes('work') ? `
  <section id="work">
    <div class="container">
      <div class="section-title fade-in">
        <h2>工作经历</h2>
        <div class="line"></div>
      </div>
      <div class="timeline fade-in">
        ${(data.workExperiences || []).map(work => {
          const resultFiles = Array.isArray(work.resultFiles) ? work.resultFiles : []
          const resultFileNames = Array.isArray(work.resultFileNames) ? work.resultFileNames : []
          const resultImgs = resultFiles.length > 0 ? resultFiles : [PH.result]
          const resultLabels = resultImgs.map((_, i) => (i < resultFileNames.length ? resultFileNames[i] : '成果展示').replace(/\.[^/.]+$/, ''))
          return `
        <div class="timeline-item">
          <div class="timeline-date-left">${work.time || ''}</div>
          <div class="timeline-dot"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <h3 class="company-name">${work.company || ''}</h3>
              <p class="position">${work.position || ''}</p>
            </div>
            <div class="timeline-body">
              <div class="timeline-work">
                ${(work.tasks || []).filter(t => t.type || t.desc).map(task => `
                <div class="work-section">
                  <h4>${task.type || '工作内容'}</h4>
                  ${task.desc ? `<ul><li>${task.desc.replace(/\n/g, '</li><li>')}</li></ul>` : ''}
                </div>
                `).join('')}
              </div>
              ${work.industry || work.result ? `
              <div class="timeline-portfolio">
                <div class="portfolio-title">
                  <span class="portfolio-title-left">${work.industry || ''}</span>
                  <span class="portfolio-title-right">成果展示</span>
                </div>
                <div class="portfolio-slider" data-images='${JSON.stringify(resultImgs)}' data-labels='${JSON.stringify(resultLabels)}'>
                  <img class="portfolio-slider-img" src="${resultImgs[0]}" alt="成果展示">
                  <div class="portfolio-slider-overlay"><p>${resultLabels[0]}</p></div>
                </div>
                <div class="portfolio-slider-dots"></div>
                ${work.result ? `
                <div class="work-section">
                  <h4><span class="section-icon">✓</span>业绩成果</h4>
                  <ul><li>${work.result.replace(/\n/g, '</li><li>')}</li></ul>
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        `}).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('internship') ? `
  <section id="internship">
    <div class="container">
      <div class="section-title fade-in">
        <h2>实习经历</h2>
        <div class="line"></div>
      </div>
      <div class="timeline fade-in">
        ${(data.internships || []).map(intern => `
        <div class="timeline-item">
          <div class="timeline-date-left">${intern.time || ''}</div>
          <div class="timeline-dot"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <h3 class="company-name">${intern.company || ''}</h3>
              <p class="position">${intern.position || ''}</p>
            </div>
            <div class="timeline-content">
              ${intern.desc ? `<ul><li>${intern.desc.replace(/\n/g, '</li><li>')}</li></ul>` : ''}
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('project') ? `
  <section id="projects">
    <div class="container">
      <div class="section-title fade-in">
        <h2>项目经历</h2>
        <div class="line"></div>
      </div>
      <div class="timeline fade-in">
        ${(data.projects || []).map(project => `
        <div class="timeline-item">
          <div class="timeline-date-left">${project.time || ''}</div>
          <div class="timeline-dot"></div>
          <div class="timeline-card">
            <div class="timeline-header">
              <h3 class="company-name">${project.name || ''}</h3>
              <p class="position">${project.position || ''}</p>
            </div>
            ${project.desc ? `<p class="project-desc">${project.desc}</p>` : ''}
            <div class="timeline-content">
              ${project.content ? `<ul><li>${project.content.replace(/\n/g, '</li><li>')}</li></ul>` : ''}
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('education') ? `
  <section id="education">
    <div class="container">
      <div class="section-title fade-in">
        <h2>教育背景</h2>
        <div class="line"></div>
      </div>
      <div class="education-grid fade-in">
        ${(Array.isArray(data.education) ? data.education : []).map((edu, idx, arr) => {
          const degreeMap = { '博士': '博士学位', '硕士': '硕士学位', '本科': '本科学位', '大专': '大专文凭' }
          const degreeEnMap = { '博士': 'Doctoral Philosophy', '硕士': "Master's Degree", '本科': "Bachelor's Degree", '大专': 'Associate Degree' }
          const total = arr.length
          const isFull = (total === 1) || (total === 3 && idx === 2)
          // 直接使用多文件数组：毕业设计在前、毕业证书在后
          const designFiles = Array.isArray(edu.designFiles) ? edu.designFiles : []
          const designFileNames = Array.isArray(edu.designFileNames) ? edu.designFileNames : []
          const diplomaFiles = Array.isArray(edu.diplomaFiles) ? edu.diplomaFiles : []
          const diplomaFileNames = Array.isArray(edu.diplomaFileNames) ? edu.diplomaFileNames : []
          const hasEduImages = designFiles.length > 0 || diplomaFiles.length > 0
          return `
        <div class="education-card${isFull ? ' edu-full' : ''}">
          <div class="education-header">
            <h3>${degreeMap[edu.degree] || edu.degree} <span>${degreeEnMap[edu.degree] || ''}</span></h3>
          </div>
          <div class="education-body">
            <div class="info">
              <h4>${edu.school || ''} <span>${edu.major || ''}（${edu.time || ''}）</span></h4>
            </div>
            <div class="edu-detail">
              ${edu.score ? `
              <div class="edu-section">
                <h5><span class="detail-icon">📊</span>专业成绩</h5>
                <p>${edu.score}</p>
              </div>
              ` : ''}
              ${edu.courses ? `
              <div class="edu-section">
                <h5><span class="detail-icon">📚</span>主修课程</h5>
                <p>${edu.courses}</p>
              </div>
              ` : ''}
              ${edu.experience ? `
              <div class="edu-section">
                <h5><span class="detail-icon">🎯</span>在校经历</h5>
                <ul><li>${edu.experience.replace(/\n/g, '</li><li>')}</li></ul>
              </div>
              ` : ''}
              ${edu.thesis ? `
              <div class="edu-section">
                <h5><span class="detail-icon">📝</span>论文题目</h5>
                <p>${edu.thesis}</p>
              </div>
              ` : ''}
            </div>
            ${hasEduImages ? `
            <div class="edu-image-grid">
              ${designFiles.map((f, i) => `
              <div class="cert-item">
                <img src="${f}" alt="毕业设计">
                <p>${(designFileNames[i] || '毕业设计').replace(/\.[^/.]+$/, '')}</p>
              </div>`).join('')}
              ${diplomaFiles.map((f, i) => `
              <div class="cert-item">
                <img src="${f}" alt="毕业证书">
                <p>${(diplomaFileNames[i] || '毕业证书').replace(/\.[^/.]+$/, '')}</p>
              </div>`).join('')}
            </div>
            ` : ''}
          </div>
        </div>
        `}).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('papers') ? `
  <section id="papers">
    <div class="container">
      <div class="section-title fade-in">
        <h2>学术论文</h2>
        <div class="line"></div>
      </div>
      <div class="papers-scroll-container fade-in">
        <button class="scroll-btn scroll-prev" id="papers-prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="papers-grid">
        ${(data.papers || []).map(paper => `
        <div class="paper-card">
          <div class="paper-image">
            <img src="${paper.coverFile || PH.cover}" alt="论文首页">
            ${paper.journal ? `<span class="paper-journal-tag">${paper.journal}</span>` : ''}
          </div>
          <div class="paper-content">
            <h3>${paper.name || ''}</h3>
            <div class="paper-meta">
              <span class="paper-type">${paper.type || ''}</span>
              ${paper.attachFile ? `<a class="paper-link" href="${paper.attachFile}" target="_blank">查看全文→</a>` : '<span class="paper-link disabled">暂无全文</span>'}
            </div>
          </div>
        </div>
        `).join('')}
        </div>
        <button class="scroll-btn scroll-next" id="papers-next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('ip') ? `
  <section id="intellectual">
    <div class="container">
      <div class="section-title fade-in">
        <h2>知识产权</h2>
        <div class="line"></div>
      </div>
      <div class="intellectual-scroll-container fade-in">
        <button class="scroll-btn scroll-prev" id="intellectual-prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="intellectual-grid">
        ${(data.patents || []).filter(p => p.name).map(patent => `
        <div class="intellectual-card">
          <div class="intellectual-subtitle">专利</div>
          <h3>${patent.name || ''}</h3>
          <div class="intellectual-info">
            ${patent.number ? `<p><span>授权公告号：</span>${patent.number}</p>` : ''}
            ${patent.type ? `<p><span>专利类型：</span>${patent.type}</p>` : ''}
          </div>
        </div>
        `).join('')}
        ${(data.copyrights || []).filter(c => c.name).map(copyright => `
        <div class="intellectual-card">
          <div class="intellectual-subtitle">著作</div>
          <h3>${copyright.name || ''}</h3>
          <div class="intellectual-info">
            ${copyright.type ? `<p><span>著作类别：</span>${copyright.type}</p>` : ''}
            ${copyright.number ? `<p><span>登记号：</span>${copyright.number}</p>` : ''}
          </div>
        </div>
        `).join('')}
        ${(data.trademarks || []).filter(t => t.name).map(trademark => `
        <div class="intellectual-card">
          <div class="intellectual-subtitle">商标</div>
          <h3>${trademark.name || ''}</h3>
          <div class="intellectual-info">
            <p><span>商标图案：</span>${trademark.logoFile ? `<a class="paper-link intellectual-link" href="${trademark.logoFile}" data-image="${trademark.logoFile}">查看商标→</a>` : '<span class="paper-link disabled">暂无商标图</span>'}</p>
            ${trademark.number ? `<p><span>申请/注册号：</span>${trademark.number}</p>` : ''}
          </div>
        </div>
        `).join('')}
        </div>
        <button class="scroll-btn scroll-next" id="intellectual-next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('certifications') ? `
  <section id="certifications">
    <div class="container">
      <div class="section-title fade-in">
        <h2>资格证书</h2>
        <div class="line"></div>
      </div>
      <div class="cert-scroll-container fade-in">
        <button class="scroll-btn scroll-prev" id="cert-prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="cert-grid">
        ${(data.certifications || []).filter(c => c.name).map(cert => {
          const certFiles = Array.isArray(cert.certFiles) ? cert.certFiles : []
          const certFileNames = Array.isArray(cert.certFileNames) ? cert.certFileNames : []
          const certImgs = certFiles.length > 0 ? certFiles : [PH.cert]
          const certLabels = certImgs.map((_, i) => (i < certFileNames.length ? certFileNames[i] : '证书').replace(/\.[^/.]+$/, ''))
          return `
        <div class="cert-card">
          <div class="cert-image" data-images='${JSON.stringify(certImgs)}' data-labels='${JSON.stringify(certLabels)}'>
            <img src="${certImgs[0]}" alt="证书">
            <div class="portfolio-slider-overlay"><p>${certLabels[0]}</p></div>
          </div>
          <div class="cert-content">
            <h3>${cert.name || ''}</h3>
            ${cert.time ? `<p>${cert.time}</p>` : ''}
          </div>
        </div>
        `}).join('')}
        </div>
        <button class="scroll-btn scroll-next" id="cert-next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
  ` : ''}

  ${modules.includes('honors') ? `
  <section id="awards">
    <div class="container">
      <div class="section-title fade-in">
        <h2>荣誉奖项</h2>
        <div class="line"></div>
      </div>
      <div class="awards-scroll-container fade-in">
        <button class="scroll-btn scroll-prev" id="awards-prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="awards-scroll-track" id="awards-track">
          <div class="awards-scroll-inner" id="awards-scroll-inner">
            ${(data.honors || []).filter(a => a.name).map(award => {
              const honorFiles = Array.isArray(award.honorFiles) ? award.honorFiles : []
              const honorFileNames = Array.isArray(award.honorFileNames) ? award.honorFileNames : []
              const honorImgs = honorFiles.length > 0 ? honorFiles : [PH.honor]
              const honorLabels = honorImgs.map((_, i) => (i < honorFileNames.length ? honorFileNames[i] : '奖项').replace(/\.[^/.]+$/, ''))
              return `
            <div class="award-card-scroll">
              <div class="award-image" data-images='${JSON.stringify(honorImgs)}' data-labels='${JSON.stringify(honorLabels)}'>
                <img src="${honorImgs[0]}" alt="奖项">
                <div class="portfolio-slider-overlay"><p>${honorLabels[0]}</p></div>
              </div>
              <div class="award-content">
                <h3>${award.name || ''}</h3>
                ${award.desc ? `<p>${award.desc}</p>` : ''}
              </div>
            </div>
            `}).join('')}
          </div>
        </div>
        <button class="scroll-btn scroll-next" id="awards-next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
  ` : ''}

  <div class="mobile-nav">
    <a href="#home" onclick="scrollToSection(event, 'home')">首页</a>
    <a href="#portfolio" onclick="scrollToSection(event, 'portfolio')">作品</a>
    <a href="#work" onclick="scrollToSection(event, 'work')">工作</a>
    <a href="#education" onclick="scrollToSection(event, 'education')">学历</a>
    <a href="#awards" onclick="scrollToSection(event, 'awards')">奖项</a>
  </div>

  <footer id="footer">
    <div class="footer-content">
      <div class="footer-left">
        <div class="footer-contact">
          <h3>联系方式</h3>
          ${data.phone ? `<p>电话：${data.phone}</p>` : ''}
          ${data.email ? `<p>邮箱：${data.email}</p>` : ''}
          ${data.github ? `<p>GitHub：${data.github}</p>` : ''}
          ${data.wechat ? `<p>微信：${data.wechat}</p>` : ''}
          ${data.qq ? `<p>QQ：${data.qq}</p>` : ''}
          ${data.weibo ? `<p>微博：${data.weibo}</p>` : ''}
        </div>
      </div>
      <div class="footer-right">
        <div class="footer-qrcodes">
          ${data.wechatQr ? `
          <div class="qrcode-item">
            <img src="${data.wechatQr}" alt="微信二维码">
            <span>微信</span>
          </div>
          ` : ''}
          ${data.qqQr ? `
          <div class="qrcode-item">
            <img src="${data.qqQr}" alt="QQ二维码">
            <span>QQ</span>
          </div>
          ` : ''}
          ${data.weiboQr ? `
          <div class="qrcode-item">
            <img src="${data.weiboQr}" alt="微博二维码">
            <span>微博</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
    <p>© ${new Date().getFullYear()} ${data.name || '姓名'} · ${data.slogan || '个人网页'}</p>
  </footer>`

  html += `<script>
    function scrollToSection(event, sectionId) {
      event.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });

    const portfolioImages = document.querySelector('#portfolio-track .portfolio-images');
    const portfolioPrev = document.getElementById('portfolio-prev');
    const portfolioNext = document.getElementById('portfolio-next');

    if (portfolioImages && portfolioPrev && portfolioNext) {
      let scrollInterval;
      let isScrolling = false;

      function checkScrollButtons() {
        const track = document.getElementById('portfolio-track');
        if (track && portfolioImages.scrollWidth > track.clientWidth) {
          portfolioImages.style.justifyContent = 'flex-start';
          portfolioPrev.style.display = 'flex';
          portfolioNext.style.display = 'flex';
        } else {
          portfolioImages.style.justifyContent = 'center';
          portfolioPrev.style.display = 'none';
          portfolioNext.style.display = 'none';
        }
      }

      setTimeout(checkScrollButtons, 100);
      window.addEventListener('resize', checkScrollButtons);

      portfolioPrev.addEventListener('click', () => {
        const items = portfolioImages.querySelectorAll('.portfolio-image-item');
        if (items.length === 0) return;
        
        const itemWidth = items[0].offsetWidth + 24;
        
        if (portfolioImages.scrollLeft < itemWidth) {
          portfolioImages.scrollTo({
            left: portfolioImages.scrollWidth - portfolioImages.clientWidth,
            behavior: 'smooth'
          });
        } else {
          portfolioImages.scrollBy({
            left: -itemWidth,
            behavior: 'smooth'
          });
        }
      });

      portfolioNext.addEventListener('click', () => {
        const items = portfolioImages.querySelectorAll('.portfolio-image-item');
        if (items.length === 0) return;
        
        const itemWidth = items[0].offsetWidth + 24;
        const maxScroll = portfolioImages.scrollWidth - portfolioImages.clientWidth;
        
        if (portfolioImages.scrollLeft >= maxScroll - 10) {
          portfolioImages.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          portfolioImages.scrollBy({
            left: itemWidth,
            behavior: 'smooth'
          });
        }
      });

      function startAutoScroll() {
        scrollInterval = setInterval(() => {
          if (!isScrolling) {
            isScrolling = true;
            const items = portfolioImages.querySelectorAll('.portfolio-image-item');
            if (items.length > 0) {
              const itemWidth = items[0].offsetWidth + 24;
              const maxScroll = portfolioImages.scrollWidth - portfolioImages.clientWidth;
              
              if (portfolioImages.scrollLeft >= maxScroll - 10) {
                portfolioImages.scrollTo({
                  left: 0,
                  behavior: 'smooth'
                });
              } else {
                portfolioImages.scrollBy({
                  left: itemWidth,
                  behavior: 'smooth'
                });
              }
            }
            setTimeout(() => {
              isScrolling = false;
            }, 800);
          }
        }, 2000);
      }

      function stopAutoScroll() {
        if (scrollInterval) {
          clearInterval(scrollInterval);
          scrollInterval = null;
        }
      }

      startAutoScroll();

      portfolioImages.addEventListener('mouseenter', stopAutoScroll);
      portfolioImages.addEventListener('mouseleave', startAutoScroll);
      portfolioPrev.addEventListener('mouseenter', stopAutoScroll);
      portfolioNext.addEventListener('mouseenter', stopAutoScroll);
      portfolioPrev.addEventListener('mouseleave', startAutoScroll);
      portfolioNext.addEventListener('mouseleave', startAutoScroll);
    }

    const awardsScroll = document.querySelector('#awards-track .awards-scroll-inner');
    const awardsPrev = document.getElementById('awards-prev');
    const awardsNext = document.getElementById('awards-next');

    if (awardsScroll && awardsPrev && awardsNext) {
      const cards = awardsScroll.querySelectorAll('.award-card-scroll');
      // 荣誉卡片多于3张时才启用滚动轮播（翻页按钮、自动滚动），否则居中展示且不显示按钮
      if (cards.length > 3) {
        const awardsContainer = awardsScroll.closest('.awards-scroll-container');
        if (awardsContainer) {
          awardsContainer.classList.add('has-many');
        }

        let awardsScrollInterval;
        let awardsIsScrolling = false;

        const getAwardWidth = () => {
          if (cards.length > 0) {
            return cards[0].offsetWidth + 32;
          }
          return 400;
        };

        awardsPrev.addEventListener('click', () => {
          const itemWidth = getAwardWidth();
          if (awardsScroll.scrollLeft < itemWidth) {
            awardsScroll.scrollTo({
              left: awardsScroll.scrollWidth - awardsScroll.clientWidth,
              behavior: 'smooth'
            });
          } else {
            awardsScroll.scrollBy({
              left: -itemWidth,
              behavior: 'smooth'
            });
          }
        });

        awardsNext.addEventListener('click', () => {
          const itemWidth = getAwardWidth();
          const maxScroll = awardsScroll.scrollWidth - awardsScroll.clientWidth;
          if (awardsScroll.scrollLeft >= maxScroll - 10) {
            awardsScroll.scrollTo({
              left: 0,
              behavior: 'smooth'
            });
          } else {
            awardsScroll.scrollBy({
              left: itemWidth,
              behavior: 'smooth'
            });
          }
        });

        function awardsStartAutoScroll() {
          awardsScrollInterval = setInterval(() => {
            if (!awardsIsScrolling) {
              awardsIsScrolling = true;
              const itemWidth = getAwardWidth();
              const maxScroll = awardsScroll.scrollWidth - awardsScroll.clientWidth;
              if (awardsScroll.scrollLeft >= maxScroll - 10) {
                awardsScroll.scrollTo({
                  left: 0,
                  behavior: 'smooth'
                });
              } else {
                awardsScroll.scrollBy({
                  left: itemWidth,
                  behavior: 'smooth'
                });
              }
              setTimeout(() => {
                awardsIsScrolling = false;
              }, 800);
            }
          }, 2000);
        }

        function awardsStopAutoScroll() {
          if (awardsScrollInterval) {
            clearInterval(awardsScrollInterval);
            awardsScrollInterval = null;
          }
        }

        awardsStartAutoScroll();

        awardsScroll.addEventListener('mouseenter', awardsStopAutoScroll);
        awardsScroll.addEventListener('mouseleave', awardsStartAutoScroll);
        awardsPrev.addEventListener('mouseenter', awardsStopAutoScroll);
        awardsNext.addEventListener('mouseenter', awardsStopAutoScroll);
        awardsPrev.addEventListener('mouseleave', awardsStartAutoScroll);
        awardsNext.addEventListener('mouseleave', awardsStartAutoScroll);
      }
    }

    // 通用卡片滚动：papers / intellectual / certs 复用
    function initCardScroll(gridSelector, prevSelector, nextSelector, containerSelector, cardSelector) {
      const scrollGrid = document.querySelector(gridSelector);
      const prevBtn = document.getElementById(prevSelector);
      const nextBtn = document.getElementById(nextSelector);
      if (!scrollGrid || !prevBtn || !nextBtn) return;

      const cards = scrollGrid.querySelectorAll(cardSelector);
      if (cards.length > 3) {
        const container = scrollGrid.closest(containerSelector);
        if (container) container.classList.add('has-many');

        let scrollInterval;
        let isScrolling = false;

        const getItemWidth = () => {
          if (cards.length > 0) return cards[0].offsetWidth + 32;
          return 400;
        };

        prevBtn.addEventListener('click', () => {
          const itemWidth = getItemWidth();
          if (scrollGrid.scrollLeft < itemWidth) {
            scrollGrid.scrollTo({ left: scrollGrid.scrollWidth - scrollGrid.clientWidth, behavior: 'smooth' });
          } else {
            scrollGrid.scrollBy({ left: -itemWidth, behavior: 'smooth' });
          }
        });

        nextBtn.addEventListener('click', () => {
          const itemWidth = getItemWidth();
          const maxScroll = scrollGrid.scrollWidth - scrollGrid.clientWidth;
          if (scrollGrid.scrollLeft >= maxScroll - 10) {
            scrollGrid.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollGrid.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        });

        function startAutoScroll() {
          scrollInterval = setInterval(() => {
            if (!isScrolling) {
              isScrolling = true;
              const itemWidth = getItemWidth();
              const maxScroll = scrollGrid.scrollWidth - scrollGrid.clientWidth;
              if (scrollGrid.scrollLeft >= maxScroll - 10) {
                scrollGrid.scrollTo({ left: 0, behavior: 'smooth' });
              } else {
                scrollGrid.scrollBy({ left: itemWidth, behavior: 'smooth' });
              }
              setTimeout(() => { isScrolling = false; }, 800);
            }
          }, 2000);
        }

        function stopAutoScroll() {
          if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
        }

        startAutoScroll();
        scrollGrid.addEventListener('mouseenter', stopAutoScroll);
        scrollGrid.addEventListener('mouseleave', startAutoScroll);
        prevBtn.addEventListener('mouseenter', stopAutoScroll);
        nextBtn.addEventListener('mouseenter', stopAutoScroll);
        prevBtn.addEventListener('mouseleave', startAutoScroll);
        nextBtn.addEventListener('mouseleave', startAutoScroll);
      }
    }

    initCardScroll('.papers-grid', 'papers-prev', 'papers-next', '.papers-scroll-container', '.paper-card');
    initCardScroll('.intellectual-grid', 'intellectual-prev', 'intellectual-next', '.intellectual-scroll-container', '.intellectual-card');
    initCardScroll('.cert-grid', 'cert-prev', 'cert-next', '.cert-scroll-container', '.cert-card');

    document.querySelectorAll('.intellectual-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const imageUrl = link.dataset.image;
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = '<div class="lightbox-content"><img src="' + imageUrl + '" alt="商标图案"><button class="lightbox-close">×</button></div>';
        document.body.appendChild(lightbox);
        
        lightbox.addEventListener('click', (e) => {
          if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            lightbox.remove();
          }
        });
      });
    });

    document.querySelectorAll('nav a, .hero-buttons .btn').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId.startsWith('#')) {
          e.preventDefault();
          document.querySelector(targetId)?.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });

    document.querySelectorAll('.portfolio-slider').forEach(slider => {
      const images = JSON.parse(slider.dataset.images);
      const labels = JSON.parse(slider.dataset.labels);
      const imgEl = slider.querySelector('.portfolio-slider-img');
      const overlayEl = slider.querySelector('.portfolio-slider-overlay p');
      const dotsContainer = slider.parentElement.querySelector('.portfolio-slider-dots');
      let currentIndex = 0;
      let intervalId = null;

      images.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
          currentIndex = i;
          updateSlider();
          resetInterval();
        });
        dotsContainer.appendChild(dot);
      });

      function updateSlider() {
        imgEl.src = images[currentIndex];
        overlayEl.textContent = labels[currentIndex];
        dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
      }

      function nextSlide() {
        currentIndex = (currentIndex + 1) % images.length;
        updateSlider();
      }

      function resetInterval() {
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 3000);
      }

      resetInterval();

      slider.addEventListener('mouseenter', () => clearInterval(intervalId));
      slider.addEventListener('mouseleave', () => resetInterval());
    });

    document.querySelectorAll('#certifications .cert-image').forEach(slider => {
      const images = JSON.parse(slider.dataset.images);
      const imgEl = slider.querySelector('img');
      const overlayEl = slider.querySelector('.portfolio-slider-overlay p');
      let currentIndex = 0;
      let intervalId = null;

      function updateSlider() {
        imgEl.src = images[currentIndex];
        overlayEl.textContent = (currentIndex + 1) + '/' + images.length;
      }

      function nextSlide() {
        currentIndex = (currentIndex + 1) % images.length;
        updateSlider();
      }

      function resetInterval() {
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 3000);
      }

      resetInterval();

      slider.addEventListener('mouseenter', () => clearInterval(intervalId));
      slider.addEventListener('mouseleave', () => resetInterval());
    });

    // 首页照片轮播（生活照中 1:1）
    const heroSlider = document.getElementById('heroPhotoSlider');
    if (heroSlider) {
      const heroImages = JSON.parse(heroSlider.dataset.images);
      let heroCurrentIndex = 0;
      let heroIntervalId = null;
      const heroSlides = heroSlider.querySelectorAll('.hero-photo-slide');
      const heroDots = heroSlider.querySelectorAll('.hero-slider-dot');

      function heroUpdateSlider() {
        heroSlides.forEach(s => s.classList.remove('active'));
        heroDots.forEach(d => d.classList.remove('active'));
        if (heroSlides[heroCurrentIndex]) heroSlides[heroCurrentIndex].classList.add('active');
        if (heroDots[heroCurrentIndex]) heroDots[heroCurrentIndex].classList.add('active');
      }

      window.heroSliderNext = function() {
        heroCurrentIndex = (heroCurrentIndex + 1) % heroImages.length;
        heroUpdateSlider();
        heroResetInterval();
      };

      window.heroSliderPrev = function() {
        heroCurrentIndex = (heroCurrentIndex - 1 + heroImages.length) % heroImages.length;
        heroUpdateSlider();
        heroResetInterval();
      };

      window.heroSliderGoTo = function(index) {
        heroCurrentIndex = index;
        heroUpdateSlider();
        heroResetInterval();
      };

      function heroResetInterval() {
        clearInterval(heroIntervalId);
        heroIntervalId = setInterval(() => {
          heroCurrentIndex = (heroCurrentIndex + 1) % heroImages.length;
          heroUpdateSlider();
        }, 3000);
      }

      heroResetInterval();
    }

    // 首页背景轮播（生活照大 2:1）
    const bgSlider = document.querySelector('.hero-bg-slider');
    if (bgSlider) {
      const bgSlides = bgSlider.querySelectorAll('.hero-bg-slide');
      let bgCurrentIndex = 0;
      let bgIntervalId = setInterval(() => {
        bgSlides[bgCurrentIndex].classList.remove('active');
        bgCurrentIndex = (bgCurrentIndex + 1) % bgSlides.length;
        bgSlides[bgCurrentIndex].classList.add('active');
      }, 4000);
    }
  </script></body></html>`

  return html
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  const action = req.query.action || ''
  
  try {
    if (action === 'get' && req.method === 'GET') {
      const { subdomain, userId } = req.query

      if (!subdomain || !userId) {
        return res.status(400).send('缺少参数')
      }

      const collection = await getCollection('profile_builder', 'pages')
      const page = await collection.findOne({ subdomain, ownerId: userId })
      
      if (!page) {
        return res.status(404).send('页面不存在')
      }
      
      delete page._id
      
      const html = renderPage(page)

      res.setHeader('Content-Type', 'text/html')
      return res.status(200).send(html)
    }

    if (action === 'getById' && req.method === 'GET') {
      const authResult = verifyToken(req, res)

      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }

      const pageId = req.query.pageId

      if (!pageId) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供页面ID' })
      }

      const collection = await getCollection('profile_builder', 'pages')
      const page = await collection.findOne({ pageId, ownerId: authResult.userId })

      if (!page) {
        return res.status(404).json({ ok: false, error: 'PAGE_NOT_FOUND', message: '页面不存在或无权访问' })
      }

      delete page._id

      return res.status(200).json({
        ok: true,
        page
      })
    }
    
    if (action === 'create' && req.method === 'POST') {
      const authResult = verifyToken(req, res)
      
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { subdomain, config, ...profileData } = body
      
      if (!subdomain || !config) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供网址参数和配置' })
      }
      
      const subdomainRegex = /^[a-zA-Z0-9_-]{3,20}$/
      if (!subdomainRegex.test(subdomain)) {
        return res.status(400).json({ ok: false, error: 'INVALID_SUBDOMAIN', message: '网址参数只能包含字母、数字、下划线和短横线，长度3-20位' })
      }
      
      const pagesCollection = await getCollection('profile_builder', 'pages')
      const existing = await pagesCollection.findOne({ subdomain })
      
      if (existing) {
        return res.status(409).json({ ok: false, error: 'SUBDOMAIN_EXISTS', message: '该网址已被使用' })
      }
      
      const pageId = await generatePageId()
      
      const pageData = {
        ownerId: authResult.userId,
        pageId,
        subdomain,
        config,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await pagesCollection.insertOne(pageData)
      delete pageData._id
      
      const pageUrl = `${req.headers.host}/${subdomain}/${authResult.userId}`
      
      return res.status(200).json({
        ok: true,
        url: pageUrl,
        page: pageData,
        message: '页面创建成功'
      })
    }
    
    if (action === 'update' && req.method === 'PUT') {
      const authResult = verifyToken(req, res)
      
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }
      
      const pageId = req.query.pageId || req.params.pageId
      
      if (!pageId) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供页面ID' })
      }
      
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      
      const collection = await getCollection('profile_builder', 'pages')
      const page = await collection.findOne({ pageId, ownerId: authResult.userId })
      
      if (!page) {
        return res.status(404).json({ ok: false, error: 'PAGE_NOT_FOUND', message: '页面不存在或无权访问' })
      }
      
      const updateData = { ...body, updatedAt: new Date() }
      delete updateData.ownerId
      delete updateData.pageId
      delete updateData.createdAt
      
      await collection.updateOne(
        { pageId, ownerId: authResult.userId },
        { $set: updateData }
      )
      
      const updatedPage = await collection.findOne({ pageId, ownerId: authResult.userId })
      delete updatedPage._id
      
      return res.status(200).json({
        ok: true,
        page: updatedPage,
        message: '更新成功'
      })
    }
    
    if (action === 'delete' && req.method === 'DELETE') {
      const authResult = verifyToken(req, res)
      
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }
      
      const pageId = req.query.pageId || req.params.pageId
      
      if (!pageId) {
        return res.status(400).json({ ok: false, error: 'INVALID_PARAMS', message: '请提供页面ID' })
      }
      
      const collection = await getCollection('profile_builder', 'pages')
      const page = await collection.findOne({ pageId, ownerId: authResult.userId })
      
      if (!page) {
        return res.status(404).json({ ok: false, error: 'PAGE_NOT_FOUND', message: '页面不存在或无权访问' })
      }
      
      await collection.deleteOne({ pageId, ownerId: authResult.userId })
      
      return res.status(200).json({
        ok: true,
        message: '删除成功'
      })
    }
    
    if (action === 'list' && req.method === 'GET') {
      const authResult = verifyToken(req, res)
      
      if (!authResult.ok) {
        return res.status(401).json({ ok: false, error: authResult.error, message: authResult.message })
      }
      
      const collection = await getCollection('profile_builder', 'pages')
      const pages = await collection.find({ ownerId: authResult.userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      const result = pages.map(page => {
        delete page._id
        delete page.passwordHash
        return page
      })
      
      return res.status(200).json({
        ok: true,
        pages: result
      })
    }
    
    return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '接口不存在' })
  } catch (err) {
    console.error('Pages API error:', err.message, err.stack)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误: ' + err.message })
  }
}

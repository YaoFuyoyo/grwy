const { applyCors } = require('./_util/cors')
const { verifyToken } = require('./_util/auth')
const { getCollection, generatePageId } = require('./_util/db')

const themes = {
  'theme-simple-white': `
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --accent: #3b82f6;
      --accent-gradient: linear-gradient(135deg, #3b82f6, #60a5fa);
      --border: #e2e8f0;
      --card-bg: #ffffff;
    }
  `,
  'theme-graphite-gray': `
    :root {
      --bg-primary: #f1f5f9;
      --bg-secondary: #e2e8f0;
      --text-primary: #334155;
      --text-secondary: #64748b;
      --accent: #64748b;
      --accent-gradient: linear-gradient(135deg, #64748b, #94a3b8);
      --border: #cbd5e1;
      --card-bg: #ffffff;
    }
  `,
  'theme-onyx-black': `
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --accent: #6366f1;
      --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
      --border: #334155;
      --card-bg: #1e293b;
    }
  `,
  'theme-red-east': `
    :root {
      --bg-primary: #fff5f5;
      --bg-secondary: #fef2f2;
      --text-primary: #991b1b;
      --text-secondary: #b91c1c;
      --accent: #dc2626;
      --accent-gradient: linear-gradient(135deg, #dc2626, #ef4444);
      --border: #fecaca;
      --card-bg: #ffffff;
    }
  `,
  'theme-vibrant-orange': `
    :root {
      --bg-primary: #fff7ed;
      --bg-secondary: #ffedd5;
      --text-primary: #9a3412;
      --text-secondary: #c2410c;
      --accent: #f97316;
      --accent-gradient: linear-gradient(135deg, #f97316, #fb923c);
      --border: #fed7aa;
      --card-bg: #ffffff;
    }
  `,
  'theme-amber-yellow': `
    :root {
      --bg-primary: #fffbeb;
      --bg-secondary: #fef3c7;
      --text-primary: #92400e;
      --text-secondary: #b45309;
      --accent: #f59e0b;
      --accent-gradient: linear-gradient(135deg, #f59e0b, #fbbf24);
      --border: #fde68a;
      --card-bg: #ffffff;
    }
  `,
  'theme-forest-green': `
    :root {
      --bg-primary: #f0fdf4;
      --bg-secondary: #dcfce7;
      --text-primary: #14532d;
      --text-secondary: #166534;
      --accent: #22c55e;
      --accent-gradient: linear-gradient(135deg, #22c55e, #4ade80);
      --border: #bbf7d0;
      --card-bg: #ffffff;
    }
  `,
  'theme-tech-blue': `
    :root {
      --bg-primary: #f0f9ff;
      --bg-secondary: #e0f2fe;
      --text-primary: #0c4a6e;
      --text-secondary: #075985;
      --accent: #0ea5e9;
      --accent-gradient: linear-gradient(135deg, #0ea5e9, #38bdf8);
      --border: #bae6fd;
      --card-bg: #ffffff;
    }
  `,
  'theme-future-purple': `
    :root {
      --bg-primary: #faf5ff;
      --bg-secondary: #f3e8ff;
      --text-primary: #581c87;
      --text-secondary: #6b21a8;
      --accent: #a855f7;
      --accent-gradient: linear-gradient(135deg, #a855f7, #d946ef);
      --border: #e9d5ff;
      --card-bg: #ffffff;
    }
  `
}

function renderAbout(data) {
  const { name, position, bio, birthday, phone, email, wechat, qq, weibo, hometown, education, zodiac, driving, mbti, personality, hobby } = data
  let socialHtml = ''
  if (wechat) socialHtml += `<div class="social-item">微信: ${wechat}</div>`
  if (qq) socialHtml += `<div class="social-item">QQ: ${qq}</div>`
  if (weibo) socialHtml += `<div class="social-item">微博: ${weibo}</div>`
  
  return `
    <section class="section about-section" id="about">
      <h2 class="section-title">关于我</h2>
      <div class="about-content">
        <div class="about-info">
          <h3>基本信息</h3>
          ${name ? `<div class="info-item"><span class="label">姓名</span><span class="value">${name}</span></div>` : ''}
          ${birthday ? `<div class="info-item"><span class="label">出生日期</span><span class="value">${birthday}</span></div>` : ''}
          ${phone ? `<div class="info-item"><span class="label">电话</span><span class="value">${phone}</span></div>` : ''}
          ${email ? `<div class="info-item"><span class="label">邮箱</span><span class="value">${email}</span></div>` : ''}
          ${hometown ? `<div class="info-item"><span class="label">籍贯</span><span class="value">${hometown}</span></div>` : ''}
          ${education ? `<div class="info-item"><span class="label">学历</span><span class="value">${education}</span></div>` : ''}
          ${driving ? `<div class="info-item"><span class="label">驾龄</span><span class="value">${driving}</span></div>` : ''}
          ${zodiac ? `<div class="info-item"><span class="label">星座</span><span class="value">${zodiac}</span></div>` : ''}
          ${mbti ? `<div class="info-item"><span class="label">MBTI</span><span class="value">${mbti}</span></div>` : ''}
          ${personality ? `<div class="info-item"><span class="label">性格</span><span class="value">${personality}</span></div>` : ''}
          ${hobby ? `<div class="info-item"><span class="label">爱好</span><span class="value">${hobby}</span></div>` : ''}
        </div>
        ${position ? `<div class="about-title">${position}</div>` : ''}
        ${socialHtml}
        ${bio ? `<div class="about-bio">${bio.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    </section>
  `
}

function renderSkills(skills) {
  return `
    <section class="section skills-section" id="skills">
      <h2 class="section-title">专业技能</h2>
      ${skills && skills.length > 0 ? `
      <div class="skills-grid">
        ${skills.map(skill => `
          <div class="skill-card">
            ${skill.icon ? `<img src="${skill.icon}" class="skill-icon" alt="${skill.name}" />` : ''}
            <div class="skill-name">${skill.name}</div>
            ${skill.level ? `<div class="skill-level">${skill.level}</div>` : ''}
            ${skill.desc ? `<div class="skill-desc">${skill.desc}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </section>
  `
}

function renderStrengths(strengths) {
  if (!strengths || strengths.length === 0) return ''
  
  return `
    <section class="section strengths-section">
      <h2 class="section-title">个人优势</h2>
      <div class="strengths-list">
        ${strengths.map(strength => `
          <div class="strength-item">
            <div class="strength-name">${strength.name}</div>
            ${strength.desc ? `<div class="strength-desc">${strength.desc}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderWork(experiences) {
  if (!experiences || experiences.length === 0) return ''
  
  return `
    <section class="section work-section" id="work">
      <h2 class="section-title">工作经历</h2>
      <div class="timeline">
        ${experiences.map(exp => `
          <div class="timeline-item">
            <div class="timeline-header">
              <div class="timeline-company">${exp.company}</div>
              <div class="timeline-period">${exp.period}</div>
            </div>
            <div class="timeline-position">${exp.position}</div>
            ${exp.content ? `<div class="timeline-content">${exp.content}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderInternship(internships) {
  if (!internships || internships.length === 0) return ''
  
  return `
    <section class="section internship-section" id="internship">
      <h2 class="section-title">实习经历</h2>
      <div class="timeline">
        ${internships.map(exp => `
          <div class="timeline-item">
            <div class="timeline-header">
              <div class="timeline-company">${exp.company}</div>
              <div class="timeline-period">${exp.period}</div>
            </div>
            <div class="timeline-position">${exp.position}</div>
            ${exp.content ? `<div class="timeline-content">${exp.content}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderProjects(projects) {
  if (!projects || projects.length === 0) return ''
  
  return `
    <section class="section projects-section" id="projects">
      <h2 class="section-title">项目经历</h2>
      <div class="projects-grid">
        ${projects.map(project => `
          <div class="project-card">
            <div class="project-header">
              <div class="project-name">${project.name}</div>
              ${project.period ? `<div class="project-period">${project.period}</div>` : ''}
            </div>
            ${project.role ? `<div class="project-role">角色: ${project.role}</div>` : ''}
            ${project.description ? `<div class="project-desc">${project.description}</div>` : ''}
            ${project.url ? `<a href="${project.url}" class="project-link" target="_blank">查看项目</a>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderEducation(education) {
  if (!education || education.length === 0) return ''
  
  return `
    <section class="section education-section" id="education">
      <h2 class="section-title">教育背景</h2>
      <div class="timeline">
        ${education.map(edu => `
          <div class="timeline-item">
            <div class="timeline-header">
              <div class="timeline-company">${edu.school}</div>
              <div class="timeline-period">${edu.period}</div>
            </div>
            <div class="timeline-position">${edu.degree} · ${edu.major}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderPapers(papers) {
  if (!papers || papers.length === 0) return ''
  
  return `
    <section class="section papers-section" id="papers">
      <h2 class="section-title">学术论文</h2>
      <div class="papers-grid">
        ${papers.map(paper => `
          <div class="paper-card">
            ${paper.cover ? `<img src="${paper.cover}" class="paper-cover" alt="${paper.title}" />` : ''}
            <div class="paper-title">${paper.title}</div>
            ${paper.type ? `<div class="paper-type">${paper.type}</div>` : ''}
            ${paper.pdf ? `<a href="${paper.pdf}" class="paper-link" target="_blank">下载论文</a>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderIP(ipList) {
  if (!ipList || ipList.length === 0) return ''
  
  return `
    <section class="section ip-section" id="intellectual">
      <h2 class="section-title">知识产权</h2>
      <div class="ip-grid">
        ${ipList.map(ip => `
          <div class="ip-card">
            ${ip.image ? `<img src="${ip.image}" class="ip-image" alt="${ip.name}" />` : ''}
            <div class="ip-name">${ip.name}</div>
            ${ip.type ? `<div class="ip-type">${ip.type}</div>` : ''}
            ${ip.certificateNo ? `<div class="ip-cert">证书号: ${ip.certificateNo}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderCertifications(certifications) {
  if (!certifications || certifications.length === 0) return ''
  
  return `
    <section class="section certifications-section" id="certifications">
      <h2 class="section-title">资格证书</h2>
      <div class="certifications-grid">
        ${certifications.map(cert => `
          <div class="cert-card">
            <div class="cert-name">${cert.name}</div>
            ${cert.images && cert.images.length > 0 ? cert.images.map(img => `<img src="${img}" class="cert-image" alt="${cert.name}" />`).join('') : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderAwards(awards) {
  if (!awards || awards.length === 0) return ''
  
  return `
    <section class="section awards-section" id="awards">
      <h2 class="section-title">荣誉奖项</h2>
      <div class="awards-grid">
        ${awards.map(award => `
          <div class="award-card">
            ${award.image ? `<img src="${award.image}" class="award-image" alt="${award.name}" />` : ''}
            <div class="award-name">${award.name}</div>
            ${award.desc ? `<div class="award-desc">${award.desc}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderPortfolio(portfolioItems) {
  if (!portfolioItems || portfolioItems.length === 0) return ''
  
  return `
    <section class="section portfolio-section" id="portfolio">
      <h2 class="section-title">作品集</h2>
      <div class="portfolio-scroll-container" id="portfolio-scroll-container">
        <button class="scroll-btn scroll-prev" id="portfolio-prev" style="display:none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="portfolio-scroll-track" id="portfolio-track">
          <div class="portfolio-images" id="portfolio-images-scroll">
            ${portfolioItems.map((item, index) => `
              <div class="portfolio-image-item">
                <img src="${item.url}" class="portfolio-image" alt="${item.name}" />
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
    </section>
  `
}

function renderHomeSection(homeDisplay, data, homeButtonsHtml) {
  const { name, title, avatar, idPhoto, lifePhoto } = data
  
  if (homeDisplay === 'idPhoto' && idPhoto) {
    return `
      <section class="hero-section" id="home">
        <div class="hero-content">
          <img src="${idPhoto}" class="hero-photo hero-photo-id" alt="${name}" />
          <div class="hero-info">
            ${name ? `<h1 class="hero-name">${name}</h1>` : ''}
            ${title ? `<div class="hero-title">${title}</div>` : ''}
          </div>
          ${homeButtonsHtml ? `<div class="hero-buttons">${homeButtonsHtml}</div>` : ''}
        </div>
      </section>
    `
  } else if (homeDisplay === 'lifePhotoMid' && lifePhoto) {
    return `
      <section class="hero-section" id="home">
        <div class="hero-content">
          <img src="${lifePhoto}" class="hero-photo hero-photo-mid" alt="${name}" />
          <div class="hero-info">
            ${name ? `<h1 class="hero-name">${name}</h1>` : ''}
            ${title ? `<div class="hero-title">${title}</div>` : ''}
          </div>
          ${homeButtonsHtml ? `<div class="hero-buttons">${homeButtonsHtml}</div>` : ''}
        </div>
      </section>
    `
  } else if (homeDisplay === 'lifePhotoLarge' && lifePhoto) {
    return `
      <section class="hero-section hero-large" id="home">
        <img src="${lifePhoto}" class="hero-photo hero-photo-large" alt="${name}" />
        <div class="hero-overlay">
          <div class="hero-info">
            ${name ? `<h1 class="hero-name">${name}</h1>` : ''}
            ${title ? `<div class="hero-title">${title}</div>` : ''}
            ${homeButtonsHtml ? `<div class="hero-buttons">${homeButtonsHtml}</div>` : ''}
          </div>
        </div>
      </section>
    `
  } else if (avatar) {
    return `
      <section class="hero-section" id="home">
        <div class="hero-content">
          <img src="${avatar}" class="hero-photo hero-photo-avatar" alt="${name}" />
          <div class="hero-info">
            ${name ? `<h1 class="hero-name">${name}</h1>` : ''}
            ${title ? `<div class="hero-title">${title}</div>` : ''}
          </div>
          ${homeButtonsHtml ? `<div class="hero-buttons">${homeButtonsHtml}</div>` : ''}
        </div>
      </section>
    `
  }
  
  return `
    <section class="hero-section" id="home">
      <div class="hero-content">
        <div class="hero-placeholder">
          ${name ? `<h1 class="hero-name">${name}</h1>` : ''}
          ${title ? `<div class="hero-title">${title}</div>` : ''}
          ${homeButtonsHtml ? `<div class="hero-buttons">${homeButtonsHtml}</div>` : ''}
        </div>
      </div>
    </section>
  `
}

function renderHeaderButtons(headerButtons, data) {
  const { resumeUrl } = data
  let buttonsHtml = ''
  
  if (headerButtons.includes('header-portfolio')) {
    buttonsHtml += `<a href="#portfolio" class="nav-btn" onclick="scrollToSection(event, 'portfolio')">查看作品集</a>`
  }
  
  if (headerButtons.includes('header-resume') && resumeUrl) {
    buttonsHtml += `<a href="${resumeUrl}" class="nav-btn" target="_blank">下载简历</a>`
  }
  
  if (headerButtons.includes('header-contact')) {
    buttonsHtml += `<a href="#footer" class="nav-btn" onclick="scrollToSection(event, 'footer')">请联系我</a>`
  }
  
  if (!buttonsHtml) return ''
  
  return `
    <div class="nav-buttons">
      ${buttonsHtml}
    </div>
  `
}

function renderHomeButtons(homeButtons, data) {
  const { resumeUrl } = data
  let buttonsHtml = ''
  
  if (homeButtons.includes('home-portfolio')) {
    buttonsHtml += `<a href="#portfolio" class="hero-btn" onclick="scrollToSection(event, 'portfolio')">查看作品集</a>`
  }
  
  if (homeButtons.includes('home-resume') && resumeUrl) {
    buttonsHtml += `<a href="${resumeUrl}" class="hero-btn" target="_blank">下载简历</a>`
  }
  
  if (homeButtons.includes('home-contact')) {
    buttonsHtml += `<a href="#footer" class="hero-btn" onclick="scrollToSection(event, 'footer')">请联系我</a>`
  }
  
  return buttonsHtml
}

function renderNav(modules, headerButtons, data) {
  const navLinks = []
  if (modules.includes('home')) navLinks.push('<a href="#home" onclick="scrollToSection(event, \'home\')">首页</a>')
  if (modules.includes('about')) navLinks.push('<a href="#about" onclick="scrollToSection(event, \'about\')">关于我</a>')
  if (modules.includes('portfolio')) navLinks.push('<a href="#portfolio" onclick="scrollToSection(event, \'portfolio\')">作品集</a>')
  if (modules.includes('skills')) navLinks.push('<a href="#skills" onclick="scrollToSection(event, \'skills\')">专业技能</a>')
  if (modules.includes('work')) navLinks.push('<a href="#work" onclick="scrollToSection(event, \'work\')">工作经历</a>')
  if (modules.includes('internship')) navLinks.push('<a href="#internship" onclick="scrollToSection(event, \'internship\')">实习经历</a>')
  if (modules.includes('project')) navLinks.push('<a href="#projects" onclick="scrollToSection(event, \'projects\')">项目经历</a>')
  if (modules.includes('education')) navLinks.push('<a href="#education" onclick="scrollToSection(event, \'education\')">教育背景</a>')
  if (modules.includes('papers')) navLinks.push('<a href="#papers" onclick="scrollToSection(event, \'papers\')">学术论文</a>')
  if (modules.includes('ip')) navLinks.push('<a href="#intellectual" onclick="scrollToSection(event, \'intellectual\')">知识产权</a>')
  if (modules.includes('certifications')) navLinks.push('<a href="#certifications" onclick="scrollToSection(event, \'certifications\')">资格证书</a>')
  if (modules.includes('honors')) navLinks.push('<a href="#awards" onclick="scrollToSection(event, \'awards\')">荣誉奖项</a>')
  
  const headerButtonsHtml = renderHeaderButtons(headerButtons || [], data)
  
  return `
    <nav class="navbar">
      <div class="nav-left">
        ${data.avatar ? `<img src="${data.avatar}" alt="头像" class="nav-logo">` : ''}
        <div class="nav-brand">
          <span class="nav-name">${data.name || '姓名'}</span>
          ${data.slogan ? `<span class="nav-slogan">${data.slogan}</span>` : ''}
        </div>
      </div>
      <div class="nav-links">
        ${navLinks.join('')}
      </div>
      ${headerButtonsHtml}
    </nav>
  `
}

function renderFooter(data) {
  const qrcodesHtml = `
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
  `
  
  return `
    <footer class="footer-section" id="footer">
      <div class="footer-content">
        <div class="footer-contact">
          ${data.phone ? `<div>电话: ${data.phone}</div>` : ''}
          ${data.email ? `<div>邮箱: ${data.email}</div>` : ''}
          ${data.wechat ? `<div>微信: ${data.wechat}</div>` : ''}
          ${data.qq ? `<div>QQ: ${data.qq}</div>` : ''}
          ${data.weibo ? `<div>微博: ${data.weibo}</div>` : ''}
        </div>
        ${(data.wechatQr || data.qqQr || data.weiboQr) ? qrcodesHtml : ''}
        <div class="footer-copyright">© ${new Date().getFullYear()} ${data.name || '个人主页'} · ${data.slogan || ''}</div>
      </div>
    </footer>
  `
}

function renderPage(pageData) {
  const { config, ...data } = pageData
  const themeCSS = themes[config.colorTheme] || themes['theme-tech-blue']
  const modules = config.modules || []
  
  const moduleRenderers = {
    about: () => renderAbout(data),
    portfolio: () => renderPortfolio(data.portfolioItems),
    skills: () => renderSkills(data.skills),
    work: () => renderWork(data.workExperiences),
    internship: () => renderInternship(data.internships),
    project: () => renderProjects(data.projects),
    education: () => renderEducation(data.education),
    papers: () => renderPapers(data.papers),
    ip: () => renderIP(data.intellectualProperties),
    certifications: () => renderCertifications(data.certifications),
    honors: () => renderAwards(data.awards),
    strengths: () => renderStrengths(data.advantages || data.strengths)
  }
  
  const moduleSections = modules.map(moduleType => {
    return moduleRenderers[moduleType] ? moduleRenderers[moduleType]() : ''
  }).join('')
  
  const navHtml = renderNav(modules, config.headerButtons, data)
  const homeButtonsHtml = renderHomeButtons(config.homeButtons || [], data)
  const homeSection = renderHomeSection(config.homeDisplay, data, homeButtonsHtml)
  const footerHtml = renderFooter(data)
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name || '个人主页'} - 志在瑶远</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }
    
    ${themeCSS}
    
    .hero-section {
      text-align: center;
      padding: 60px 20px;
      background: var(--accent-gradient);
      color: white;
      position: relative;
    }
    
    .hero-section.hero-large {
      height: 60vh;
      min-height: 400px;
    }
    
    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .hero-photo {
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      border: 4px solid rgba(255,255,255,0.5);
    }
    
    .hero-photo-id {
      width: 200px;
      height: 200px;
    }
    
    .hero-photo-mid {
      width: 280px;
      height: 280px;
    }
    
    .hero-photo-large {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 0;
      border: none;
      object-fit: cover;
    }
    
    .hero-photo-avatar {
      width: 150px;
      height: 150px;
    }
    
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hero-placeholder {
      padding: 60px 20px;
    }
    
    .hero-name {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .hero-title {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    
    .section {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      border-bottom: 1px solid var(--border);
    }
    
    .section:last-of-type {
      border-bottom: none;
    }
    
    .section-title {
      font-size: 1.5rem;
      color: var(--accent);
      margin-bottom: 25px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--accent);
      display: inline-block;
    }
    
    .about-content {
      gap: 10px;
    }
    
    .about-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .about-title {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 15px;
    }
    
    .info-item {
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .info-item .label {
      color: var(--accent-color);
      font-weight: 500;
      min-width: 80px;
    }
    
    .info-item .value {
      color: var(--text-secondary);
    }
    
    .social-item {
      margin-bottom: 8px;
    }
    
    .about-bio {
      margin-top: 20px;
      line-height: 1.8;
      text-align: justify;
    }
    
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: center;
      max-width: 960px;
      margin: 0 auto;
    }
    
    .skill-card {
      background: var(--card-bg);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid var(--border);
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 140px;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    
    .skill-icon {
      width: 60px;
      height: 60px;
      margin-bottom: 10px;
      border-radius: 8px;
    }
    
    .skill-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .skill-level {
      color: var(--accent);
      font-size: 0.9rem;
    }
    
    .skill-desc {
      margin-top: 10px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    
    .strengths-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .strength-item {
      background: var(--card-bg);
      padding: 15px 20px;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
    }
    
    .strength-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .strength-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .timeline {
      position: relative;
      padding-left: 30px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }
    
    .timeline-item {
      position: relative;
      margin-bottom: 30px;
    }
    
    .timeline-item:last-child {
      margin-bottom: 0;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -26px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg-primary);
    }
    
    .timeline-header {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 5px;
    }
    
    .timeline-company {
      font-weight: 600;
    }
    
    .timeline-period {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .timeline-position {
      color: var(--accent);
      margin-bottom: 10px;
    }
    
    .timeline-content {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.7;
    }
    
    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .project-card {
      background: var(--card-bg);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    
    .project-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .project-name {
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .project-period {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .project-role {
      color: var(--accent);
      margin-bottom: 10px;
    }
    
    .project-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.7;
    }
    
    .project-link {
      display: inline-block;
      margin-top: 15px;
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
    }
    
    .project-link:hover {
      text-decoration: underline;
    }
    
    .papers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .paper-card {
      background: var(--card-bg);
      padding: 15px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .paper-cover {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .paper-title {
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 5px;
    }
    
    .paper-type {
      color: var(--accent);
      font-size: 0.85rem;
      margin-bottom: 10px;
    }
    
    .paper-link {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.9rem;
    }
    
    .ip-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .ip-card {
      background: var(--card-bg);
      padding: 15px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .ip-image {
      width: 100%;
      height: 150px;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .ip-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .ip-type {
      color: var(--accent);
      font-size: 0.9rem;
      margin-bottom: 5px;
    }
    
    .ip-cert {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    
    .certifications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .cert-card {
      background: var(--card-bg);
      padding: 15px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .cert-name {
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .cert-image {
      width: 100%;
      height: 180px;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .awards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .award-card {
      background: var(--card-bg);
      padding: 15px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .award-image {
      width: 100%;
      height: 150px;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .award-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .award-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }
    
    .portfolio-item {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    
    .portfolio-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .portfolio-scroll-container {
      position: relative;
      margin-top: 2rem;
    }
    
    .portfolio-scroll-track {
      overflow: hidden;
      width: 100%;
    }
    
    .portfolio-images {
      display: flex;
      gap: 1.5rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 0.5rem 0;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    .portfolio-images::-webkit-scrollbar {
      display: none;
    }
    
    .portfolio-image-item {
      flex-shrink: 0;
      height: 300px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: none;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    }
    
    .portfolio-image-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }
    
    .portfolio-image-item img {
      height: 100%;
      width: auto;
      object-fit: contain;
      background: transparent;
    }
    
    .portfolio-name-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.8rem;
      background: transparent;
      opacity: 0;
      transition: opacity 0.3s ease, background 0.3s ease;
    }
    
    .portfolio-image-item:hover .portfolio-name-overlay {
      opacity: 1;
      background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
    }
    
    .portfolio-name-overlay p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }
    
    .scroll-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 10;
      transition: background 0.2s;
    }
    
    .scroll-btn:hover {
      background: white;
    }
    
    .scroll-prev {
      left: -20px;
    }
    
    .scroll-next {
      right: -20px;
    }
    
    .footer-section {
      background: var(--bg-secondary);
      padding: 40px 20px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    
    .footer-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .footer-btn {
      background: var(--accent-gradient);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 25px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .footer-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    @media (max-width: 600px) {
      .hero-name {
        font-size: 1.8rem;
      }
      
      .hero-section {
        padding: 40px 15px;
      }
      
      .section {
        padding: 30px 15px;
      }
      
      .timeline-header {
        flex-direction: column;
      }
      
      .footer-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .footer-btn {
        width: 100%;
        max-width: 250px;
      }
    }
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      z-index: 1000;
      border-bottom: 1px solid var(--border);
      padding: 0 20px;
    }
    
    .nav-links {
      display: flex;
      gap: 20px;
      padding: 15px 0;
      overflow-x: auto;
    }
    
    .nav-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      white-space: nowrap;
      transition: color 0.2s;
    }
    
    .nav-links a:hover {
      color: var(--accent);
    }
    
    .nav-buttons {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 10px;
    }
    
    .nav-btn {
      background: var(--accent-gradient);
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    
    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    
    .hero-btn {
      background: rgba(255,255,255,0.2);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 0.95rem;
      border: 1px solid rgba(255,255,255,0.3);
      transition: all 0.2s;
    }
    
    .hero-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-2px);
    }
    
    .footer-section {
      background: var(--bg-secondary);
      padding: 40px 20px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .footer-contact {
      margin-bottom: 20px;
    }
    
    .footer-contact div {
      margin-bottom: 8px;
      color: var(--text-secondary);
    }
    
    .footer-copyright {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    @media (max-width: 600px) {
      .hero-name {
        font-size: 1.8rem;
      }
      
      .hero-section {
        padding: 40px 15px;
        padding-top: 80px;
      }
      
      .section {
        padding: 30px 15px;
      }
      
      .timeline-header {
        flex-direction: column;
      }
      
      .nav-buttons {
        display: none;
      }
      
      .hero-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .hero-btn {
        width: 100%;
        max-width: 200px;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  ${navHtml}
  ${homeSection}
  ${moduleSections}
  ${footerHtml}
  <script>
    function scrollToSection(event, sectionId) {
      event.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
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
    });
  </script>
</body>
</html>`
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return
  
  const action = req.query.action || ''
  
  try {
    if (action === 'get' && req.method === 'GET') {
      const { subdomain, pageId } = req.query
      
      if (!subdomain || !pageId) {
        return res.status(400).send('缺少参数')
      }
      
      const collection = await getCollection('profile_builder', 'pages')
      const page = await collection.findOne({ subdomain, pageId })
      
      if (!page) {
        return res.status(404).send('页面不存在')
      }
      
      delete page._id
      
      const html = renderPage(page)
      
      res.setHeader('Content-Type', 'text/html')
      return res.status(200).send(html)
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
      
      const pageUrl = `${req.headers.host}/${subdomain}/${pageId}`
      
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
    console.error('Pages API error:', err)
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', message: '服务器错误' })
  }
}
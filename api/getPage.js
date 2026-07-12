const { getDb } = require('./db');
const fs = require('fs');
const path = require('path');

const templateMap = {
  'theme-simple-white': path.join(__dirname, '../templates/theme-simple-white.html'),
  'theme-graphite-gray': path.join(__dirname, '../templates/theme-graphite-gray.html'),
  'theme-onyx-black': path.join(__dirname, '../templates/theme-onyx-black.html'),
  'theme-red-east': path.join(__dirname, '../templates/theme-red-east.html'),
  'theme-vibrant-orange': path.join(__dirname, '../templates/theme-vibrant-orange.html'),
  'theme-amber-yellow': path.join(__dirname, '../templates/theme-amber-yellow.html'),
  'theme-forest-green': path.join(__dirname, '../templates/theme-forest-green.html'),
  'theme-tech-blue': path.join(__dirname, '../templates/theme-tech-blue.html'),
  'theme-future-purple': path.join(__dirname, '../templates/theme-future-purple.html')
};

function loadTemplate(templateId) {
  const templatePath = templateMap[templateId] || templateMap['theme-simple-white'];
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.log('加载模板失败:', error.message);
    return fs.readFileSync(templateMap['theme-simple-white'], 'utf8');
  }
}

function renderStrengths(strengths) {
  if (!strengths || strengths.length === 0) return '';
  return strengths.map(s => `
    <div class="strength-item">
      <h4>${s.name}</h4>
      <p>${s.desc}</p>
    </div>
  `).join('');
}

function renderSkills(skills) {
  if (!skills || skills.length === 0) return '';
  return `
    <section id="skills">
      <div class="container">
        <div class="section-title fade-in">
          <h2>专业技能</h2>
          <div class="line"></div>
        </div>
        <div class="skills-grid fade-in">
          ${skills.map(s => `
            <div class="skill-card">
              <div class="icon">
                <img src="${s.icon || '技能图标/office软件.png'}" alt="${s.name}">
              </div>
              <h3>${s.name}</h3>
              <p>${s.level}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderWork(workExperiences) {
  if (!workExperiences || workExperiences.length === 0) return '';
  return `
    <section id="work">
      <div class="container">
        <div class="section-title fade-in">
          <h2>工作经历</h2>
          <div class="line"></div>
        </div>
        <div class="timeline fade-in">
          ${workExperiences.map(w => `
            <div class="timeline-item">
              <div class="timeline-date-left">${w.period}</div>
              <div class="timeline-dot"></div>
              <div class="timeline-card">
                <div class="timeline-header">
                  <h3 class="company-name">${w.company}</h3>
                  <p class="position">${w.position}</p>
                </div>
                <div class="timeline-content">
                  <ul>
                    ${w.content.split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderEducation(education) {
  if (!education || education.length === 0) return '';
  return `
    <section id="education">
      <div class="container">
        <div class="section-title fade-in">
          <h2>教育背景</h2>
          <div class="line"></div>
        </div>
        <div class="education-grid fade-in">
          ${education.map(e => `
            <div class="education-card">
              <div class="education-header">
                <h3>${e.degree} <span>${e.degree === '博士' ? 'Doctoral Philosophy' : e.degree === '硕士' ? "Master's Degree" : e.degree === '本科' ? "Bachelor's Degree" : 'Associate Degree'}</span></h3>
              </div>
              <div class="education-body">
                <div class="info">
                  <h4>${e.school} <span>${e.major} （${e.period}）</span></h4>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderPapers(papers) {
  if (!papers || papers.length === 0) return '';
  return `
    <section id="papers">
      <div class="container">
        <div class="section-title fade-in">
          <h2>学术论文</h2>
          <div class="line"></div>
        </div>
        <div class="papers-grid fade-in">
          ${papers.map(p => `
            <div class="paper-card">
              <div class="paper-image">
                <img src="${p.cover || ''}" alt="${p.title}">
              </div>
              <div class="paper-content">
                <h3>${p.title}</h3>
                <div class="paper-meta">
                  <span class="paper-type">${p.type}</span>
                  ${p.pdf ? `<a href="#" onclick="openPdf('${p.pdf}')" class="paper-link">查看全文 →</a>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderCertifications(certifications) {
  if (!certifications || certifications.length === 0) return '';
  return `
    <section id="certifications">
      <div class="container">
        <div class="section-title fade-in">
          <h2>资格证书</h2>
          <div class="line"></div>
        </div>
        <div class="cert-grid fade-in">
          ${certifications.map(c => `
            <div class="cert-card">
              <div class="cert-image" data-images='${JSON.stringify(c.images || [])}'>
                <img src="${c.images && c.images.length > 0 ? c.images[0] : ''}" alt="${c.name}">
              </div>
              <div class="cert-content">
                <h3>${c.name}</h3>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAwards(awards) {
  if (!awards || awards.length === 0) return '';
  return `
    <section id="awards">
      <div class="container">
        <div class="section-title fade-in">
          <h2>荣誉奖项</h2>
          <div class="line"></div>
        </div>
        <div class="awards-scroll-container fade-in">
          <div class="awards-scroll-track">
            <div class="awards-scroll-inner">
              ${awards.map(a => `
                <div class="award-card-scroll">
                  <div class="award-image">
                    <img src="${a.image || ''}" alt="${a.name}">
                  </div>
                  <div class="award-content">
                    <h3>${a.name}</h3>
                    <p>${a.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPortfolio(portfolioUrls) {
  if (!portfolioUrls || portfolioUrls.length === 0) return '';
  return `
    <section id="portfolio">
      <div class="container">
        <div class="section-title fade-in">
          <h2>作品集</h2>
          <div class="line"></div>
        </div>
        <div class="portfolio-scroll-container fade-in">
          <div class="portfolio-scroll-track">
            <div class="portfolio-images">
              ${portfolioUrls.map((url, i) => `
                <div class="portfolio-image-item">
                  <img src="${url}" alt="作品${i + 1}">
                  <div class="portfolio-name-overlay"><p>作品${i + 1}</p></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let userId = req.query.userId || '';
    let subdomain = req.query.subdomain || '';

    if (!userId && !subdomain) {
      return res.status(404).send(`<!DOCTYPE html>
    <html>
    <head><title>404</title></head>
    <body style="font-family:Arial;text-align:center;padding:80px 20px;">
      <h1 style="font-size:72px;color:#ddd;margin-bottom:20px;">404</h1>
      <p style="font-size:18px;color:#666;">页面不存在</p>
      <p style="color:#999;">请提供用户ID或子域名</p>
    </body>
    </html>`);
    }

    const db = await getDb();
    const users = db.collection('users');

    let query = {};
    if (userId && subdomain) {
      query = { userId, subdomain };
    } else if (userId) {
      query = { userId };
    } else if (subdomain) {
      query = { subdomain };
    }

    const user = await users.findOne(query);

    if (!user) {
      return res.status(404).send(`<!DOCTYPE html>
<html>
<head><title>404</title></head>
<body style="font-family:Arial;text-align:center;padding:80px 20px;">
  <h1 style="font-size:72px;color:#ddd;margin-bottom:20px;">404</h1>
  <p style="font-size:18px;color:#666;">页面不存在</p>
  <p style="color:#999;">该用户尚未创建个人主页</p>
</body>
</html>`);
    }

    const template = loadTemplate(user.templateId);

    let html = template
      .replace(/{{name}}/g, user.name || '未命名')
      .replace(/{{title}}/g, user.title || '')
      .replace(/{{bio}}/g, user.bio || '')
      .replace(/{{phone}}/g, user.phone || '')
      .replace(/{{email}}/g, user.email || '')
      .replace(/{{birthDate}}/g, user.birthDate || '')
      .replace(/{{educationLevel}}/g, user.educationLevel || '')
      .replace(/{{wechat}}/g, user.wechat || '')
      .replace(/{{qq}}/g, user.qq || '')
      .replace(/{{weibo}}/g, user.weibo || '')
      .replace(/{{avatarUrl}}/g, user.avatarUrl || '')
      .replace(/{{idPhotoUrl}}/g, user.idPhotoUrl || '')
      .replace(/{{resumeUrl}}/g, user.resumeUrl || '')
      .replace(/{{currentYear}}/g, new Date().getFullYear())
      .replace(/{{slogan}}/g, user.title || '个人主页');

    html = html.replace('{{STRENGTHS_SECTION}}', renderStrengths(user.strengths));
    html = html.replace('{{SKILLS_SECTION}}', renderSkills(user.skills));
    html = html.replace('{{WORK_SECTION}}', renderWork(user.workExperiences));
    html = html.replace('{{EDUCATION_SECTION}}', renderEducation(user.education));
    html = html.replace('{{PAPERS_SECTION}}', renderPapers(user.papers));
    html = html.replace('{{CERTIFICATIONS_SECTION}}', renderCertifications(user.certifications));
    html = html.replace('{{AWARDS_SECTION}}', renderAwards(user.awards));
    html = html.replace('{{PORTFOLIO_SECTION}}', renderPortfolio(user.portfolioUrls));

    const wechatSection = user.wechat ? `<p>微信：${user.wechat}</p>` : '';
    html = html.replace('{{WECHAT_SECTION}}', wechatSection);

    const qqSection = user.qq ? `<p>QQ：${user.qq}</p>` : '';
    html = html.replace('{{QQ_SECTION}}', qqSection);

    const weiboSection = user.weibo ? `<p>微博：${user.weibo}</p>` : '';
    html = html.replace('{{WEIBO_SECTION}}', weiboSection);

    const wechatQrcode = user.wechatQrUrl ? `
      <div class="qrcode-item">
        <img src="${user.wechatQrUrl}" alt="微信二维码">
        <span>微信</span>
      </div>
    ` : '';
    html = html.replace('{{WECHAT_QRCODE}}', wechatQrcode);

    const qqQrcode = user.qqQrUrl ? `
      <div class="qrcode-item">
        <img src="${user.qqQrUrl}" alt="QQ二维码">
        <span>QQ</span>
      </div>
    ` : '';
    html = html.replace('{{QQ_QRCODE}}', qqQrcode);

    const weiboQrcode = user.weiboQrUrl ? `
      <div class="qrcode-item">
        <img src="${user.weiboQrUrl}" alt="微博二维码">
        <span>微博</span>
      </div>
    ` : '';
    html = html.replace('{{WEIBO_QRCODE}}', weiboQrcode);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error) {
    console.log('getPage 错误:', error.message);
    return res.status(500).send(`<!DOCTYPE html>
<html>
<head><title>500</title></head>
<body style="font-family:Arial;text-align:center;padding:80px 20px;">
  <h1 style="font-size:72px;color:#ddd;margin-bottom:20px;">500</h1>
  <p style="font-size:18px;color:#666;">服务器错误</p>
  <p style="color:#999;">${error.message}</p>
</body>
</html>`);
  }
};
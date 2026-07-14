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
    let html = fs.readFileSync(templatePath, 'utf8');
    const cssPath = path.join(__dirname, '../templates/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    html = html.replace('<link rel="stylesheet" href="style.css">', `<style>${cssContent}</style>`);
    return html;
  } catch (error) {
    console.log('加载模板失败:', error.message);
    return fs.readFileSync(templateMap['theme-simple-white'], 'utf8');
  }
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
    let html = template;

    html = html.replace(/志在瑶远/g, user.name || '');
    html = html.replace('产品经理 · 数据分析 · 创新赋能', user.title || '');
    html = html.replace(/金融\+统计复合背景，兼具数据驱动思维与商业逻辑视角。<br>历任数据经理、产品经理，主导多个从0到1的产品落地。<br>绩效考核持续评优，工作主动性与交付质量稳定突出。/g, user.bio || '');
    html = html.replace(/1394198888|1399999999/g, user.phone || '');
    html = html.replace(/zzyy99_cn@qq\.com|zzyy99@qq\.com/g, user.email || '');
    html = html.replace('2026-07-01', user.birthDate || '');
    html = html.replace('博士', user.educationLevel || '');
    html = html.replace(/微信：zzyy99/g, user.wechat ? `微信：${user.wechat}` : '');
    html = html.replace(/QQ：zzyy99/g, user.qq ? `QQ：${user.qq}` : '');
    html = html.replace(/微博：zzyy99/g, user.weibo ? `微博：${user.weibo}` : '');
    html = html.replace('头像.png', user.avatarUrl || '');
    html = html.replace('证件照.png', user.idPhotoUrl || '');
    html = html.replace('「志在瑶远」简历.pdf', user.resumeUrl || '');
    html = html.replace('让生活更聪明', user.title || '');

    html = html.replace(/INTJ/g, '');
    html = html.replace(/游泳、跑步、台球/g, '');
    html = html.replace(/9年/g, '');

    const sections = ['skills', 'work', 'internship', 'projects', 'education', 'papers', 'intellectual', 'certifications', 'awards', 'portfolio'];
    sections.forEach(section => {
      const data = user[section + (section === 'portfolio' ? 'Urls' : 's')] || user[section] || [];
      if (!data || data.length === 0) {
        html = html.replace(new RegExp(`<section id="${section}"[\\s\\S]*?</section>`, 'g'), '');
      }
    });

    if (!user.wechat && !user.qq && !user.weibo) {
      html = html.replace(/<div class="footer-qrcodes"[\s\S]*?<\/div>/g, '');
    }

    html = html.replace(/<img src=""[^>]*>/g, '');
    html = html.replace(/href=""/g, 'href="#"');

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

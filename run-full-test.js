const puppeteer = require('puppeteer');

const PORT = process.env.PORT || '4200';
const BASE = `http://localhost:${PORT}`;

(async () => {
  const isHeadless = process.env.HEADLESS !== 'false';
  console.log(`Starting full E2E test (headless: ${isHeadless})...`);
  const browser = await puppeteer.launch({ 
    headless: isHeadless ? 'new' : false, 
    slowMo: isHeadless ? 0 : 30, 
    defaultViewport: isHeadless ? { width: 1280, height: 800 } : null,
    args: isHeadless ? [] : ['--start-maximized']
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  try {
    console.log('1. Logging in as Admin...');
    await page.goto(`${BASE}/login`);
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => { document.querySelector('#username').value = ''; document.querySelector('#password').value = ''; });
    await page.type('#username', 'admin@test.com');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));
    
    console.log('Navigating to Admin Dashboard...');
    await page.goto(`${BASE}/admin/dashboard`);
    await new Promise(r => setTimeout(r, 4000));

    console.log('Admin logged in, URL:', page.url());

    // Switch to Teams tab
    console.log('2. Creating a Team...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const teamBtn = btns.find(b => b.textContent.trim() === 'Teams');
      if(teamBtn) teamBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    // Fill create team form
    const teamFormExists = await page.evaluate(() => !!document.querySelector('input[name="teamName"]'));
    if (!teamFormExists) throw new Error("Team form not found");
    
    await page.type('input[name="teamName"]', 'Alpha Squad Test');
    await page.evaluate(() => {
      const specialtySelect = document.querySelector('select[name="teamSpeciality"]');
      if (specialtySelect) {
        specialtySelect.selectedIndex = 0;
        specialtySelect.dispatchEvent(new Event('change'));
      }
    });
    await page.evaluate(() => {
      const leaderSelect = document.querySelector('select[name="leaderEngineer"]');
      if(leaderSelect && leaderSelect.options.length > 1) leaderSelect.selectedIndex = 1;
      const techSelect = document.querySelector('select[name="technicians"]');
      if(techSelect && techSelect.options.length > 0) techSelect.options[0].selected = true;
      if(leaderSelect) leaderSelect.dispatchEvent(new Event('change'));
      if(techSelect) techSelect.dispatchEvent(new Event('change'));
    });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => b.textContent.includes('Create Team'));
      if(createBtn) createBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Team created.');

    console.log('3. Assigning Maintenance...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const assignBtn = btns.find(b => b.textContent.trim() === 'Assignments');
      if(assignBtn) assignBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const assignFormExists = await page.evaluate(() => !!document.querySelector('textarea[name="assignmentDescription"]'));
    if (!assignFormExists) throw new Error("Assignment form not found");

    await page.type('textarea[name="assignmentDescription"]', 'Fix left wing engine test');
    await page.evaluate(() => {
      const teamSelect = document.querySelector('select[name="assignmentTeam"]');
      if(teamSelect && teamSelect.options.length > 1) teamSelect.selectedIndex = 1;
      if(teamSelect) teamSelect.dispatchEvent(new Event('change'));
      
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => b.textContent.includes('Create Assignment'));
      if(createBtn) createBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Maintenance assigned.');

    console.log('4. Creating Task...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const overviewBtn = btns.find(b => b.textContent.trim() === 'Fleet Overview');
      if(overviewBtn) overviewBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const taskFormExists = await page.evaluate(() => !!document.querySelector('input[name="taskDescription"]'));
    if (!taskFormExists) throw new Error("Task form not found");

    await page.type('input[name="taskDescription"]', 'Inspect turbine blades');
    await page.evaluate(() => {
      const assignSelect = document.querySelector('select[name="taskAssignment"]');
      if(assignSelect && assignSelect.options.length > 1) assignSelect.selectedIndex = 1;
      if(assignSelect) assignSelect.dispatchEvent(new Event('change'));
      
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => b.textContent.trim() === 'Create');
      if(createBtn) createBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Task created.');

    console.log('Logging out...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Logging in as Technician...');
    await page.goto(`${BASE}/login`);
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => { document.querySelector('#username').value = ''; document.querySelector('#password').value = ''; });
    await page.type('#username', 'tech1@test.com');
    await page.type('#password', 'tech123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));
    
    console.log('Navigating to Technician Dashboard...');
    await page.goto(`${BASE}/technician/tasks`);
    await new Promise(r => setTimeout(r, 4000));

    console.log('6. Adding note and checking task...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const noteInput = inputs.find(i => i.placeholder && i.placeholder.includes('note'));
      if (noteInput) {
        noteInput.value = 'Checked and looks good';
        noteInput.dispatchEvent(new Event('input'));
      }
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent.includes('Save'));
      if(saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const checkBtn = btns.find(b => b.textContent.includes('Check') || b.textContent.includes('Complete'));
      if(checkBtn) checkBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Test completed successfully.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();

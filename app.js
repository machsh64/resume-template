(function () {
  'use strict';

  const form = document.getElementById('resumeForm');
  const preview = document.getElementById('resumePreview');
  const tplWork = document.getElementById('tplWork');
  const tplProject = document.getElementById('tplProject');
  const workList = document.getElementById('workList');
  const projectList = document.getElementById('projectList');

  // 配置 marked
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true });
  }

  function parseMd(text) {
    if (!text || !text.trim()) return '';
    if (typeof marked !== 'undefined') {
      return marked.parse(text.trim());
    }
    return text.replace(/\n/g, '<br>');
  }

  // 简单数据绑定：表单 -> 预览
  function bindPreview() {
    const name = form.querySelector('[name="name"]');
    const gender = form.querySelector('[name="gender"]');
    const phone = form.querySelector('[name="phone"]');
    const email = form.querySelector('[name="email"]');
    const workYears = form.querySelector('[name="workYears"]');
    const jobIntent = form.querySelector('[name="jobIntent"]');

    const set = (sel, val) => {
      const el = preview.querySelector('[data-bind="' + sel + '"]');
      if (el) el.textContent = val != null ? val : '';
    };

    const updateHeader = () => {
      set('name', name?.value);
      set('gender', gender?.value);
      set('phone', phone?.value);
      set('email', email?.value);
      set('workYears', workYears?.value);
      set('jobIntent', jobIntent?.value);
    };

    [name, gender, phone, email, workYears, jobIntent].forEach(el => {
      if (el) el.addEventListener('input', function () { updateHeader(); scheduleBuildPaginatedPreview(); });
    });
    updateHeader();

    // 教育
    const eduSchool = form.querySelector('[name="eduSchool"]');
    const eduDegree = form.querySelector('[name="eduDegree"]');
    const eduMajor = form.querySelector('[name="eduMajor"]');
    const eduStart = form.querySelector('[name="eduStart"]');
    const eduEnd = form.querySelector('[name="eduEnd"]');

    const updateEdu = () => {
      const schoolEl = preview.querySelector('#previewEdu .edu-school');
      const degreeEl = preview.querySelector('#previewEdu .edu-degree');
      const timeEl = preview.querySelector('#previewEdu .edu-time');
      const majorEl = preview.querySelector('#previewEdu .edu-major');
      if (schoolEl) schoolEl.textContent = eduSchool?.value ?? '';
      if (degreeEl) degreeEl.textContent = eduDegree?.value ?? '';
      if (majorEl) majorEl.textContent = eduMajor?.value ?? '';
      const start = eduStart?.value?.trim() ?? '';
      const end = eduEnd?.value?.trim() ?? '';
      if (timeEl) timeEl.textContent = start && end ? start + '-' + end : start || end;
    };

    [eduSchool, eduDegree, eduMajor, eduStart, eduEnd].forEach(el => {
      if (el) el.addEventListener('input', function () { updateEdu(); scheduleBuildPaginatedPreview(); });
    });
    updateEdu();

    // 专业技能（Markdown）
    const skills = form.querySelector('[name="skills"]');
    const previewSkills = document.getElementById('previewSkills');
    if (skills && previewSkills) {
      const updateSkills = () => {
        previewSkills.innerHTML = parseMd(skills.value || '');
      };
      skills.addEventListener('input', function () { updateSkills(); scheduleBuildPaginatedPreview(); });
      updateSkills();
    }

    // 自我评价（Markdown）
    const evaluation = form.querySelector('[name="evaluation"]');
    const previewEvaluation = document.getElementById('previewEvaluation');
    if (evaluation && previewEvaluation) {
      const updateEval = () => {
        previewEvaluation.innerHTML = parseMd(evaluation.value || '');
      };
      evaluation.addEventListener('input', function () { updateEval(); scheduleBuildPaginatedPreview(); });
      updateEval();
    }
    scheduleBuildPaginatedPreview();
  }

  // 工作经历列表
  function collectWorkItems() {
    const items = [];
    workList.querySelectorAll('.repeat-item').forEach((node, i) => {
      const company = node.querySelector('[name="workCompany"]')?.value?.trim();
      const position = node.querySelector('[name="workPosition"]')?.value?.trim();
      const time = node.querySelector('[name="workTime"]')?.value?.trim();
      items.push({ company, position, time });
    });
    return items;
  }

  function renderWorkPreview() {
    const items = collectWorkItems();
    const container = document.getElementById('previewWork');
    container.innerHTML = items.filter(i => i.company || i.position || i.time).map(item => `
      <div class="work-item">
        <div class="work-head-line">
          <span class="work-company">${escapeHtml(item.company)}</span>
          <span class="work-position">${escapeHtml(item.position)}</span>
          <span class="work-time">${escapeHtml(item.time)}</span>
        </div>
      </div>
    `).join('');
    scheduleBuildPaginatedPreview();
  }

  function addWorkItem(data) {
    const frag = tplWork.content.cloneNode(true);
    const item = frag.querySelector('.repeat-item');
    item.dataset.index = workList.children.length;
    if (data) {
      item.querySelector('[name="workCompany"]').value = data.company || '';
      item.querySelector('[name="workPosition"]').value = data.position || '';
      item.querySelector('[name="workTime"]').value = data.time || '';
    }
    item.querySelector('.btn-remove').addEventListener('click', () => {
      item.remove();
      renderWorkPreview();
    });
    ['workCompany', 'workPosition', 'workTime'].forEach(name => {
      item.querySelector('[name="' + name + '"]').addEventListener('input', renderWorkPreview);
    });
    workList.appendChild(frag);
    renderWorkPreview();
  }

  // 项目经历列表
  function collectProjectItems() {
    const items = [];
    projectList.querySelectorAll('.repeat-item').forEach((node) => {
      const name = node.querySelector('[name="projectName"]')?.value?.trim();
      const role = node.querySelector('[name="projectRole"]')?.value?.trim();
      const time = node.querySelector('[name="projectTime"]')?.value?.trim();
      const content = node.querySelector('[name="projectContent"]')?.value?.trim();
      const achieve = node.querySelector('[name="projectAchieve"]')?.value?.trim();
      items.push({ name, role, time, content, achieve });
    });
    return items;
  }

  function renderProjectPreview() {
    const items = collectProjectItems();
    const container = document.getElementById('previewProject');
    container.innerHTML = items.filter(i => i.name || i.content || i.achieve).map(item => `
      <div class="project-item">
        <div class="project-head-line">
          <span class="project-name">${escapeHtml(item.name)}</span>
          <span class="project-role">${escapeHtml(item.role)}</span>
          <span class="project-time">${escapeHtml(item.time)}</span>
        </div>
        ${item.content ? '<div class="project-label">内容:</div><div class="project-content md-content">' + parseMd(item.content) + '</div>' : ''}
        ${item.achieve ? '<div class="project-label">业绩:</div><div class="project-achieve md-content">' + parseMd(item.achieve) + '</div>' : ''}
      </div>
    `).join('');
    scheduleBuildPaginatedPreview();
  }

  function collectFormData() {
    const personal = {
      name: form.querySelector('[name="name"]')?.value || '',
      gender: form.querySelector('[name="gender"]')?.value || '',
      phone: form.querySelector('[name="phone"]')?.value || '',
      email: form.querySelector('[name="email"]')?.value || '',
      workYears: form.querySelector('[name="workYears"]')?.value || '',
      jobIntent: form.querySelector('[name="jobIntent"]')?.value || '',
    };

    const education = {
      school: form.querySelector('[name="eduSchool"]')?.value || '',
      degree: form.querySelector('[name="eduDegree"]')?.value || '',
      major: form.querySelector('[name="eduMajor"]')?.value || '',
      start: form.querySelector('[name="eduStart"]')?.value || '',
      end: form.querySelector('[name="eduEnd"]')?.value || '',
    };

    const skillsMd = form.querySelector('[name="skills"]')?.value || '';
    const evaluationMd = form.querySelector('[name="evaluation"]')?.value || '';

    return {
      personal,
      education,
      skillsMd,
      work: collectWorkItems(),
      projects: collectProjectItems(),
      evaluationMd,
    };
  }

  // 启动时从 /api/resume 读取初始数据（如果存在）
  async function loadInitialData() {
    try {
      const res = await fetch('/api/resume', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      const setVal = (name, value) => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el && value != null) el.value = value;
      };

      const p = data.personal || {};
      setVal('name', p.name);
      setVal('gender', p.gender);
      setVal('phone', p.phone);
      setVal('email', p.email);
      setVal('workYears', p.workYears);
      setVal('jobIntent', p.jobIntent);

      const e = data.education || {};
      setVal('eduSchool', e.school);
      setVal('eduDegree', e.degree);
      setVal('eduMajor', e.major);
      setVal('eduStart', e.start);
      setVal('eduEnd', e.end);

      if (typeof data.skillsMd === 'string') {
        setVal('skills', data.skillsMd);
      }
      if (typeof data.evaluationMd === 'string') {
        setVal('evaluation', data.evaluationMd);
      }

      // 覆盖默认的工作经历与项目经历
      if (Array.isArray(data.work)) {
        workList.innerHTML = '';
        data.work.forEach(w => addWorkItem(w));
      }
      if (Array.isArray(data.projects)) {
        projectList.innerHTML = '';
        data.projects.forEach(pj => addProjectItem(pj));
      }

      // 触发预览与分页更新
      const ev = new Event('input', { bubbles: true });
      form.querySelectorAll('input, textarea, select').forEach(el => el.dispatchEvent(ev));
      renderWorkPreview();
      renderProjectPreview();
      scheduleBuildPaginatedPreview();
    } catch (err) {
      console.error('加载 data.json 失败:', err);
    }
  }

  function addProjectItem(data) {
    const frag = tplProject.content.cloneNode(true);
    const item = frag.querySelector('.repeat-item');
    item.dataset.index = projectList.children.length;
    if (data) {
      item.querySelector('[name="projectName"]').value = data.name || '';
      item.querySelector('[name="projectRole"]').value = data.role || '';
      item.querySelector('[name="projectTime"]').value = data.time || '';
      item.querySelector('[name="projectContent"]').value = data.content || '';
      item.querySelector('[name="projectAchieve"]').value = data.achieve || '';
    }
    item.querySelector('.btn-remove').addEventListener('click', () => {
      item.remove();
      renderProjectPreview();
    });
    ['projectName', 'projectRole', 'projectTime', 'projectContent', 'projectAchieve'].forEach(name => {
      const input = item.querySelector('[name="' + name + '"]');
      if (input) input.addEventListener('input', renderProjectPreview);
    });
    projectList.appendChild(frag);
    renderProjectPreview();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function stripIds(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.id) root.removeAttribute('id');
    const nodes = root.querySelectorAll('[id]');
    nodes.forEach(n => n.removeAttribute('id'));
  }

  function createPreviewPage(pagesContainer) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'preview-page';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'page-content';
    pageDiv.appendChild(contentDiv);
    pagesContainer.appendChild(pageDiv);
    return contentDiv;
  }

  function isOverflowing(pageContent) {
    return pageContent.scrollHeight - pageContent.clientHeight > 1;
  }

  function buildPaginatedPreview() {
    const pagesContainer = document.getElementById('previewPages');
    if (!pagesContainer) return;

    pagesContainer.innerHTML = '';

    // 从“源简历”读取最新内容并按页面实际溢出分页（避免出现大空白）
    const headerSrc = preview.querySelector('.resume-header');
    const bodySrc = preview.querySelector('.resume-body');
    const blocksSrc = bodySrc ? Array.from(bodySrc.querySelectorAll(':scope > .resume-block')) : [];

    let pageContent = createPreviewPage(pagesContainer);

    const headerNode = headerSrc ? headerSrc.cloneNode(true) : null;
    if (headerNode) {
      stripIds(headerNode);
      pageContent.appendChild(headerNode);
    }

    const appendBlockWithFit = (blockNode) => {
      stripIds(blockNode);
      const hadContent = pageContent.childElementCount > 0;
      pageContent.appendChild(blockNode);
      if (hadContent && isOverflowing(pageContent)) {
        pageContent.removeChild(blockNode);
        pageContent = createPreviewPage(pagesContainer);
        pageContent.appendChild(blockNode);
      }
    };

    // 子元素分页：每一页都带模块标题（适用于教育、技能、工作等）
    const paginateBlockChildrenRepeatTitle = (blockSrc) => {
      const titleSrc = blockSrc.querySelector('.resume-block-title');
      const contentSrc = blockSrc.querySelector('.resume-block-content');
      if (!titleSrc || !contentSrc) {
        const whole = blockSrc.cloneNode(true);
        appendBlockWithFit(whole);
        return;
      }

      const childNodes = Array.from(contentSrc.children);
      if (childNodes.length === 0) {
        const whole = blockSrc.cloneNode(true);
        appendBlockWithFit(whole);
        return;
      }

      const makeSection = () => {
        const sec = document.createElement('section');
        sec.className = blockSrc.className || 'resume-block';
        const title = titleSrc.cloneNode(true);
        stripIds(title);
        const content = contentSrc.cloneNode(false);
        stripIds(content);
        sec.appendChild(title);
        sec.appendChild(content);
        return { sec, content };
      };

      let current = makeSection();
      appendBlockWithFit(current.sec);

      childNodes.forEach((childSrc) => {
        const item = childSrc.cloneNode(true);
        current.content.appendChild(item);
        if (isOverflowing(pageContent)) {
          current.content.removeChild(item);
          pageContent = createPreviewPage(pagesContainer);
          current = makeSection();
          pageContent.appendChild(current.sec);
          current.content.appendChild(item);
        }
      });
    };

    // 子元素分页：模块标题只在第一页出现（适用于“项目经历”）
    const paginateBlockChildrenNoRepeatTitle = (blockSrc) => {
      const titleSrc = blockSrc.querySelector('.resume-block-title');
      const contentSrc = blockSrc.querySelector('.resume-block-content');
      if (!titleSrc || !contentSrc) {
        const whole = blockSrc.cloneNode(true);
        appendBlockWithFit(whole);
        return;
      }

      const children = Array.from(contentSrc.children);
      if (children.length === 0) {
        const whole = blockSrc.cloneNode(true);
        appendBlockWithFit(whole);
        return;
      }

      const makeSectionFirst = () => {
        const sec = document.createElement('section');
        sec.className = blockSrc.className || 'resume-block';
        const title = titleSrc.cloneNode(true);
        stripIds(title);
        const content = contentSrc.cloneNode(false);
        stripIds(content);
        sec.appendChild(title);
        sec.appendChild(content);
        return { sec, content };
      };

      const makeSectionContinue = () => {
        const sec = document.createElement('section');
        // 续页 section 增加标记类，用于控制垂头样式
        sec.className = (blockSrc.className || 'resume-block') + ' resume-block-continued';
        const content = contentSrc.cloneNode(false);
        stripIds(content);
        sec.appendChild(content);
        return { sec, content };
      };

      // 将 Markdown 容器（.md-content）按内部「行/块」拆成最小单元（p / li 等）
      // 支持：ul/ol 按 li 拆；含 <br> 的 p 按行拆（marked breaks:true 时换行变 br）
      function flattenMdContainer(container) {
        const list = [];
        if (!container) return list;
        const nodes = Array.from(container.children || []);

        nodes.forEach((el) => {
          const tag = (el.tagName || '').toLowerCase();
          if (tag === 'ul' || tag === 'ol') {
            const liList = Array.from(el.children || []).filter(
              (c) => (c.tagName || '').toLowerCase() === 'li'
            );
            liList.forEach((li) => {
              const wrap = el.cloneNode(false);
              wrap.appendChild(li.cloneNode(true));
              list.push(wrap);
            });
          } else if (tag === 'p' && el.innerHTML && /<br\s*\/?>/i.test(el.innerHTML)) {
            const html = el.innerHTML;
            const parts = html.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
            parts.forEach((part) => {
              const p = document.createElement('p');
              p.innerHTML = part;
              list.push(p);
            });
          } else {
            list.push(el.cloneNode(true));
          }
        });

        return list;
      }

      // 按字截断：当块溢出时，二分查找能容纳的最大字数，拆成「当前页部分 + 溢出部分」
      function getTextFromBlock(node) {
        if (!node) return '';
        const tag = (node.tagName || '').toLowerCase();
        if (tag === 'li') return (node.textContent || '').trim();
        if (tag === 'ul' || tag === 'ol') {
          const li = node.querySelector('li');
          return li ? (li.textContent || '').trim() : '';
        }
        return (node.textContent || '').trim();
      }

      function createBlockWithText(origNode, text) {
        const tag = (origNode.tagName || '').toLowerCase();
        if (tag === 'ul' || tag === 'ol') {
          const wrap = origNode.cloneNode(false);
          const li = document.createElement('li');
          li.textContent = text;
          wrap.appendChild(li);
          return wrap;
        }
        const p = document.createElement(tag === 'p' ? 'p' : 'p');
        p.textContent = text;
        return p;
      }

      function canSplitByChar(unit) {
        if (!unit || !unit.node || !unit.subWrapperClass) return false;
        const tag = (unit.node.tagName || '').toLowerCase();
        if (tag !== 'p' && tag !== 'ul' && tag !== 'ol') return false;
        const text = getTextFromBlock(unit.node);
        return text.length > 1;
      }

      // project 模块：以「项目内的每一行/块」为单位分页（p / li 等），避免整段推到下一页造成大片留白
      const units = [];
      let projectIndex = 0;

      children.forEach((child) => {
        if (child.classList && child.classList.contains('project-item')) {
          const wrapperClass = child.className || 'project-item';
          const wrapperKey = `project-${projectIndex++}`;

          Array.from(child.children || []).forEach((part) => {
            const isMdContent =
              part.classList &&
              part.classList.contains('md-content') &&
              part.children &&
              part.children.length > 0;

            if (isMdContent) {
              const subWrapperClass = part.className; // e.g. "project-achieve md-content"
              const atoms = flattenMdContainer(part);
              if (atoms.length === 0) {
                const node = part.cloneNode(true);
                stripIds(node);
                units.push({ wrapperKey, wrapperClass, node, subWrapperClass: null, isLabel: false });
              } else {
                atoms.forEach((atom) => {
                  stripIds(atom);
                  units.push({ wrapperKey, wrapperClass, subWrapperClass, node: atom, isLabel: false });
                });
              }
            } else {
              const node = part.cloneNode(true);
              stripIds(node);
              const isLabel = !!(part.classList && part.classList.contains('project-label'));
              units.push({ wrapperKey, wrapperClass, node, subWrapperClass: null, isLabel });
            }
          });
        } else {
          const node = child.cloneNode(true);
          stripIds(node);
          units.push({ wrapperKey: null, wrapperClass: null, node, subWrapperClass: null, isLabel: false });
        }
      });

      let current = makeSectionFirst();
      appendBlockWithFit(current.sec);

      let currentWrapperKey = null;
      let currentWrapper = null;
      let currentSubWrapperClass = null;
      let currentSubWrapper = null;

      function resetWrapperState() {
        currentWrapperKey = null;
        currentWrapper = null;
        currentSubWrapperClass = null;
        currentSubWrapper = null;
      }

      function gotoNextPage() {
        pageContent = createPreviewPage(pagesContainer);
        current = makeSectionContinue();
        pageContent.appendChild(current.sec);
        resetWrapperState();
      }

      function ensureWrapper(unit) {
        if (!unit.wrapperKey) return;
        if (unit.wrapperKey !== currentWrapperKey) {
          currentWrapperKey = unit.wrapperKey;
          currentWrapper = document.createElement('div');
          currentWrapper.className = unit.wrapperClass || 'project-item';
          current.content.appendChild(currentWrapper);
          currentSubWrapperClass = null;
          currentSubWrapper = null;
        }
      }

      function ensureSubWrapper(unit) {
        if (!unit.subWrapperClass) return;
        if (!currentWrapper) return;
        if (!currentSubWrapper || currentSubWrapperClass !== unit.subWrapperClass) {
          currentSubWrapperClass = unit.subWrapperClass;
          currentSubWrapper = document.createElement('div');
          currentSubWrapper.className = unit.subWrapperClass;
          currentWrapper.appendChild(currentSubWrapper);
        }
      }

      function appendUnit(unit) {
        if (!unit.wrapperKey) {
          current.content.appendChild(unit.node);
          return;
        }
        ensureWrapper(unit);
        if (unit.subWrapperClass) {
          ensureSubWrapper(unit);
          currentSubWrapper.appendChild(unit.node);
        } else {
          currentWrapper.appendChild(unit.node);
        }
      }

      function removeLastUnit(unit) {
        if (unit && unit.node && unit.node.parentNode) {
          const parent = unit.node.parentNode;
          parent.removeChild(unit.node);

          // subWrapper 空了就移除
          if (
            unit.subWrapperClass &&
            parent &&
            parent.classList &&
            parent.className === unit.subWrapperClass &&
            parent.childElementCount === 0
          ) {
            if (parent.parentNode) parent.parentNode.removeChild(parent);
            if (currentSubWrapper === parent) {
              currentSubWrapper = null;
              currentSubWrapperClass = null;
            }
          }
        }

        // wrapper 空了就移除
        if (currentWrapper && currentWrapper.childElementCount === 0) {
          if (currentWrapper.parentNode) currentWrapper.parentNode.removeChild(currentWrapper);
          resetWrapperState();
        }
      }

      // 注意：这里不用 forEach，需做“标签 + 下一行”同页处理的 lookahead；溢出时尝试按字截断
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];

        appendUnit(unit);
        if (isOverflowing(pageContent)) {
          removeLastUnit(unit);
          // 尝试按字截断：二分查找能容纳的最大字数
          if (canSplitByChar(unit)) {
            const fullText = getTextFromBlock(unit.node);
            let lo = 0;
            let hi = fullText.length;
            while (lo < hi) {
              const mid = Math.floor((lo + hi + 1) / 2);
              const tryNode = createBlockWithText(unit.node, fullText.slice(0, mid));
              stripIds(tryNode);
              const tryUnit = { ...unit, node: tryNode };
              appendUnit(tryUnit);
              if (isOverflowing(pageContent)) {
                removeLastUnit(tryUnit);
                hi = mid - 1;
              } else {
                removeLastUnit(tryUnit);
                lo = mid;
              }
            }
            if (lo > 0) {
              const fitNode = createBlockWithText(unit.node, fullText.slice(0, lo));
              const restText = fullText.slice(lo);
              stripIds(fitNode);
              appendUnit({ ...unit, node: fitNode });
              gotoNextPage();
              const restNode = createBlockWithText(unit.node, restText);
              stripIds(restNode);
              units.splice(i, 1, { ...unit, node: restNode });
              i -= 1; // 下一轮处理溢出部分（可能继续按字截断）
              continue;
            }
          }
          gotoNextPage();
          appendUnit(unit);
        }

        // 避免「内容:」「业绩:」标签孤立在页尾：标签后至少放得下一行 p/li，否则整体挪到下一页
        if (unit.isLabel) {
          const next = units[i + 1];
          if (next && next.wrapperKey && next.wrapperKey === unit.wrapperKey && next.subWrapperClass) {
            appendUnit(next);
            if (isOverflowing(pageContent)) {
              removeLastUnit(next);
              removeLastUnit(unit);
              gotoNextPage();
              appendUnit(unit);
              appendUnit(next);
            }
            i += 1; // next 已消费，无论是否溢出都跳过
          }
        }
      }
    };

    blocksSrc.forEach((blockSrc) => {
      const isProjectBlock = !!blockSrc.querySelector('#previewProject');
      const isSkillsBlock = !!blockSrc.querySelector('#previewSkills');

      if (isProjectBlock) {
        // “项目经历”模块：标题只在第一页出现，其余页只继续内容
        paginateBlockChildrenNoRepeatTitle(blockSrc);
      } else if (isSkillsBlock) {
        // 专业技能：内容相对较短，整体作为一个块处理，避免 Markdown 子节点被拆分页导致丢失
        const whole = blockSrc.cloneNode(true);
        appendBlockWithFit(whole);
      } else {
        // 其他模块：每页可重复标题，排版更清晰
        paginateBlockChildrenRepeatTitle(blockSrc);
      }
    });
  }

  function scheduleBuildPaginatedPreview() {
    requestAnimationFrame(function () {
      buildPaginatedPreview();
    });
  }

  // 初始化：默认两条工作、两个项目（与 template 一致）
  addWorkItem({ company: 'your-company', position: 'workPosition', time: '2024.04-2025.01' });

  addProjectItem({
    name: 'projectName',
    role: 'projectRole',
    time: '2024.05-2025.01',
    content: 'content',
    achieve: 'achieve'
  });


  bindPreview();

  // 如果存在 data.json，则用其中的数据覆盖默认示例
  loadInitialData();

  document.getElementById('addWork').addEventListener('click', () => addWorkItem());
  document.getElementById('addProject').addEventListener('click', () => addProjectItem());

  // 简历字体：左侧下拉选择，预览与导出共用
  const resumeFontSelect = document.getElementById('resumeFont');
  const previewWrap = document.querySelector('.preview-wrap');
  function applyResumeFont() {
    const value = resumeFontSelect?.value;
    if (value && previewWrap) previewWrap.style.setProperty('--font-resume', value);
  }
  if (resumeFontSelect) {
    resumeFontSelect.addEventListener('change', applyResumeFont);
    applyResumeFont();
  }

  // 保存 JSON：调用后端 /api/resume 自动写入 data.json
  document.getElementById('btnSaveJson').addEventListener('click', async function () {
    const data = collectFormData();
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('保存失败');
      Swal.fire({
        title: '保存成功',
        text: '信息已保存到 data.json',
        icon: 'success',
        timer: 2000, 
        timerProgressBar: true, 
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: '保存失败',
        text: '请检查终端是否已启动 Node 服务',
        icon: 'error',
        timer: 2000, 
        timerProgressBar: true, 
        showConfirmButton: false 
      });
    }
  });

  // 左右分栏拖拽调整：左侧编辑区宽度可横拉
  (function () {
    const resizer = document.getElementById('panelResizer');
    const app = document.querySelector('.app');
    const editorPanel = document.querySelector('.editor-panel');
    if (!resizer || !app || !editorPanel) return;
    const MIN = 320;
    const MAX = Math.max(MIN, window.innerWidth * 0.6);
    let startX = 0;
    let startW = 0;

    function getWidth() {
      const w = parseFloat(getComputedStyle(editorPanel).width);
      return isNaN(w) ? 400 : Math.round(w);
    }

    function setWidth(px) {
      const w = Math.min(MAX, Math.max(MIN, px));
      document.documentElement.style.setProperty('--editor-width', w + 'px');
      try { localStorage.setItem('resume-editor-width', String(w)); } catch (_) {}
    }

    try {
      const saved = parseInt(localStorage.getItem('resume-editor-width'), 10);
      if (!isNaN(saved) && saved >= MIN) setWidth(saved);
    } catch (_) {}

    resizer.addEventListener('mousedown', function (e) {
      e.preventDefault();
      resizer.classList.add('resizing');
      startX = e.clientX;
      startW = getWidth();
      const onMove = function (ev) {
        const dx = ev.clientX - startX;
        setWidth(startW + dx);
      };
      const onUp = function () {
        resizer.classList.remove('resizing');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  })();

  // PDF 下载：导出分页容器，内容按 A4 高度自动分页
  document.getElementById('btnDownload').addEventListener('click', function () {
    const pagesContainer = document.getElementById('previewPages');
    const target = pagesContainer && pagesContainer.children.length > 0 ? pagesContainer : preview;
    const opt = {
      margin: 0,
      filename: (form.querySelector('[name="name"]')?.value || '简历') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(target).save();
  });
})();

(function () {
  const STORAGE_KEY = "aics-config-by-host";
  const rootId = "aics-root";
  const state = {
    config: null,
    root: null,
    panel: null,
    list: null,
    status: null,
    toggle: null,
    header: null,
    activeButton: null,
    lastRenderedSignature: "",
    hoveredElement: null,
    cleanupPicker: null,
    lastUrl: location.href,
    expanded: true,
    userTop: null,
    userHeight: null,
    dragMode: null
  };

  const SITE_RULES = [
    {
      label: "OpenAI",
      hosts: ["chatgpt.com", "chat.openai.com"],
      containerSelectors: ["main", '[data-testid="conversation-turn-list"]', "[role='main']"],
      userMessageSelectors: [
        '[data-message-author-role="user"]',
        'article[data-testid*="conversation-turn"] [data-message-author-role="user"]',
        'div[data-message-author-role="user"]'
      ]
    },
    {
      label: "Gemini",
      hosts: ["gemini.google.com"],
      containerSelectors: ["chat-window", "main", '[role="main"]'],
      userMessageSelectors: [
        'user-query',
        '[data-test-id="user-query"]',
        '[class*="query-text"]',
        '[class*="user-query"]'
      ]
    },
    {
      label: "豆包",
      hosts: ["www.doubao.com", "doubao.com"],
      containerSelectors: ["main", '[class*="chat"]', '[class*="conversation"]'],
      userMessageSelectors: [
        '[data-testid*="user"]',
        '[data-testid*="query"]',
        '[class*="user-message"]',
        '[class*="message-user"]',
        '[class*="query"]',
        '[class*="user-content"]',
        '[class*="query-item"]'
      ]
    },
    {
      label: "Claude",
      hosts: ["claude.ai"],
      containerSelectors: ["main", '[class*="conversation"]', '[data-testid="chat-messages"]'],
      userMessageSelectors: [
        '[data-testid*="user"]',
        '[class*="font-user-message"]',
        '[class*="userMessage"]'
      ]
    },
    {
      label: "Kimi",
      hosts: ["kimi.moonshot.cn"],
      containerSelectors: ["main", '[class*="chat"]', '[class*="scroll"]'],
      userMessageSelectors: [
        '[class*="user"]',
        '[data-testid*="user"]',
        '[class*="question"]'
      ]
    },
    {
      label: "DeepSeek",
      hosts: ["chat.deepseek.com"],
      containerSelectors: ["main", '[class*="chat"]', '[class*="conversation"]'],
      userMessageSelectors: [
        '[data-role="user"]',
        '[class*="user-message"]',
        '[class*="message-user"]'
      ]
    },
    {
      label: "元宝",
      hosts: ["yuanbao.tencent.com"],
      containerSelectors: ["main", '[class*="chat"]', '[class*="conversation"]'],
      userMessageSelectors: [
        '[data-testid*="user"]',
        '[class*="user-message"]',
        '[class*="question"]'
      ]
    }
  ];

  const USER_MESSAGE_SELECTORS = [
    '[data-message-author-role="user"]',
    '[data-role="user"]',
    '[data-testid*="user"]',
    '[class*="user-message"]',
    '[class*="message-user"]',
    '[class*="userBubble"]',
    '[class*="request"]',
    '[class*="question"]',
    '[class*="query"]',
    'article[data-author="user"]'
  ];

  const MIN_PANEL_HEIGHT = 180;
  const EDGE_RESIZE_HIT_SIZE = 10;

  bootstrap().catch((error) => {
    console.error("[AI Chat Context Sidebar] 初始化失败", error);
  });

  async function bootstrap() {
    if (window.top !== window.self || document.getElementById(rootId)) {
      return;
    }

    createPanel();
    state.config = await resolveConfig();
    bindPanelEvents();
    bindViewportEvents();
    startGlobalObserver();
    render();
  }

  function createPanel() {
    const root = document.createElement("aside");
    root.id = rootId;
    root.innerHTML = `
      <section id="aics-panel">
        <div class="aics-header">
          <strong>聊天目录</strong>
          <div class="aics-actions">
            <button class="aics-btn" type="button" data-action="toggle">关</button>
            <button class="aics-btn" type="button" data-action="pick">选择聊天框</button>
            <button class="aics-btn" type="button" data-action="refresh">刷新</button>
          </div>
        </div>
        <div class="aics-status"></div>
        <div class="aics-list"></div>
      </section>
    `;

    document.documentElement.appendChild(root);
    state.root = root;
    state.panel = root.querySelector("#aics-panel");
    state.list = root.querySelector(".aics-list");
    state.status = root.querySelector(".aics-status");
    state.toggle = root.querySelector('[data-action="toggle"]');
    state.header = root.querySelector(".aics-header");
  }

  function bindPanelEvents() {
    bindDragAndResizeEvents();

    state.root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      const { action, messageId } = button.dataset;
      if (action === "toggle") {
        toggleExpanded();
      } else if (action === "pick") {
        startPicker();
      } else if (action === "refresh") {
        render();
      } else if (action === "jump" && messageId) {
        jumpToMessage(messageId);
      }
    });

    state.list.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.list.scrollTop += event.deltaY;
    }, { passive: false });
  }

  function bindDragAndResizeEvents() {
    state.header.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) {
        return;
      }
      startDrag(event);
    });

    state.root.addEventListener("mousemove", (event) => {
      if (state.dragMode) {
        return;
      }
      const mode = getResizeMode(event);
      state.root.style.cursor = mode ? "ns-resize" : "";
    });

    state.root.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || event.target.closest(".aics-header")) {
        return;
      }
      const mode = getResizeMode(event);
      if (!mode) {
        return;
      }
      startResize(event, mode);
    });
  }

  function startGlobalObserver() {
    const observer = new MutationObserver(() => {
      if (location.href !== state.lastUrl) {
        state.lastUrl = location.href;
        refreshConfigForCurrentPage();
      }
      debounceRender();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function bindViewportEvents() {
    window.addEventListener("scroll", debounceRender, true);
    window.addEventListener("resize", debounceRender, true);
  }

  let renderTimer = 0;
  function debounceRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      render();
    }, 300);
  }

  async function refreshConfigForCurrentPage() {
    state.config = await resolveConfig();
  }

  async function resolveConfig() {
    const storedConfig = await loadManualConfig();
    state.expanded = storedConfig?.expanded !== false;
    state.userTop = typeof storedConfig?.userTop === "number" ? storedConfig.userTop : null;
    state.userHeight = typeof storedConfig?.userHeight === "number" ? storedConfig.userHeight : null;

    if (storedConfig?.selector) {
      return {
        ...storedConfig,
        mode: "manual",
        label: "手动选择"
      };
    }

    const autoConfig = inferSiteConfig(storedConfig || {});
    if (autoConfig) {
      return autoConfig;
    }

    state.expanded = true;
    state.userTop = null;
    state.userHeight = null;
    return null;
  }

  async function loadManualConfig() {
    const host = location.host;
    const storage = await chrome.storage.sync.get(STORAGE_KEY);
    return storage?.[STORAGE_KEY]?.[host] || null;
  }

  async function saveManualConfig(config) {
    const storage = await chrome.storage.sync.get(STORAGE_KEY);
    const allConfig = storage?.[STORAGE_KEY] || {};
    allConfig[location.host] = config;
    await chrome.storage.sync.set({ [STORAGE_KEY]: allConfig });
    state.expanded = config.expanded !== false;
    state.config = {
      ...config,
      mode: "manual",
      label: "手动选择"
    };
  }

  async function saveExpandedPreference(expanded) {
    const storage = await chrome.storage.sync.get(STORAGE_KEY);
    const allConfig = storage?.[STORAGE_KEY] || {};
    const current = allConfig[location.host] || {};
    allConfig[location.host] = {
      ...current,
      expanded
    };
    await chrome.storage.sync.set({ [STORAGE_KEY]: allConfig });
  }

  async function saveLayoutPreference(patch) {
    const storage = await chrome.storage.sync.get(STORAGE_KEY);
    const allConfig = storage?.[STORAGE_KEY] || {};
    const current = allConfig[location.host] || {};
    allConfig[location.host] = {
      ...current,
      ...patch
    };
    await chrome.storage.sync.set({ [STORAGE_KEY]: allConfig });
  }

  function inferSiteConfig(storedConfig) {
    const rule = SITE_RULES.find((item) => item.hosts.includes(location.host));
    if (!rule) {
      return inferGenericConfig(storedConfig);
    }

    const selector = pickFirstExistingSelector(rule.containerSelectors);
    if (!selector) {
      return {
        mode: "auto",
        label: `${rule.label} 自动适配`,
        expanded: storedConfig.expanded !== false,
        userTop: typeof storedConfig.userTop === "number" ? storedConfig.userTop : null,
        userHeight: typeof storedConfig.userHeight === "number" ? storedConfig.userHeight : null,
        containerSelectors: rule.containerSelectors,
        userMessageSelectors: rule.userMessageSelectors
      };
    }

    return {
      mode: "auto",
      label: `${rule.label} 自动适配`,
      expanded: storedConfig.expanded !== false,
      userTop: typeof storedConfig.userTop === "number" ? storedConfig.userTop : null,
      userHeight: typeof storedConfig.userHeight === "number" ? storedConfig.userHeight : null,
      selector,
      containerSelectors: rule.containerSelectors,
      userMessageSelectors: rule.userMessageSelectors
    };
  }

  function inferGenericConfig(storedConfig) {
    const genericSelectors = [
      "main",
      '[role="main"]',
      '[class*="chat"]',
      '[class*="conversation"]',
      '[class*="messages"]'
    ];
    const selector = pickFirstExistingSelector(genericSelectors);
    if (!selector) {
      return null;
    }

    return {
      mode: "auto",
      label: "通用自动适配",
      expanded: storedConfig.expanded !== false,
      userTop: typeof storedConfig.userTop === "number" ? storedConfig.userTop : null,
      userHeight: typeof storedConfig.userHeight === "number" ? storedConfig.userHeight : null,
      selector,
      containerSelectors: genericSelectors,
      userMessageSelectors: USER_MESSAGE_SELECTORS
    };
  }

  function pickFirstExistingSelector(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && document.body.contains(element)) {
        return selector;
      }
    }
    return "";
  }

  function render() {
    const container = getChatContainer();
    const messages = container ? collectUserMessages(container) : [];
    syncPanelLayout(container);
    renderToggle();
    renderStatus(container);
    renderList(messages);
  }

  function getChatContainer() {
    if (!state.config) {
      return null;
    }

    if (state.config.selector) {
      const element = document.querySelector(state.config.selector);
      if (element && document.body.contains(element)) {
        return element;
      }
    }

    const fallbackSelector = pickFirstExistingSelector(state.config.containerSelectors || []);
    if (!fallbackSelector) {
      return null;
    }

    state.config = {
      ...state.config,
      selector: fallbackSelector
    };
    return document.querySelector(fallbackSelector);
  }

  function collectUserMessages(container) {
    const candidates = queryUserMessages(container);
    const messages = [];
    candidates.forEach((element, index) => {
      const text = extractReadableText(element);
      if (!text) {
        return;
      }

      const messageId = ensureMessageId(element, index);
      messages.push({
        id: messageId,
        preview: shortenPreview(text),
        text,
        fullText: text,
        element
      });
    });
    return messages;
  }

  function queryUserMessages(container) {
    const currentRule = SITE_RULES.find((rule) => rule.hosts.includes(location.host));
    const selectors = uniqueStrings([
      ...(state.config?.userMessageSelectors || []),
      ...USER_MESSAGE_SELECTORS
    ]);
    const matched = new Set();

    selectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach((element) => {
        if (isLikelyUserMessage(element)) {
          matched.add(element);
        }
      });
    });

    if (matched.size > 0) {
      return sortByDomOrder(filterNestedElements(Array.from(matched)));
    }

    if (currentRule?.label === "豆包") {
      return queryDoubaoFallbackMessages(container);
    }

    return sortByDomOrder(filterNestedElements(Array.from(container.querySelectorAll("article, li, section, div"))
      .filter((element) => {
        if (!isLikelyUserMessage(element)) {
          return false;
        }
        const text = extractReadableText(element);
        return text.length >= 3 && text.length <= 12000;
      })
      .slice(0, 200)));
  }

  function isLikelyUserMessage(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (!isVisible(element)) {
      return false;
    }

    const text = extractReadableText(element);
    if (text.length < 2) {
      return false;
    }

    if (element.closest("header, nav, aside")) {
      return false;
    }

    const markerText = `${element.className || ""} ${element.getAttribute("data-testid") || ""} ${element.getAttribute("data-role") || ""} ${element.getAttribute("data-message-author-role") || ""}`.toLowerCase();
    if (/(assistant|model|bot|system|tool|response)/.test(markerText)) {
      return false;
    }

    if (isDoubaoHost()) {
      if (/(answer|assistant|reply|markdown|content-main|thought|reason|output)/.test(markerText)) {
        return false;
      }
      if (/(title|topic|session|history|sidebar|menu)/.test(markerText)) {
        return false;
      }
      if (/(user|query|question|request)/.test(markerText)) {
        return true;
      }
      return text.length >= 3 && text.length <= 12000;
    }

    if (/(user|query|question|request)/.test(markerText)) {
      return true;
    }

    return element.children.length <= 16 && text.length <= 12000;
  }

  function ensureMessageId(element, index) {
    if (!element.dataset.aicsMessageId) {
      element.dataset.aicsMessageId = `aics-msg-${Date.now()}-${index}`;
    }
    return element.dataset.aicsMessageId;
  }

  function renderStatus(container) {
    if (!state.status) {
      return;
    }

    state.status.style.display = state.expanded ? "block" : "none";

    if (!state.config) {
      state.status.textContent = "暂未自动识别到聊天区域，请点击“选择聊天框”手动指定。";
      return;
    }

    if (!container) {
      state.status.textContent = `${state.config.label || "自动适配"} 未找到聊天框，请尝试手动选择。`;
      return;
    }

    state.status.textContent = `${state.config.label || "已适配"}，侧栏按用户发起消息的先后顺序展示。`;
  }

  function renderList(messages) {
    if (!state.list) {
      return;
    }

    state.list.style.display = state.expanded ? "block" : "none";
    if (!state.expanded) {
      return;
    }

    const signature = messages.map((message) => `${message.id}:${message.preview}`).join("|");
    if (signature === state.lastRenderedSignature && state.list.children.length > 0) {
      return;
    }
    state.lastRenderedSignature = signature;

    state.list.innerHTML = "";

    if (messages.length === 0) {
      const empty = document.createElement("div");
      empty.className = "aics-empty";
      empty.textContent = "当前没有识别到用户发起的聊天内容。若页面结构特殊，请重新选择聊天框。";
      state.list.appendChild(empty);
      return;
    }

    messages.forEach((message, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "aics-item";
      item.dataset.action = "jump";
      item.dataset.messageId = message.id;
      item.title = message.fullText;
      item.innerHTML = `
        <span class="aics-item-title">${escapeHtml(message.preview)}</span>
      `;
      state.list.appendChild(item);
    });
  }

  function jumpToMessage(messageId) {
    const target = document.querySelector(`[data-aics-message-id="${messageId}"]`);
    if (!target) {
      render();
      return;
    }

    if (state.activeButton) {
      state.activeButton.classList.remove("aics-active");
    }
    state.activeButton = state.list.querySelector(`[data-message-id="${messageId}"]`);
    state.activeButton?.classList.add("aics-active");

    target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    target.classList.add("aics-highlight");
    window.setTimeout(() => {
      target.classList.remove("aics-highlight");
    }, 1800);
  }

  function startPicker() {
    stopPicker();
    document.documentElement.classList.add("aics-pick-mode");
    state.status.textContent = "选择模式已开启：将鼠标移动到聊天区域上，单击完成选择，按 Esc 取消。";

    const onMouseOver = (event) => {
      const element = event.target;
      if (state.root.contains(element)) {
        return;
      }
      highlightPickerTarget(element);
    };

    const onClick = async (event) => {
      if (state.root.contains(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const targetContainer = findBestContainer(event.target);
      const selector = buildSelector(targetContainer);
      if (!selector) {
        state.status.textContent = "当前元素无法生成稳定选择器，请换一个外层聊天容器再试一次。";
        return;
      }

      await saveManualConfig({
        selector,
        containerSelectors: [selector],
        userMessageSelectors: USER_MESSAGE_SELECTORS
      });
      stopPicker();
      render();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        stopPicker();
        render();
      }
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);

    state.cleanupPicker = () => {
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }

  function stopPicker() {
    state.cleanupPicker?.();
    state.cleanupPicker = null;
    document.documentElement.classList.remove("aics-pick-mode");
    clearPickerTarget();
  }

  function highlightPickerTarget(element) {
    clearPickerTarget();
    state.hoveredElement = element;
    state.hoveredElement.classList.add("aics-picker-target");
  }

  function clearPickerTarget() {
    if (state.hoveredElement) {
      state.hoveredElement.classList.remove("aics-picker-target");
      state.hoveredElement = null;
    }
  }

  function buildSelector(element) {
    if (!(element instanceof Element)) {
      return "";
    }

    const path = [];
    let current = element;
    while (current && current !== document.body && path.length < 6) {
      let segment = current.tagName.toLowerCase();
      if (current.id) {
        segment += `#${cssEscape(current.id)}`;
        path.unshift(segment);
        break;
      }

      if (current.classList.length > 0) {
        const className = Array.from(current.classList)
          .find((name) => /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(name));
        if (className) {
          segment += `.${cssEscape(className)}`;
        }
      }

      const siblings = current.parentElement
        ? Array.from(current.parentElement.children).filter((node) => node.tagName === current.tagName)
        : [];
      if (siblings.length > 1) {
        segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }

      path.unshift(segment);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  function startDrag(event) {
    event.preventDefault();
    const rect = state.root.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    state.dragMode = "move";
    state.root.classList.add("aics-dragging");

    const onMove = (moveEvent) => {
      const height = state.root.getBoundingClientRect().height;
      const maxTop = Math.max(window.innerHeight - height - 8, 8);
      state.userTop = Math.round(clamp(moveEvent.clientY - offsetY, 8, maxTop));
      state.root.style.top = `${state.userTop}px`;
    };

    const onUp = async () => {
      cleanupPointerListeners(onMove, onUp);
      state.root.classList.remove("aics-dragging");
      state.dragMode = null;
      await saveLayoutPreference({ userTop: state.userTop });
    };

    attachPointerListeners(onMove, onUp);
  }

  function startResize(event, mode) {
    event.preventDefault();
    const rect = state.root.getBoundingClientRect();
    const startTop = rect.top;
    const startBottom = rect.bottom;
    const startHeight = rect.height;
    state.dragMode = mode;
    state.root.classList.add("aics-resizing");

    const onMove = (moveEvent) => {
      if (mode === "resize-top") {
        const nextTop = clamp(moveEvent.clientY, 8, startBottom - MIN_PANEL_HEIGHT);
        const nextHeight = clamp(startHeight + (startTop - nextTop), MIN_PANEL_HEIGHT, window.innerHeight - nextTop - 8);
        state.userTop = Math.round(nextTop);
        state.userHeight = Math.round(nextHeight);
      } else {
        const nextHeight = clamp(startHeight + (moveEvent.clientY - startBottom), MIN_PANEL_HEIGHT, window.innerHeight - startTop - 8);
        state.userTop = Math.round(startTop);
        state.userHeight = Math.round(nextHeight);
      }

      state.root.style.top = `${state.userTop}px`;
      state.root.style.height = `${state.userHeight}px`;
    };

    const onUp = async () => {
      cleanupPointerListeners(onMove, onUp);
      state.root.classList.remove("aics-resizing");
      state.dragMode = null;
      await saveLayoutPreference({
        userTop: state.userTop,
        userHeight: state.userHeight
      });
    };

    attachPointerListeners(onMove, onUp);
  }

  function attachPointerListeners(onMove, onUp) {
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
  }

  function cleanupPointerListeners(onMove, onUp) {
    window.removeEventListener("mousemove", onMove, true);
    window.removeEventListener("mouseup", onUp, true);
  }

  function getResizeMode(event) {
    const rect = state.root.getBoundingClientRect();
    const topDistance = event.clientY - rect.top;
    const bottomDistance = rect.bottom - event.clientY;

    if (topDistance >= 0 && topDistance <= EDGE_RESIZE_HIT_SIZE) {
      return "resize-top";
    }
    if (bottomDistance >= 0 && bottomDistance <= EDGE_RESIZE_HIT_SIZE) {
      return "resize-bottom";
    }
    return "";
  }

  function findBestContainer(element) {
    let current = element;
    let fallback = element;

    while (current && current !== document.body) {
      const text = extractReadableText(current);
      const childCount = current.children.length;
      if (text.length >= 20 && childCount >= 2) {
        fallback = current;
      }
      if (childCount >= 4 && text.length >= 20) {
        return current;
      }
      current = current.parentElement;
    }

    return fallback;
  }

  function queryDoubaoFallbackMessages(container) {
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;

    const candidates = Array.from(container.querySelectorAll("article, li, section, div"))
      .filter((element) => {
        if (!(element instanceof Element) || !isVisible(element)) {
          return false;
        }
        if (element.closest("header, nav, aside")) {
          return false;
        }

        const text = extractReadableText(element);
        if (text.length < 3 || text.length > 12000) {
          return false;
        }

        const markerText = `${element.className || ""} ${element.getAttribute("data-testid") || ""} ${element.getAttribute("data-role") || ""} ${element.getAttribute("data-message-author-role") || ""}`.toLowerCase();
        if (/(answer|assistant|reply|markdown|thought|reason|output|title|topic|session|history|sidebar|menu)/.test(markerText)) {
          return false;
        }

        if (/(user|query|question|request)/.test(markerText)) {
          return true;
        }

        const rect = element.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const isRightSideBubble = elementCenterX > containerCenterX && rect.width < containerRect.width * 0.9;
        return isRightSideBubble && element.children.length <= 16;
      });

    return sortByDomOrder(filterNestedElements(candidates)).slice(0, 200);
  }

  function extractReadableText(element) {
    const rawText = normalizeText(element.innerText || element.textContent || "");
    return stripSpeakerPrefix(rawText);
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function filterNestedElements(elements) {
    return elements.filter((element) => {
      return !elements.some((other) => other !== element && other.contains(element));
    });
  }

  function sortByDomOrder(elements) {
    return elements.sort((left, right) => {
      if (left === right) {
        return 0;
      }
      const relation = left.compareDocumentPosition(right);
      if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (relation & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });
  }

  function uniqueStrings(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function shortenPreview(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= 15) {
      return normalized;
    }
    return `${normalized.slice(0, 15)}...`;
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function stripSpeakerPrefix(text) {
    return text
      .replace(/^(you said|you|user|我说|我问|提问|问题)\s*[:：-]\s*/i, "")
      .replace(/^(you said|you|user|我说|我问|提问|问题)\s+/i, "")
      .trim();
  }

  function isDoubaoHost() {
    return location.host === "www.doubao.com" || location.host === "doubao.com";
  }

  function syncPanelLayout(container) {
    if (!state.root || !state.panel) {
      return;
    }

    if (!container) {
      state.root.style.top = `${state.userTop ?? 20}px`;
      state.root.style.height = state.expanded ? `${state.userHeight ?? Math.max(window.innerHeight - 40, MIN_PANEL_HEIGHT)}px` : "auto";
      return;
    }

    if (!state.expanded) {
      state.root.style.top = `${Math.round(state.userTop ?? Math.max(container.getBoundingClientRect().top, 12))}px`;
      state.root.style.height = "auto";
      return;
    }

    const rect = container.getBoundingClientRect();
    const viewportTop = 12;
    const viewportBottom = window.innerHeight - 12;
    const autoTop = Math.max(rect.top, viewportTop);
    const autoBottom = Math.min(rect.bottom, viewportBottom);
    const autoHeight = Math.max(autoBottom - autoTop, MIN_PANEL_HEIGHT);
    const top = clamp(state.userTop ?? autoTop, 8, Math.max(window.innerHeight - MIN_PANEL_HEIGHT - 8, 8));
    const height = clamp(state.userHeight ?? autoHeight, MIN_PANEL_HEIGHT, window.innerHeight - top - 8);

    state.root.style.top = `${Math.round(top)}px`;
    state.root.style.height = `${Math.round(height)}px`;
  }

  function renderToggle() {
    if (!state.toggle || !state.panel) {
      return;
    }

    state.toggle.textContent = state.expanded ? "关" : "开";
    state.panel.classList.toggle("aics-collapsed", !state.expanded);
  }

  async function toggleExpanded() {
    state.expanded = !state.expanded;
    renderToggle();
    renderStatus(getChatContainer());
    renderList(state.expanded ? collectUserMessages(getChatContainer() || document.body) : []);
    await saveExpandedPreference(state.expanded);

    if (state.config) {
      state.config = {
        ...state.config,
        expanded: state.expanded
      };
    }
  }


  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();

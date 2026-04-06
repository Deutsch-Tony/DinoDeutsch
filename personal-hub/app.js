const STORAGE_KEY = "life-ledger-state-v3";
const EVENT_TAGS = ["Focus", "Health", "Social", "Study"];
const NOTE_TYPES = ["task", "idea", "journal"];
const DEFAULT_SAVINGS_START = "2025-12-08";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FUND_SEEDS = [
  {
    id: "VESAF",
    code: "VESAF",
    name: "VinaCapital VESAF",
    subtitle: "Quy co phieu tiep can thi truong",
    provider: "VinaCapital",
    initialAmount: 71500000,
    averageBuyPrice: 30845,
    initialNav: 35763.77,
    navDate: "2026-03-30",
    source: "Fmarket",
  },
  {
    id: "VMEEF",
    code: "VMEEF",
    name: "VinaCapital VMEEF",
    subtitle: "Quy co phieu kinh te hien dai",
    provider: "VinaCapital",
    initialAmount: 11500000,
    averageBuyPrice: 16050,
    initialNav: 17420.51,
    navDate: "2026-03-30",
    source: "Fmarket",
  },
];

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const decimalNumber = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const unitNumber = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const shortDate = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "short",
});

const compactDate = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

const monthLabel = new Intl.DateTimeFormat("vi-VN", {
  month: "long",
  year: "numeric",
});

const weekdayShort = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
});

const fullDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const lunarFormatter = new Intl.DateTimeFormat("en-US-u-ca-chinese-nu-latn", {
  month: "numeric",
  day: "numeric",
});

const SOLAR_OCCASIONS = {
  "01-01": ["Tet Duong lich"],
  "02-14": ["Valentine"],
  "03-08": ["Quoc te Phu nu"],
  "04-30": ["Giai phong mien Nam"],
  "05-01": ["Quoc te Lao dong"],
  "06-01": ["Quoc te Thieu nhi"],
  "09-02": ["Quoc khanh"],
  "10-20": ["Phu nu Viet Nam"],
  "11-20": ["Nha giao Viet Nam"],
  "12-24": ["Dem Giang sinh"],
};

const LUNAR_OCCASIONS = {
  "1-1": ["Tet Nguyen Dan"],
  "1-15": ["Ram thang Gieng"],
  "3-10": ["Gio to Hung Vuong"],
  "5-5": ["Tet Doan Ngo"],
  "7-7": ["That Tich"],
  "7-15": ["Vu Lan"],
  "8-15": ["Tet Trung Thu"],
  "12-23": ["Ong Cong Ong Tao"],
};

const elements = {
  heroDate: document.querySelector("#hero-date"),
  heroHighlight: document.querySelector("#hero-highlight"),
  balanceTotal: document.querySelector("#balance-total"),
  expenseTotal: document.querySelector("#expense-total"),
  upcomingCount: document.querySelector("#upcoming-count"),
  budgetTotal: document.querySelector("#budget-total"),
  netWorthTotal: document.querySelector("#net-worth-total"),
  financeSummary: document.querySelector("#finance-summary"),
  savingsOverview: document.querySelector("#savings-overview"),
  savingsInlineForm: document.querySelector("#savings-inline-form"),
  savingsHistoryPreview: document.querySelector("#savings-history-preview"),
  investmentGrid: document.querySelector("#investment-grid"),
  categoryBreakdown: document.querySelector("#category-breakdown"),
  transactionList: document.querySelector("#transaction-list"),
  todayEventCount: document.querySelector("#today-event-count"),
  notesCount: document.querySelector("#notes-count"),
  notesGrid: document.querySelector("#notes-grid"),
  transactionForm: document.querySelector("#transaction-form"),
  budgetForm: document.querySelector("#budget-form"),
  eventForm: document.querySelector("#event-form"),
  noteForm: document.querySelector("#note-form"),
  importButton: document.querySelector("#import-data"),
  importInput: document.querySelector("#import-data-file"),
  exportButton: document.querySelector("#export-data"),
  resetButton: document.querySelector("#reset-demo"),
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarRangeLabel: document.querySelector("#calendar-range-label"),
  calendarBody: document.querySelector("#calendar-body"),
  calendarPrev: document.querySelector("#calendar-prev"),
  calendarToday: document.querySelector("#calendar-today"),
  calendarNext: document.querySelector("#calendar-next"),
  dayModal: document.querySelector("#day-modal"),
  dayModalTitle: document.querySelector("#day-modal-title"),
  dayModalSubtitle: document.querySelector("#day-modal-subtitle"),
  dayModalHighlights: document.querySelector("#day-modal-highlights"),
  dayModalEvents: document.querySelector("#day-modal-events"),
  dayModalNotes: document.querySelector("#day-modal-notes"),
  dayModalEventCreate: document.querySelector("#day-modal-event-create"),
  dayModalNoteCreate: document.querySelector("#day-modal-note-create"),
  dayModalClose: document.querySelector("#day-modal-close"),
  moneyModal: document.querySelector("#money-modal"),
  moneyModalTitle: document.querySelector("#money-modal-title"),
  moneyModalSubtitle: document.querySelector("#money-modal-subtitle"),
  moneyModalContent: document.querySelector("#money-modal-content"),
  moneyModalClose: document.querySelector("#money-modal-close"),
  viewButtons: Array.from(document.querySelectorAll("[data-action='switch-view']")),
  moduleButtons: Array.from(document.querySelectorAll("[data-action='switch-module']")),
  moneyModule: document.querySelector("#module-money"),
  rhythmModule: document.querySelector("#module-rhythm"),
};

const today = stripTime(new Date());
const todayKey = toDateKey(today);

let state = loadState();
const ui = {
  activeModule: "money",
  calendarMode: "month",
  selectedDateKey: todayKey,
  viewAnchorDate: new Date(today),
  draggedEventId: "",
  currentDropDate: "",
  moneyModal: {
    kind: "",
    fundId: "",
  },
  moneyPanels: {
    savingsFormOpen: false,
    savingsHistoryOpen: false,
    fundForms: {},
    fundHistories: {},
    fundNavForms: {},
  },
};

bootstrap();

function bootstrap() {
  setDefaultFormValues();
  bindEvents();
  render();
}

function seedState() {
  const monday = startOfWeek(today);
  const dateAt = (offset) => toDateKey(addDays(today, offset));
  const weekDateAt = (offset) => toDateKey(addDays(monday, offset));

  return {
    budget: 6000000,
    money: createDefaultMoneyState(),
    transactions: [
      {
        id: createId(),
        type: "expense",
        amount: 58000,
        category: "An uong",
        date: dateAt(-1),
        note: "Bun bo + cafe sang",
      },
      {
        id: createId(),
        type: "expense",
        amount: 220000,
        category: "Di chuyen",
        date: dateAt(-2),
        note: "Do xang xe",
      },
      {
        id: createId(),
        type: "income",
        amount: 12000000,
        category: "Luong",
        date: dateAt(-3),
        note: "Luong thang",
      },
      {
        id: createId(),
        type: "expense",
        amount: 350000,
        category: "Hoc tap",
        date: dateAt(-4),
        note: "Khoa hoc online",
      },
      {
        id: createId(),
        type: "expense",
        amount: 145000,
        category: "Giai tri",
        date: dateAt(-6),
        note: "Xem phim + snack",
      },
    ],
    events: [
      {
        id: createId(),
        title: "Gym",
        tag: "Health",
        date: weekDateAt(0),
        startTime: "06:30",
        endTime: "07:45",
        detail: "Cardio va tap lung",
      },
      {
        id: createId(),
        title: "Deep work",
        tag: "Focus",
        date: weekDateAt(1),
        startTime: "09:00",
        endTime: "11:30",
        detail: "Lam project ca nhan",
      },
      {
        id: createId(),
        title: "Hoc tieng Anh",
        tag: "Study",
        date: weekDateAt(2),
        startTime: "19:30",
        endTime: "21:00",
        detail: "Speaking practice",
      },
      {
        id: createId(),
        title: "Cafe ban be",
        tag: "Social",
        date: weekDateAt(4),
        startTime: "20:00",
        endTime: "22:00",
        detail: "Hen o quan quen",
      },
    ],
    notes: [
      {
        id: createId(),
        type: "task",
        title: "Chot muc tieu tiet kiem",
        content: "Dat muc tieu 15% luong de vao quy du phong truoc ngay 05.",
        linkedDate: weekDateAt(1),
        pinned: true,
        done: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        type: "idea",
        title: "Y tuong side project",
        content: "Lam dashboard chi tieu co thong ke theo tuan va nudge mau sac.",
        linkedDate: weekDateAt(2),
        pinned: false,
        done: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: createId(),
        type: "journal",
        title: "Review tuan nay",
        content: "Tuan nay can ngu som hon, giam order do an va tang gio hoc.",
        linkedDate: weekDateAt(4),
        pinned: false,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function createDefaultMoneyState() {
  return {
    savings: createDefaultSavingsState(),
    funds: FUND_SEEDS.map((seed) => createDefaultFundState(seed)),
  };
}

function createDefaultSavingsState() {
  return {
    rateAnnual: 0.065,
    termMonths: 12,
    recurringDeposit: 2000000,
    startedOn: DEFAULT_SAVINGS_START,
    deposits: [],
  };
}

function createDefaultFundState(seed) {
  const averageBuyPrice = seed.averageBuyPrice || seed.initialNav;
  const units = seed.initialAmount / averageBuyPrice;
  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    subtitle: seed.subtitle,
    provider: seed.provider,
    source: seed.source,
    transactions: [
      {
        id: createId(),
        date: seed.navDate,
        amount: seed.initialAmount,
        nav: averageBuyPrice,
        units,
        note: "Khoi tao tu gia von trung binh",
        createdAt: toDateTime(seed.navDate, "12:00").toISOString(),
      },
    ],
    navHistory: [
      {
        id: createId(),
        date: seed.navDate,
        nav: seed.initialNav,
        source: seed.source,
        note: "Moc khoi tao tu Fmarket",
        createdAt: toDateTime(seed.navDate, "12:00").toISOString(),
      },
    ],
  };
}

function buildRecurringSavingsDeposits(startDateKey, amount, endDate) {
  const end = stripTime(new Date(endDate));
  const start = stripTime(fromDateKey(startDateKey));
  const deposits = [];

  if (start > end) {
    return deposits;
  }

  let cursor = new Date(start);
  while (cursor <= end) {
    const dateKey = toDateKey(cursor);
    deposits.push({
      id: createId(),
      date: dateKey,
      amount,
      note: "Gui dinh ky hang thang",
      createdAt: toDateTime(dateKey, "12:00").toISOString(),
    });
    cursor = addMonths(cursor, 1);
  }

  return deposits;
}

function loadState() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("life-ledger-state-v2") ||
      localStorage.getItem("life-ledger-state-v1");
    if (!raw) {
      const seeded = seedState();
      persist(seeded);
      return seeded;
    }

    const normalized = normalizeState(JSON.parse(raw));
    persist(normalized);
    return normalized;
  } catch (error) {
    const fallback = seedState();
    persist(fallback);
    return fallback;
  }
}

function normalizeState(parsed) {
  return {
    budget: Math.max(0, Number(parsed.budget) || 0),
    money: normalizeMoneyState(parsed.money),
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions.map((item) => ({
          id: item.id || createId(),
          type: item.type === "income" ? "income" : "expense",
          amount: Math.max(0, Number(item.amount) || 0),
          category: item.category || "",
          date: item.date || todayKey,
          note: item.note || "",
        }))
      : [],
    events: Array.isArray(parsed.events)
      ? parsed.events.map((item) => ({
          id: item.id || createId(),
          title: item.title || "",
          tag: EVENT_TAGS.includes(item.tag) ? item.tag : "Focus",
          date: item.date || todayKey,
          startTime: item.startTime || "09:00",
          endTime: item.endTime || "10:00",
          detail: item.detail || "",
        }))
      : [],
    notes: Array.isArray(parsed.notes)
      ? parsed.notes.map((item) => ({
          id: item.id || createId(),
          type: NOTE_TYPES.includes(item.type) ? item.type : "task",
          title: item.title || "",
          content: item.content || "",
          linkedDate: item.linkedDate || "",
          pinned: Boolean(item.pinned),
          done: Boolean(item.done),
          createdAt: item.createdAt || new Date().toISOString(),
        }))
      : [],
  };
}

function normalizeMoneyState(parsed) {
  const defaults = createDefaultMoneyState();
  const savings = parsed && typeof parsed === "object" ? parsed.savings : null;
  const funds = Array.isArray(parsed?.funds) ? parsed.funds : [];
  const savingsStartedOn = savings?.startedOn || defaults.savings.startedOn;
  const recurringDeposit =
    Number(savings?.recurringDeposit) > 0
      ? Math.round(Number(savings.recurringDeposit))
      : defaults.savings.recurringDeposit;
  const normalizedDeposits = Array.isArray(savings?.deposits)
    ? savings.deposits.map((item) => normalizeSavingsDeposit(item, recurringDeposit))
    : defaults.savings.deposits;

  return {
    savings: {
      rateAnnual: Number(savings?.rateAnnual) > 0 ? Number(savings.rateAnnual) : defaults.savings.rateAnnual,
      termMonths:
        Number(savings?.termMonths) > 0 ? Math.round(Number(savings.termMonths)) : defaults.savings.termMonths,
      recurringDeposit,
      startedOn: savingsStartedOn,
      deposits: shouldClearLegacySeededSavingsHistory(
        normalizedDeposits,
        savingsStartedOn,
        recurringDeposit
      )
        ? []
        : normalizedDeposits,
    },
    funds: FUND_SEEDS.map((seed) => {
      const parsedFund = funds.find((item) => item?.id === seed.id || item?.code === seed.code);
      return normalizeFundState(parsedFund, seed);
    }),
  };
}

function normalizeSavingsDeposit(item, fallbackAmount) {
  const dateKey = item?.date || todayKey;
  return {
    id: item?.id || createId(),
    date: dateKey,
    amount: Math.max(0, Number(item?.amount) || fallbackAmount || 0),
    note: item?.note || "",
    createdAt: item?.createdAt || toDateTime(dateKey, "12:00").toISOString(),
  };
}

function shouldClearLegacySeededSavingsHistory(deposits, startedOn, recurringDeposit) {
  if (!deposits.length) {
    return false;
  }

  const seededHistory = buildRecurringSavingsDeposits(startedOn, recurringDeposit, today);
  if (deposits.length !== seededHistory.length || !seededHistory.length) {
    return false;
  }

  return deposits.every((item, index) => {
    const seededItem = seededHistory[index];
    return (
      item.date === seededItem.date &&
      item.amount === seededItem.amount &&
      item.note === seededItem.note &&
      item.createdAt === seededItem.createdAt
    );
  });
}

function normalizeFundState(parsedFund, seed) {
  const defaultFund = createDefaultFundState(seed);
  const shouldReplaceLegacySeed = shouldReplaceLegacyFundSeed(parsedFund, seed);
  return {
    id: seed.id,
    code: seed.code,
    name: parsedFund?.name || seed.name,
    subtitle: parsedFund?.subtitle || seed.subtitle,
    provider: parsedFund?.provider || seed.provider,
    source: parsedFund?.source || seed.source,
    transactions: !shouldReplaceLegacySeed && Array.isArray(parsedFund?.transactions)
      ? parsedFund.transactions.map((item) => normalizeFundTransaction(item, seed))
      : defaultFund.transactions,
    navHistory: !shouldReplaceLegacySeed && Array.isArray(parsedFund?.navHistory)
      ? parsedFund.navHistory.map((item) => normalizeFundNav(item, seed))
      : defaultFund.navHistory,
  };
}

function normalizeFundTransaction(item, seed) {
  const dateKey = item?.date || seed.navDate;
  const nav = Number(item?.nav) > 0 ? Number(item.nav) : seed.averageBuyPrice || seed.initialNav;
  const amount = Math.max(0, Number(item?.amount) || 0);
  const fallbackUnits = nav ? amount / nav : 0;
  return {
    id: item?.id || createId(),
    date: dateKey,
    amount,
    nav,
    units: Number(item?.units) > 0 ? Number(item.units) : fallbackUnits,
    note: item?.note || "",
    createdAt: item?.createdAt || toDateTime(dateKey, "12:00").toISOString(),
  };
}

function normalizeFundNav(item, seed) {
  const dateKey = item?.date || seed.navDate;
  return {
    id: item?.id || createId(),
    date: dateKey,
    nav: Number(item?.nav) > 0 ? Number(item.nav) : seed.initialNav,
    source: item?.source || seed.source,
    note: item?.note || "",
    createdAt: item?.createdAt || toDateTime(dateKey, "12:00").toISOString(),
  };
}

function shouldReplaceLegacyFundSeed(parsedFund, seed) {
  if (!parsedFund || !Array.isArray(parsedFund.transactions) || !Array.isArray(parsedFund.navHistory)) {
    return false;
  }

  if (parsedFund.transactions.length !== 1 || parsedFund.navHistory.length !== 1) {
    return false;
  }

  const [transaction] = parsedFund.transactions;
  const [navEntry] = parsedFund.navHistory;
  const legacyAmounts = [seed.initialAmount];
  const legacyAveragePrices = [seed.averageBuyPrice || seed.initialNav];

  if (seed.id === "VMEEF") {
    legacyAmounts.push(10500000);
    legacyAveragePrices.push(17420);
  }

  const matchesLegacyAmount = legacyAmounts.some(
    (amount) => Math.abs((Number(transaction.amount) || 0) - amount) < 0.5
  );
  const matchesLegacyTransactionNav = [seed.initialNav, ...legacyAveragePrices].some(
    (nav) => Math.abs((Number(transaction.nav) || 0) - nav) < 0.00001
  );
  const matchesLegacyUnits = legacyAmounts.some((amount, index) => {
    const avgPrice = legacyAveragePrices[index] || seed.initialNav;
    const expectedUnits = amount / avgPrice;
    return Math.abs((Number(transaction.units) || 0) - expectedUnits) < 0.00001;
  });

  return (
    transaction.date === seed.navDate &&
    matchesLegacyAmount &&
    matchesLegacyTransactionNav &&
    matchesLegacyUnits &&
    navEntry.date === seed.navDate &&
    Math.abs((Number(navEntry.nav) || 0) - seed.initialNav) < 0.00001
  );
}

function persist(nextState = state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function setDefaultFormValues() {
  elements.transactionForm.date.value = todayKey;
  elements.eventForm.date.value = todayKey;
  elements.eventForm.startTime.value = "09:00";
  elements.eventForm.endTime.value = "10:00";
  elements.noteForm.linkedDate.value = "";
  elements.budgetForm.budget.value = state.budget;
}

function bindEvents() {
  elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
  elements.budgetForm.addEventListener("submit", handleBudgetSubmit);
  elements.eventForm.addEventListener("submit", handleEventSubmit);
  elements.noteForm.addEventListener("submit", handleNoteSubmit);
  elements.importButton.addEventListener("click", importData);
  elements.importInput.addEventListener("change", handleImportChange);
  elements.exportButton.addEventListener("click", exportData);
  elements.resetButton.addEventListener("click", resetToDemo);
  elements.calendarPrev.addEventListener("click", () => moveCalendar(-1));
  elements.calendarToday.addEventListener("click", jumpToToday);
  elements.calendarNext.addEventListener("click", () => moveCalendar(1));
  elements.dayModal.addEventListener("click", handleModalBackdropClick);
  elements.moneyModal.addEventListener("click", handleMoneyModalBackdropClick);
  document.addEventListener("click", handleActionClick);
  document.addEventListener("submit", handleDynamicFormSubmit);
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("dragstart", handleDragStart);
  document.addEventListener("dragend", handleDragEnd);
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("drop", handleDrop);
}

function handleActionClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action, id, date, view, kind, fund } = actionTarget.dataset;

  if (action === "switch-module") {
    const module = actionTarget.dataset.module;
    if (module) {
      ui.activeModule = module;
      renderModules();
    }
    return;
  }

  if (action === "switch-view" && view) {
    ui.calendarMode = view;
    ui.viewAnchorDate = fromDateKey(ui.selectedDateKey);
    ui.activeModule = "rhythm";
    renderModules();
    renderSchedule();
    return;
  }

  if (action === "open-day-modal" && date) {
    openDayModal(date);
    return;
  }

  if (action === "close-day-modal") {
    closeDayModal();
    return;
  }

  if (action === "toggle-savings-form") {
    ui.moneyPanels.savingsFormOpen = !ui.moneyPanels.savingsFormOpen;
    renderFinance();
    return;
  }

  if (action === "toggle-savings-history") {
    ui.moneyPanels.savingsHistoryOpen = !ui.moneyPanels.savingsHistoryOpen;
    renderFinance();
    return;
  }

  if (action === "toggle-fund-form" && fund) {
    ui.moneyPanels.fundForms[fund] = !ui.moneyPanels.fundForms[fund];
    renderFinance();
    return;
  }

  if (action === "toggle-fund-history" && fund) {
    ui.moneyPanels.fundHistories[fund] = !ui.moneyPanels.fundHistories[fund];
    renderFinance();
    return;
  }

  if (action === "toggle-fund-nav-form" && fund) {
    ui.moneyPanels.fundNavForms[fund] = !ui.moneyPanels.fundNavForms[fund];
    renderFinance();
    return;
  }

  if (action === "open-money-modal" && kind) {
    openMoneyModal(kind, fund || "");
    return;
  }

  if (action === "close-money-modal") {
    closeMoneyModal();
    return;
  }

  if (action === "delete-savings-deposit" && id) {
    state.money.savings.deposits = state.money.savings.deposits.filter((item) => item.id !== id);
    persist();
    render();
    return;
  }

  if (action === "delete-fund-transaction" && id && fund) {
    state.money.funds = state.money.funds.map((item) =>
      item.id === fund
        ? {
            ...item,
            transactions: item.transactions.filter((entry) => entry.id !== id),
          }
        : item
    );
    persist();
    render();
    return;
  }

  if (action === "delete-fund-nav" && id && fund) {
    state.money.funds = state.money.funds.map((item) =>
      item.id === fund
        ? {
            ...item,
            navHistory: item.navHistory.filter((entry) => entry.id !== id),
          }
        : item
    );
    persist();
    render();
    return;
  }

  if (!id) {
    return;
  }

  if (action === "delete-transaction") {
    state.transactions = state.transactions.filter((item) => item.id !== id);
  }

  if (action === "delete-event") {
    state.events = state.events.filter((item) => item.id !== id);
  }

  if (action === "delete-note") {
    state.notes = state.notes.filter((item) => item.id !== id);
  }

  if (action === "toggle-pin-note") {
    state.notes = state.notes.map((item) =>
      item.id === id ? { ...item, pinned: !item.pinned } : item
    );
  }

  if (action === "toggle-done-note") {
    state.notes = state.notes.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
  }

  persist();
  render();
}

function handleDynamicFormSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.form) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(form);
  const type = form.dataset.form;

  if (type === "savings-deposit") {
    const amount = Math.max(0, Number(formData.get("amount")) || 0);
    const dateKey = String(formData.get("date")) || todayKey;

    if (amount <= 0) {
      alert("So tien gui phai lon hon 0.");
      return;
    }

    state.money.savings.deposits.push({
      id: createId(),
      date: dateKey,
      amount,
      note: String(formData.get("note")).trim(),
      createdAt: new Date().toISOString(),
    });

    ui.moneyPanels.savingsFormOpen = false;
    ui.moneyPanels.savingsHistoryOpen = true;
    persist();
    render();
    return;
  }

  if (type === "fund-contribution") {
    const fundId = form.dataset.fund;
    const amount = Math.max(0, Number(formData.get("amount")) || 0);
    const nav = Number(formData.get("nav")) || 0;
    const dateKey = String(formData.get("date")) || todayKey;

    if (!fundId) {
      return;
    }

    if (amount <= 0 || nav <= 0) {
      alert("So tien nap va NAV deu phai lon hon 0.");
      return;
    }

    state.money.funds = state.money.funds.map((item) => {
      if (item.id !== fundId) {
        return item;
      }

      const nextTransaction = {
        id: createId(),
        date: dateKey,
        amount,
        nav,
        units: amount / nav,
        note: String(formData.get("note")).trim(),
        createdAt: new Date().toISOString(),
      };

      const hasMatchingNav = item.navHistory.some(
        (entry) => entry.date === dateKey && Math.abs(entry.nav - nav) < 0.00001
      );

      const nextNavHistory = hasMatchingNav
        ? item.navHistory
        : [
            ...item.navHistory,
            {
              id: createId(),
              date: dateKey,
              nav,
              source: "Nhap tay",
              note: "Tu dong them cung luc nap von",
              createdAt: new Date().toISOString(),
            },
          ];

      return {
        ...item,
        transactions: [...item.transactions, nextTransaction],
        navHistory: nextNavHistory,
      };
    });

    ui.moneyPanels.fundForms[fundId] = false;
    ui.moneyPanels.fundHistories[fundId] = true;
    persist();
    render();
    return;
  }

  if (type === "fund-nav-update") {
    const fundId = form.dataset.fund;
    const nav = Number(formData.get("nav")) || 0;
    const dateKey = String(formData.get("date")) || todayKey;

    if (!fundId) {
      return;
    }

    if (nav <= 0) {
      alert("NAV phai lon hon 0.");
      return;
    }

    state.money.funds = state.money.funds.map((item) =>
      item.id === fundId
        ? {
            ...item,
            navHistory: [
              ...item.navHistory,
              {
                id: createId(),
                date: dateKey,
                nav,
                source: String(formData.get("source")).trim() || "Nhap tay",
                note: String(formData.get("note")).trim(),
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : item
    );

    ui.moneyPanels.fundHistories[fundId] = true;
    ui.moneyPanels.fundNavForms[fundId] = false;
    persist();
    render();
    return;
  }

  if (type === "edit-event") {
    const id = form.dataset.id;
    if (!id) {
      return;
    }

    const nextEvent = {
      id,
      title: String(formData.get("title")).trim(),
      tag: String(formData.get("tag")),
      date: String(formData.get("date")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      detail: String(formData.get("detail")).trim(),
    };

    if (!validateEvent(nextEvent)) {
      return;
    }

    state.events = state.events.map((item) => (item.id === id ? nextEvent : item));
  }

  if (type === "create-event") {
    const nextEvent = {
      id: createId(),
      title: String(formData.get("title")).trim(),
      tag: String(formData.get("tag")),
      date: String(formData.get("date")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      detail: String(formData.get("detail")).trim(),
    };

    if (!validateEvent(nextEvent)) {
      return;
    }

    state.events.push(nextEvent);
    form.reset();
    form.date.value = ui.selectedDateKey;
    form.startTime.value = "09:00";
    form.endTime.value = "10:00";
  }

  if (type === "edit-note") {
    const id = form.dataset.id;
    if (!id) {
      return;
    }

    const nextNote = {
      id,
      type: String(formData.get("type")),
      title: String(formData.get("title")).trim(),
      content: String(formData.get("content")).trim(),
      linkedDate: String(formData.get("linkedDate")),
      pinned: formData.get("pinned") === "on",
      done: formData.get("done") === "on",
      createdAt:
        state.notes.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
    };

    if (!validateNote(nextNote)) {
      return;
    }

    state.notes = state.notes.map((item) => (item.id === id ? nextNote : item));
  }

  if (type === "create-note") {
    const nextNote = {
      id: createId(),
      type: String(formData.get("type")),
      title: String(formData.get("title")).trim(),
      content: String(formData.get("content")).trim(),
      linkedDate: String(formData.get("linkedDate")),
      pinned: false,
      done: false,
      createdAt: new Date().toISOString(),
    };

    if (!validateNote(nextNote)) {
      return;
    }

    state.notes.unshift(nextNote);
    form.reset();
    form.linkedDate.value = ui.selectedDateKey;
  }

  persist();
  render();
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    if (!elements.moneyModal.hidden) {
      closeMoneyModal();
      return;
    }

    if (!elements.dayModal.hidden) {
      closeDayModal();
    }
  }
}

function handleModalBackdropClick(event) {
  if (event.target === elements.dayModal) {
    closeDayModal();
  }
}

function handleMoneyModalBackdropClick(event) {
  if (event.target === elements.moneyModal) {
    closeMoneyModal();
  }
}

function handleDragStart(event) {
  const item = event.target.closest("[data-drag-event-id]");
  if (!item) {
    return;
  }

  ui.draggedEventId = item.dataset.dragEventId || "";
  item.classList.add("is-dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ui.draggedEventId);
  }
}

function handleDragEnd(event) {
  const item = event.target.closest("[data-drag-event-id]");
  if (item) {
    item.classList.remove("is-dragging");
  }

  ui.draggedEventId = "";
  clearDropTargets();
}

function handleDragOver(event) {
  const zone = event.target.closest("[data-drop-date]");
  if (!zone || !ui.draggedEventId) {
    return;
  }

  event.preventDefault();
  const dropDate = zone.dataset.dropDate || "";
  if (dropDate !== ui.currentDropDate) {
    clearDropTargets();
    ui.currentDropDate = dropDate;
    zone.classList.add("is-drop-target");
  }
}

function handleDrop(event) {
  const zone = event.target.closest("[data-drop-date]");
  if (!zone || !ui.draggedEventId) {
    return;
  }

  event.preventDefault();
  const dropDate = zone.dataset.dropDate || "";
  clearDropTargets();

  state.events = state.events.map((item) =>
    item.id === ui.draggedEventId ? { ...item, date: dropDate } : item
  );

  ui.selectedDateKey = dropDate;
  ui.viewAnchorDate = fromDateKey(dropDate);
  ui.draggedEventId = "";
  persist();
  render();
}

function clearDropTargets() {
  document.querySelectorAll(".is-drop-target").forEach((item) => {
    item.classList.remove("is-drop-target");
  });
  ui.currentDropDate = "";
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const amount = Number(formData.get("amount"));

  if (amount <= 0) {
    alert("So tien phai lon hon 0.");
    return;
  }

  state.transactions.unshift({
    id: createId(),
    type: String(formData.get("type")),
    amount,
    category: String(formData.get("category")).trim(),
    date: String(formData.get("date")),
    note: String(formData.get("note")).trim(),
  });

  persist();
  ui.activeModule = "money";
  event.currentTarget.reset();
  event.currentTarget.date.value = todayKey;
  render();
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.budget = Math.max(0, Number(formData.get("budget")) || 0);
  persist();
  render();
}

function handleEventSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const nextEvent = {
    id: createId(),
    title: String(formData.get("title")).trim(),
    tag: String(formData.get("tag")),
    date: String(formData.get("date")),
    startTime: String(formData.get("startTime")),
    endTime: String(formData.get("endTime")),
    detail: String(formData.get("detail")).trim(),
  };

  if (!validateEvent(nextEvent)) {
    return;
  }

  state.events.push(nextEvent);
  ui.activeModule = "rhythm";
  ui.selectedDateKey = nextEvent.date;
  ui.viewAnchorDate = fromDateKey(nextEvent.date);
  persist();
  event.currentTarget.reset();
  event.currentTarget.date.value = todayKey;
  event.currentTarget.startTime.value = "09:00";
  event.currentTarget.endTime.value = "10:00";
  render();
}

function handleNoteSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const nextNote = {
    id: createId(),
    type: String(formData.get("type")),
    title: String(formData.get("title")).trim(),
    content: String(formData.get("content")).trim(),
    linkedDate: String(formData.get("linkedDate")),
    pinned: false,
    done: false,
    createdAt: new Date().toISOString(),
  };

  if (!validateNote(nextNote)) {
    return;
  }

  state.notes.unshift(nextNote);
  ui.activeModule = "rhythm";

  if (nextNote.linkedDate) {
    ui.selectedDateKey = nextNote.linkedDate;
    ui.viewAnchorDate = fromDateKey(nextNote.linkedDate);
  }

  persist();
  event.currentTarget.reset();
  event.currentTarget.linkedDate.value = "";
  render();
}

function validateEvent(item) {
  if (!item.title) {
    alert("Tieu de su kien khong duoc de trong.");
    return false;
  }

  if (item.endTime <= item.startTime) {
    alert("Gio ket thuc phai lon hon gio bat dau.");
    return false;
  }

  return true;
}

function validateNote(item) {
  if (!item.title || !item.content) {
    alert("Note can co tieu de va noi dung.");
    return false;
  }

  return true;
}

function moveCalendar(direction) {
  const anchor = new Date(ui.viewAnchorDate);

  if (ui.calendarMode === "month") {
    ui.viewAnchorDate = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
    renderSchedule();
    return;
  }

  if (ui.calendarMode === "week") {
    ui.viewAnchorDate = addDays(anchor, direction * 7);
    ui.selectedDateKey = toDateKey(ui.viewAnchorDate);
  }

  if (ui.calendarMode === "day") {
    ui.viewAnchorDate = addDays(anchor, direction);
    ui.selectedDateKey = toDateKey(ui.viewAnchorDate);
  }

  render();
}

function jumpToToday() {
  ui.selectedDateKey = todayKey;
  ui.viewAnchorDate = new Date(today);
  render();
}

function openDayModal(dateKey) {
  ui.activeModule = "rhythm";
  ui.selectedDateKey = dateKey;
  ui.viewAnchorDate = fromDateKey(dateKey);
  renderModules();
  renderSchedule();
  renderDayModal();
  elements.dayModal.hidden = false;
  document.body.classList.add("modal-open");
  elements.dayModalClose.focus();
}

function closeDayModal() {
  elements.dayModal.hidden = true;
  if (elements.moneyModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function openMoneyModal(kind, fundId = "") {
  ui.activeModule = "money";
  ui.moneyModal = {
    kind,
    fundId,
  };
  renderModules();
  renderFinance();
  renderMoneyModal();
  elements.moneyModal.hidden = false;
  document.body.classList.add("modal-open");
  elements.moneyModalClose.focus();
}

function closeMoneyModal() {
  ui.moneyModal = {
    kind: "",
    fundId: "",
  };
  elements.moneyModal.hidden = true;
  if (elements.dayModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function render() {
  renderModules();
  renderHeader();
  renderFinance();
  renderSchedule();
  renderNotes();
  renderDayModal();
  renderMoneyModal();
}

function renderModules() {
  const isMoney = ui.activeModule === "money";
  elements.moneyModule.hidden = !isMoney;
  elements.rhythmModule.hidden = isMoney;

  elements.moduleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.module === ui.activeModule);
  });
}

function renderHeader() {
  const sortedUpcoming = getUpcomingEvents();
  const totals = getFinanceTotals();

  if (elements.heroDate && elements.heroHighlight) {
    elements.heroDate.textContent = capitalize(fullDate.format(today));
    elements.heroHighlight.textContent = sortedUpcoming.length
      ? `${sortedUpcoming[0].title} luc ${sortedUpcoming[0].startTime} ngay ${shortDate.format(
          fromDateKey(sortedUpcoming[0].date)
        )}. ${sortedUpcoming[0].detail || "Nho chuan bi som de di dung gio."}`
      : "Chua co lich sap toi. Nho them ke hoach moi nha.";
  }

  if (elements.balanceTotal) {
    elements.balanceTotal.textContent = formatMoney(totals.balance);
  }

  if (elements.expenseTotal) {
    elements.expenseTotal.textContent = formatMoney(totals.expenseMonth);
  }

  if (elements.upcomingCount) {
    elements.upcomingCount.textContent = `${sortedUpcoming.length} muc`;
  }

  if (elements.budgetTotal) {
    elements.budgetTotal.textContent = formatMoney(state.budget);
  }
}

function renderFinance() {
  const snapshot = getMoneySnapshot();
  const totals = getFinanceTotals();
  const budgetLeft = state.budget - totals.expenseMonth;
  const budgetProgress = state.budget
    ? Math.min(100, Math.round((totals.expenseMonth / state.budget) * 100))
    : 0;
  const budgetTone = budgetLeft < 0 ? "negative" : "";

  elements.netWorthTotal.textContent = formatMoney(snapshot.netWorth);

  elements.financeSummary.innerHTML = [
    summaryPill("Tong tai san", formatMoney(snapshot.netWorth)),
    summaryPill("Lai/lo hom nay", formatSignedMoney(snapshot.todayDelta), getTone(snapshot.todayDelta)),
    summaryPill("So tiet kiem", formatMoney(snapshot.savings.currentValue)),
    summaryPill("Danh muc quy", formatMoney(snapshot.investmentsValue)),
  ].join("");

  elements.savingsOverview.innerHTML = [
    renderAssetMetric(
      "Tong goc",
      formatMoney(snapshot.savings.principal),
      `${snapshot.savings.depositCount} lan gui`
    ),
    renderAssetMetric(
      "Lai tich luy",
      formatMoney(snapshot.savings.accruedInterest),
      `Ky han ${state.money.savings.termMonths} thang`,
      getTone(snapshot.savings.accruedInterest)
    ),
    renderAssetMetric(
      "Gia tri tam tinh",
      formatMoney(snapshot.savings.currentValue),
      snapshot.savings.nextMaturityDate
        ? `Dao han som nhat ${shortDate.format(fromDateKey(snapshot.savings.nextMaturityDate))}`
        : "Chua co lot nao den ngay dao han"
    ),
    renderAssetMetric(
      "Lai hom nay",
      formatSignedMoney(snapshot.savings.dailyInterest),
      "Tinh tren cac lot con han",
      getTone(snapshot.savings.dailyInterest)
    ),
    renderAssetMetric(
      "Lan gui tiep",
      shortDate.format(fromDateKey(snapshot.savings.nextDepositDate)),
      `Dinh ky ${formatMoney(state.money.savings.recurringDeposit)}/thang`
    ),
    renderAssetMetric(
      "Con lai budget",
      formatMoney(budgetLeft),
      `Da dung ${budgetProgress}% budget`,
      budgetTone
    ),
  ].join("");

  elements.savingsInlineForm.innerHTML = ui.moneyPanels.savingsFormOpen
    ? renderSavingsInlineForm()
    : "";

  elements.savingsHistoryPreview.innerHTML = ui.moneyPanels.savingsHistoryOpen
    ? renderSavingsInlineHistory(snapshot.savings)
    : "";

  elements.investmentGrid.innerHTML = snapshot.funds.map((item) => renderFundCard(item)).join("");

  const categoryTotals = getCategoryBreakdown();
  renderCollection(
    elements.categoryBreakdown,
    categoryTotals,
    (item, index, list) => {
      const biggest = list[0]?.amount || 1;
      const width = Math.max(12, Math.round((item.amount / biggest) * 100));

      return `
        <article class="breakdown-item">
          <header>
            <strong>${escapeHtml(item.category)}</strong>
            <span>${formatMoney(item.amount)}</span>
          </header>
          <div class="amount-bar"><span style="width:${width}%"></span></div>
        </article>
      `;
    },
    "Chua co muc chi nao trong thang nay."
  );

  const recentTransactions = [...state.transactions].sort(sortByDateDesc).slice(0, 6);
  renderCollection(
    elements.transactionList,
    recentTransactions,
    (item) => {
      const isIncome = item.type === "income";
      return `
        <article class="list-item">
          <header>
            <div>
              <span class="tag ${isIncome ? "warm" : ""}">${isIncome ? "Thu" : "Chi"}</span>
              <strong>${escapeHtml(item.category)}</strong>
            </div>
            <div class="item-actions">
              <button class="tiny-button" data-action="delete-transaction" data-id="${item.id}" type="button">Xoa</button>
            </div>
          </header>
          <div class="list-meta">
            <div>${formatMoney(isIncome ? item.amount : -item.amount)}</div>
            <div>${shortDate.format(fromDateKey(item.date))}${item.note ? ` | ${escapeHtml(item.note)}` : ""}</div>
          </div>
        </article>
      `;
    },
    "Chua co giao dich nao."
  );
}

function renderMoneyModal() {
  if (!ui.moneyModal.kind) {
    elements.moneyModalContent.innerHTML = "";
    return;
  }

  const snapshot = getMoneySnapshot();

  if (ui.moneyModal.kind === "savings") {
    const savings = snapshot.savings;
    elements.moneyModalTitle.textContent = "So tiet kiem 12 thang";
    elements.moneyModalSubtitle.textContent = `Cau hinh muc gui ${formatMoney(
      state.money.savings.recurringDeposit
    )}/thang tu ${compactDate.format(
      fromDateKey(state.money.savings.startedOn)
    )}. Lai chi tinh theo cac lan gui ban da nhap.`;
    elements.moneyModalContent.innerHTML = renderSavingsModal(savings);
    return;
  }

  if (ui.moneyModal.kind === "fund") {
    const fundSnapshot = snapshot.funds.find((item) => item.id === ui.moneyModal.fundId);
    if (!fundSnapshot) {
      elements.moneyModalTitle.textContent = "Khong tim thay quy";
      elements.moneyModalSubtitle.textContent = "Ban thu dong popup va mo lai nhe.";
      elements.moneyModalContent.innerHTML = renderEmptyState("Quy nay hien khong ton tai.");
      return;
    }

    elements.moneyModalTitle.textContent = `${fundSnapshot.code} | Quan ly quy`;
    elements.moneyModalSubtitle.textContent = fundSnapshot.latestNavDate
      ? `NAV gan nhat ${formatNav(fundSnapshot.currentNav)} cap nhat ngay ${compactDate.format(
          fromDateKey(fundSnapshot.latestNavDate)
        )}.`
      : "Chua co moc NAV nao duoc luu.";
    elements.moneyModalContent.innerHTML = renderFundModal(fundSnapshot);
  }
}

function renderSavingsModal(snapshot) {
  const savingsMetrics = [
    renderAssetMetric("Tong goc", formatMoney(snapshot.principal), `${snapshot.depositCount} lan gui`),
    renderAssetMetric(
      "Lai tich luy",
      formatMoney(snapshot.accruedInterest),
      "Cap nhat theo tung ngay",
      getTone(snapshot.accruedInterest)
    ),
    renderAssetMetric(
      "Lai hom nay",
      formatSignedMoney(snapshot.dailyInterest),
      "Chi tinh cho cac lot con han",
      getTone(snapshot.dailyInterest)
    ),
    renderAssetMetric(
      "Lan gui tiep",
      compactDate.format(fromDateKey(snapshot.nextDepositDate)),
      `Muc dinh ky ${formatMoney(state.money.savings.recurringDeposit)}`
    ),
  ].join("");

  const history = snapshot.allDeposits
    .map(
      (item) => `
        <article class="history-item">
          <header>
            <div>
              <strong>${compactDate.format(fromDateKey(item.date))}</strong>
              <div class="history-meta">
                <span>${formatMoney(item.amount)}</span>
                <span>Lai tam tinh ${formatMoney(item.accruedInterest)}</span>
                <span>Dao han ${compactDate.format(fromDateKey(item.maturityDate))}</span>
              </div>
            </div>
            <div class="item-actions">
              <button
                class="tiny-button"
                data-action="delete-savings-deposit"
                data-id="${item.id}"
                type="button"
              >
                Xoa
              </button>
            </div>
          </header>
          ${
            item.note
              ? `<p>${escapeHtml(item.note)}</p>`
              : `<p>${item.isMatured ? "Lot nay da het ky han 12 thang." : "Lot nay dang tiep tuc tinh lai den ngay dao han."}</p>`
          }
        </article>
      `
    )
    .join("");

  return `
    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Tong quan nhanh</h3>
        <span class="hint">Nhin duoc goc, lai va moc gui tiep theo.</span>
      </div>
      <div class="asset-metrics-grid">${savingsMetrics}</div>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Gui them vao so</h3>
        <span class="hint">Nhap tung lan gui thuc te, ke ca lich su cu neu can.</span>
      </div>
      <form data-form="savings-deposit" class="editor-card">
        <div class="editor-grid three">
          <label>
            Ngay gui
            <input name="date" type="date" value="${todayKey}" required />
          </label>
          <label>
            So tien
            <input
              name="amount"
              type="number"
              min="0"
              step="1000"
              value="${state.money.savings.recurringDeposit}"
              required
            />
          </label>
          <label>
            Ghi chu
            <input
              name="note"
              type="text"
              maxlength="80"
              placeholder="gui them, bo sung lich su..."
            />
          </label>
        </div>
        <div class="editor-actions">
          <span class="hint">Muc moi se duoc dua vao tinh lai ngay lap tuc.</span>
          <button class="primary-button" type="submit">Luu lan gui</button>
        </div>
      </form>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Lich su gui</h3>
        <span class="hint">Sap xep moi nhat len truoc, ban co the xoa neu nhap nham.</span>
      </div>
      <div class="editor-stack">
        ${history || renderEmptyState("Chua co lan gui nao. Hay nhap lich su thuc te de tinh lai dung hon.")}
      </div>
    </section>
  `;
}

function renderFundModal(snapshot) {
  const summaryMetrics = [
    renderAssetMetric("Von da nap", formatMoney(snapshot.investedCapital), `${snapshot.transactionCount} lan nap`),
    renderAssetMetric("So CCQ", formatUnits(snapshot.totalUnits), "Tinh tu lich su nap va NAV mua"),
    renderAssetMetric(
      "Gia von TB",
      snapshot.averageBuyPrice ? formatNav(snapshot.averageBuyPrice) : "Chua co",
      "Lay theo gia trung binh ban da mua"
    ),
    renderAssetMetric(
      "Gia tri hien tai",
      formatMoney(snapshot.currentValue),
      snapshot.latestNavDate
        ? `Theo NAV ${compactDate.format(fromDateKey(snapshot.latestNavDate))}`
        : "Can them NAV de tinh gia tri"
    ),
    renderAssetMetric(
      "Lai/lo tong",
      formatSignedMoney(snapshot.totalPnL),
      "Gia tri hien tai tru von da nap",
      getTone(snapshot.totalPnL)
    ),
    renderAssetMetric(
      "Lai/lo hom nay",
      formatSignedMoney(snapshot.todayPnL),
      snapshot.previousNavDate
        ? `So voi moc ${compactDate.format(fromDateKey(snapshot.previousNavDate))}`
        : "Can toi thieu 2 moc NAV de co so nay",
      getTone(snapshot.todayPnL)
    ),
    renderAssetMetric(
      "NAV gan nhat",
      snapshot.latestNavDate ? formatNav(snapshot.currentNav) : "Chua co",
      snapshot.latestNavDate
        ? `${snapshot.latestNavSource || "Nhap tay"} | ${compactDate.format(
            fromDateKey(snapshot.latestNavDate)
          )}`
        : "Them NAV moi de cap nhat gia tri"
    ),
  ].join("");

  const contributionHistory = snapshot.allTransactions
    .map(
      (item) => `
        <article class="history-item">
          <header>
            <div>
              <strong>${compactDate.format(fromDateKey(item.date))}</strong>
              <div class="history-meta">
                <span>${formatMoney(item.amount)}</span>
                <span>${formatUnits(item.units)}</span>
                <span>${formatNav(item.nav)}</span>
              </div>
            </div>
            <div class="item-actions">
              <button
                class="tiny-button"
                data-action="delete-fund-transaction"
                data-id="${item.id}"
                data-fund="${snapshot.id}"
                type="button"
              >
                Xoa
              </button>
            </div>
          </header>
          <p>${escapeHtml(item.note || "Lan nap duoc quy doi thanh so CCQ theo NAV cua ngay nap.")}</p>
        </article>
      `
    )
    .join("");

  const navHistory = snapshot.allNavs
    .map(
      (item) => `
        <article class="history-item">
          <header>
            <div>
              <strong>${compactDate.format(fromDateKey(item.date))}</strong>
              <div class="history-meta">
                <span>${formatNav(item.nav)}</span>
                <span>${escapeHtml(item.source || "Nhap tay")}</span>
              </div>
            </div>
            <div class="item-actions">
              <button
                class="tiny-button"
                data-action="delete-fund-nav"
                data-id="${item.id}"
                data-fund="${snapshot.id}"
                type="button"
              >
                Xoa
              </button>
            </div>
          </header>
          <p>${escapeHtml(item.note || "Moc NAV nay duoc dung de cap nhat gia tri quy theo thi truong.")}</p>
        </article>
      `
    )
    .join("");

  return `
    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Tong quan quy</h3>
        <span class="hint">${escapeHtml(snapshot.subtitle)}</span>
      </div>
      <div class="asset-metrics-grid">${summaryMetrics}</div>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Nap them vao quy</h3>
        <span class="hint">So CCQ duoc tinh bang so tien chia cho NAV ban nhap.</span>
      </div>
      <form data-form="fund-contribution" data-fund="${snapshot.id}" class="editor-card">
        <div class="editor-grid three">
          <label>
            Ngay nap
            <input name="date" type="date" value="${todayKey}" required />
          </label>
          <label>
            So tien
            <input name="amount" type="number" min="0" step="1000" required />
          </label>
          <label>
            NAV mua
            <input
              name="nav"
              type="number"
              min="0"
              step="0.01"
              value="${snapshot.currentNav ? snapshot.currentNav.toFixed(2) : ""}"
              required
            />
          </label>
        </div>
        <label>
          Ghi chu
          <input
            name="note"
            type="text"
            maxlength="100"
            placeholder="nap them, bo sung lich su..."
          />
        </label>
        <div class="editor-actions">
          <span class="hint">Neu ban nap ngay hom nay, co the giu nguyen NAV mac dinh.</span>
          <button class="primary-button" type="submit">Luu lan nap</button>
        </div>
      </form>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Cap nhat NAV</h3>
        <span class="hint">Web local khong keo du lieu tu Fmarket tu dong, nen ban chi can nhap moc moi vao day.</span>
      </div>
      <form data-form="fund-nav-update" data-fund="${snapshot.id}" class="editor-card">
        <div class="editor-grid three">
          <label>
            Ngay NAV
            <input name="date" type="date" value="${todayKey}" required />
          </label>
          <label>
            NAV
            <input
              name="nav"
              type="number"
              min="0"
              step="0.01"
              value="${snapshot.currentNav ? snapshot.currentNav.toFixed(2) : ""}"
              required
            />
          </label>
          <label>
            Nguon
            <input name="source" type="text" maxlength="40" value="Fmarket" />
          </label>
        </div>
        <label>
          Ghi chu
          <input
            name="note"
            type="text"
            maxlength="100"
            placeholder="cap nhat moi nhat tu thi truong..."
          />
        </label>
        <div class="editor-actions">
          <span class="hint">Moi moc NAV moi se cap nhat lai gia tri quy va lai/lo.</span>
          <button class="primary-button" type="submit">Luu NAV</button>
        </div>
      </form>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Lich su nap</h3>
        <span class="hint">Ban co the bo sung cac muc da nap truoc do vao day.</span>
      </div>
      <div class="editor-stack">
        ${contributionHistory || renderEmptyState("Chua co lan nap nao.")}
      </div>
    </section>

    <section class="glass-subcard content-panel">
      <div class="section-title-row">
        <h3>Lich su NAV</h3>
        <span class="hint">Day la cac moc gia dung de tinh lai/lo cua quy.</span>
      </div>
      <div class="editor-stack">
        ${navHistory || renderEmptyState("Chua co moc NAV nao.")}
      </div>
    </section>
  `;
}

function getMoneySnapshot() {
  const totals = getFinanceTotals();
  const savings = getSavingsSnapshot(state.money.savings);
  const funds = state.money.funds.map((item) => getFundSnapshot(item));
  const investmentsValue = funds.reduce((sum, item) => sum + item.currentValue, 0);
  const todayDelta = savings.dailyInterest + funds.reduce((sum, item) => sum + item.todayPnL, 0);

  return {
    cashBalance: totals.balance,
    savings,
    funds,
    investmentsValue,
    todayDelta,
    netWorth: totals.balance + savings.currentValue + investmentsValue,
  };
}

function getSavingsSnapshot(savings) {
  const allDeposits = [...savings.deposits]
    .map((item) => {
      const depositDate = fromDateKey(item.date);
      const maturityDate = addMonths(depositDate, savings.termMonths);
      const activeEnd = today < maturityDate ? today : maturityDate;
      const accruedDays = depositDate < activeEnd ? dayDiff(depositDate, activeEnd) : 0;
      const accruedInterest = item.amount * savings.rateAnnual * (accruedDays / 365);
      const isMatured = today >= maturityDate;

      return {
        ...item,
        maturityDate: toDateKey(maturityDate),
        accruedDays,
        accruedInterest,
        isMatured,
      };
    })
    .sort(sortByEntryDateDesc);

  const principal = allDeposits.reduce((sum, item) => sum + item.amount, 0);
  const accruedInterest = allDeposits.reduce((sum, item) => sum + item.accruedInterest, 0);
  const dailyInterest = allDeposits.reduce((sum, item) => {
    if (item.isMatured || fromDateKey(item.date) > today) {
      return sum;
    }

    return sum + (item.amount * savings.rateAnnual) / 365;
  }, 0);

  const nextMaturityDate = [...allDeposits]
    .filter((item) => !item.isMatured)
    .sort((left, right) => fromDateKey(left.maturityDate) - fromDateKey(right.maturityDate))[0]
    ?.maturityDate;

  return {
    principal,
    accruedInterest,
    currentValue: principal + accruedInterest,
    dailyInterest,
    depositCount: allDeposits.length,
    nextDepositDate: getNextRecurringDepositDate(savings.startedOn, today),
    nextMaturityDate,
    previewDeposits: allDeposits.slice(0, 4).map((item) => ({
      title: compactDate.format(fromDateKey(item.date)),
      value: formatMoney(item.amount),
      meta: `Lai tam tinh ${formatMoney(item.accruedInterest)} | Dao han ${compactDate.format(
        fromDateKey(item.maturityDate)
      )}`,
      note: item.note,
    })),
    allDeposits,
  };
}

function getFundSnapshot(fund) {
  const allTransactions = [...fund.transactions].sort(sortByEntryDateDesc);
  const allNavs = [...fund.navHistory].sort(sortByEntryDateDesc);
  const latestNavEntry = allNavs[0] || null;
  const previousNavEntry = allNavs[1] || null;
  const investedCapital = allTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalUnits = allTransactions.reduce((sum, item) => sum + item.units, 0);
  const averageBuyPrice = totalUnits > 0 ? investedCapital / totalUnits : 0;
  const currentNav = latestNavEntry?.nav || 0;
  const currentValue = totalUnits * currentNav;
  const todayPnL =
    latestNavEntry && previousNavEntry ? totalUnits * (latestNavEntry.nav - previousNavEntry.nav) : 0;
  const totalPnL = currentValue - investedCapital;

  return {
    ...fund,
    investedCapital,
    totalUnits,
    averageBuyPrice,
    currentNav,
    currentValue,
    todayPnL,
    totalPnL,
    latestNavDate: latestNavEntry?.date || "",
    latestNavSource: latestNavEntry?.source || "",
    previousNavDate: previousNavEntry?.date || "",
    transactionCount: allTransactions.length,
    previewTransactions: allTransactions.slice(0, 3).map((item) => ({
      title: compactDate.format(fromDateKey(item.date)),
      value: formatMoney(item.amount),
      meta: `${formatUnits(item.units)} | ${formatNav(item.nav)}`,
      note: item.note,
    })),
    allTransactions,
    allNavs,
  };
}

function renderFundCard(snapshot) {
  const fundForm = ui.moneyPanels.fundForms[snapshot.id] ? renderFundInlineForm(snapshot) : "";
  const fundHistory = ui.moneyPanels.fundHistories[snapshot.id] ? renderFundInlineHistory(snapshot) : "";

  return `
    <article class="glass-subcard asset-card fund-card">
      <div class="asset-main">
        <div class="asset-side">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Dau tu</p>
              <h3>${escapeHtml(snapshot.code)}</h3>
            </div>
            <span class="tag warm">${escapeHtml(snapshot.provider)}</span>
          </div>
          <p class="fund-caption">${escapeHtml(snapshot.subtitle)}. Gia von TB duoc seed theo thong tin ban da cung cap, NAV hien tai lay theo Fmarket ngay 30/03/2026.</p>
          <div class="asset-action-row">
            <button
              class="primary-button"
              data-action="toggle-fund-form"
              data-fund="${snapshot.id}"
              type="button"
            >
              Nap
            </button>
            <button
              class="ghost-button"
              data-action="toggle-fund-history"
              data-fund="${snapshot.id}"
              type="button"
            >
              Lich su
            </button>
          </div>
          ${fundForm}
        </div>

        <div class="asset-body">
          <div class="asset-metrics-grid">
            ${renderAssetMetric("Von da nap", formatMoney(snapshot.investedCapital), `${snapshot.transactionCount} lan nap`)}
            ${renderAssetMetric("So CCQ", formatUnits(snapshot.totalUnits), "Co the thay doi khi ban nap them")}
            ${renderAssetMetric(
              "Gia von TB",
              snapshot.averageBuyPrice ? formatNav(snapshot.averageBuyPrice) : "Chua co",
              "Lai/lo duoc tinh tren gia von nay"
            )}
            ${renderAssetMetric(
              "Gia tri hien tai",
              formatMoney(snapshot.currentValue),
              snapshot.latestNavDate
                ? `Theo NAV ${compactDate.format(fromDateKey(snapshot.latestNavDate))}`
                : "Can them NAV moi"
            )}
            ${renderAssetMetric(
              "Lai/lo tong",
              formatSignedMoney(snapshot.totalPnL),
              "Gia tri hien tai tru von da nap",
              getTone(snapshot.totalPnL)
            )}
            ${renderAssetMetric(
              "Lai/lo hom nay",
              formatSignedMoney(snapshot.todayPnL),
              snapshot.previousNavDate
                ? `So voi moc ${compactDate.format(fromDateKey(snapshot.previousNavDate))}`
                : "Can 2 moc NAV tro len",
              getTone(snapshot.todayPnL)
            )}
            ${renderAssetMetric(
              "NAV gan nhat",
              snapshot.latestNavDate ? formatNav(snapshot.currentNav) : "Chua co",
              snapshot.latestNavDate
                ? `${snapshot.latestNavSource || "Nhap tay"} | ${compactDate.format(
                    fromDateKey(snapshot.latestNavDate)
                  )}`
                : "Them moc NAV de cap nhat gia tri"
            )}
          </div>
          ${fundHistory}
        </div>
      </div>
    </article>
  `;
}

function renderSavingsInlineForm() {
  return `
    <section class="glass-strip asset-inline-panel">
      <div class="section-title-row">
        <h4>Them lan gui</h4>
        <span class="hint">Nhap ngay, so tien va ghi chu ngay trong card.</span>
      </div>
      <form data-form="savings-deposit" class="editor-grid three inline-money-form">
        <label>
          Ngay gui
          <input name="date" type="date" value="${todayKey}" required />
        </label>
        <label>
          So tien
          <input
            name="amount"
            type="number"
            min="0"
            step="1000"
            value="${state.money.savings.recurringDeposit}"
            required
          />
        </label>
        <label class="inline-money-form-note">
          Ghi chu
          <input
            name="note"
            type="text"
            maxlength="80"
            placeholder="lan 1, bo sung lich su..."
          />
        </label>
        <div class="inline-money-submit">
          <button class="primary-button" type="submit">Luu lan gui</button>
        </div>
      </form>
    </section>
  `;
}

function renderSavingsInlineHistory(snapshot) {
  const history = snapshot.allDeposits.length
    ? snapshot.allDeposits
        .map(
          (item) => `
            <article class="history-item">
              <header>
                <div>
                  <strong>${compactDate.format(fromDateKey(item.date))}</strong>
                  <div class="history-meta">
                    <span>${formatMoney(item.amount)}</span>
                    <span>Lai tam tinh ${formatMoney(item.accruedInterest)}</span>
                    <span>Dao han ${compactDate.format(fromDateKey(item.maturityDate))}</span>
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    class="tiny-button"
                    data-action="delete-savings-deposit"
                    data-id="${item.id}"
                    type="button"
                  >
                    Xoa
                  </button>
                </div>
              </header>
              ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
            </article>
          `
        )
        .join("")
    : renderEmptyState("Chua co lich su gui tien.");

  return `
    <section class="asset-inline-panel">
      <div class="section-title-row">
        <h4>Lich su gui</h4>
        <span class="hint">${snapshot.depositCount} lan gui | Bam Xoa neu nhap nham</span>
      </div>
      <div class="history-list">${history}</div>
    </section>
  `;
}

function renderFundInlineForm(snapshot) {
  return `
    <section class="glass-strip asset-inline-panel">
      <div class="section-title-row">
        <h4>Nap them vao quy</h4>
        <span class="hint">So CCQ duoc tinh theo NAV ban nhap.</span>
      </div>
      <form data-form="fund-contribution" data-fund="${snapshot.id}" class="editor-grid three inline-money-form">
        <label>
          Ngay nap
          <input name="date" type="date" value="${todayKey}" required />
        </label>
        <label>
          So tien
          <input name="amount" type="number" min="0" step="1000" required />
        </label>
        <label>
          NAV mua
          <input
            name="nav"
            type="number"
            min="0"
            step="0.01"
            value="${snapshot.currentNav ? snapshot.currentNav.toFixed(2) : ""}"
            required
          />
        </label>
        <label class="inline-money-form-note">
          Ghi chu
          <input
            name="note"
            type="text"
            maxlength="100"
            placeholder="nap them, bo sung lich su..."
          />
        </label>
        <div class="inline-money-submit">
          <button class="primary-button" type="submit">Luu lan nap</button>
        </div>
      </form>
    </section>
  `;
}

function renderFundInlineHistory(snapshot) {
  const transactions = snapshot.allTransactions.length
    ? snapshot.allTransactions
        .map(
          (item) => `
            <article class="history-item">
              <header>
                <div>
                  <strong>${compactDate.format(fromDateKey(item.date))}</strong>
                  <div class="history-meta">
                    <span>${formatMoney(item.amount)}</span>
                    <span>${formatUnits(item.units)} | ${formatNav(item.nav)}</span>
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    class="tiny-button"
                    data-action="delete-fund-transaction"
                    data-id="${item.id}"
                    data-fund="${snapshot.id}"
                    type="button"
                  >
                    Xoa
                  </button>
                </div>
              </header>
              ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
            </article>
          `
        )
        .join("")
    : renderEmptyState("Chua co lan nap nao.");

  const navHistory = snapshot.allNavs.length
    ? snapshot.allNavs
        .map(
          (item) => `
            <article class="history-item">
              <header>
                <div>
                  <strong>${compactDate.format(fromDateKey(item.date))}</strong>
                  <div class="history-meta">
                    <span>${formatNav(item.nav)}</span>
                    <span>${escapeHtml(item.source || "Nhap tay")}</span>
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    class="tiny-button"
                    data-action="delete-fund-nav"
                    data-id="${item.id}"
                    data-fund="${snapshot.id}"
                    type="button"
                  >
                    Xoa
                  </button>
                </div>
              </header>
              ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
            </article>
          `
        )
        .join("")
    : renderEmptyState("Chua co moc NAV nao.");

  const navForm = ui.moneyPanels.fundNavForms[snapshot.id] ? renderFundInlineNavForm(snapshot) : "";

  return `
    <section class="asset-inline-panel">
      <div class="section-title-row">
        <h4>Lich su va NAV</h4>
        <div class="item-actions">
          <button
            class="tiny-button"
            data-action="toggle-fund-nav-form"
            data-fund="${snapshot.id}"
            type="button"
          >
            ${ui.moneyPanels.fundNavForms[snapshot.id] ? "Dong NAV" : "Them NAV"}
          </button>
        </div>
      </div>
      ${navForm}
      <div class="asset-inline-grid">
        <div class="asset-subsection">
          <div class="section-title-row">
            <h4>Lich su nap</h4>
            <span class="hint">${snapshot.transactionCount} lan</span>
          </div>
          <div class="history-list">${transactions}</div>
        </div>
        <div class="asset-subsection">
          <div class="section-title-row">
            <h4>Moc NAV</h4>
            <span class="hint">${snapshot.allNavs.length} moc</span>
          </div>
          <div class="history-list">${navHistory}</div>
        </div>
      </div>
    </section>
  `;
}

function renderFundInlineNavForm(snapshot) {
  return `
    <section class="glass-strip asset-inline-panel">
      <form data-form="fund-nav-update" data-fund="${snapshot.id}" class="editor-grid three inline-money-form">
        <label>
          Ngay NAV
          <input name="date" type="date" value="${todayKey}" required />
        </label>
        <label>
          NAV
          <input
            name="nav"
            type="number"
            min="0"
            step="0.01"
            value="${snapshot.currentNav ? snapshot.currentNav.toFixed(2) : ""}"
            required
          />
        </label>
        <label>
          Nguon
          <input name="source" type="text" maxlength="40" value="Fmarket" />
        </label>
        <label class="inline-money-form-note">
          Ghi chu
          <input
            name="note"
            type="text"
            maxlength="100"
            placeholder="cap nhat gia moi..."
          />
        </label>
        <div class="inline-money-submit">
          <button class="primary-button" type="submit">Luu NAV</button>
        </div>
      </form>
    </section>
  `;
}

function renderAssetMetric(label, value, note, tone = "") {
  return `
    <article class="asset-metric ${tone ? `is-${tone}` : ""}">
      <div class="asset-metric-copy">
        <span>${escapeHtml(label)}</span>
        <small>${escapeHtml(note)}</small>
      </div>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderMoneyHistoryItem(title, value, meta, note) {
  return `
    <article class="history-item">
      <header>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <div class="history-meta">
            <span>${escapeHtml(value)}</span>
            <span>${escapeHtml(meta)}</span>
          </div>
        </div>
      </header>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </article>
  `;
}

function renderSchedule() {
  const todayItems = getEventsForDate(todayKey).length + getNotesForDate(todayKey).length;
  elements.todayEventCount.textContent = `${todayItems} muc`;

  elements.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === ui.calendarMode);
  });

  elements.calendarMonthLabel.textContent = getCalendarHeading();
  elements.calendarRangeLabel.textContent = getCalendarSubheading();
  elements.calendarBody.innerHTML = renderCalendarBody();
}

function renderCalendarBody() {
  if (ui.calendarMode === "month") {
    return renderMonthView();
  }

  if (ui.calendarMode === "week") {
    return renderWeekView();
  }

  return renderDayView();
}

function renderMonthView() {
  const viewMonth = new Date(ui.viewAnchorDate.getFullYear(), ui.viewAnchorDate.getMonth(), 1);
  const calendarDays = getMonthGridDays(viewMonth);

  return `
    <div class="calendar-scroll">
      <div class="calendar-weekdays">
        ${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="calendar-grid">
        ${calendarDays.map((date) => renderMonthCell(date, viewMonth)).join("")}
      </div>
    </div>
  `;
}

function renderMonthCell(date, currentMonth) {
  const dateKey = toDateKey(date);
  const occasions = getOccasionsForDate(dateKey);
  const events = getEventsForDate(dateKey);
  const notes = getNotesForDate(dateKey);
  const previewItems = [
    ...occasions.slice(0, 1).map((item) => renderCalendarHoliday(item)),
    ...events.slice(0, 2).map((item) => renderCalendarEvent(item)),
    ...notes.slice(0, 1).map((item) => renderCalendarNote(item)),
  ].slice(0, 4);
  const moreCount = Math.max(0, occasions.length + events.length + notes.length - previewItems.length);

  return `
    <article
      class="calendar-day ${getDayStateClasses(date, currentMonth)}"
      data-action="open-day-modal"
      data-date="${dateKey}"
      data-drop-date="${dateKey}"
    >
      <div class="calendar-day-head">
        <span class="calendar-day-number">${date.getDate()}</span>
        <div class="calendar-day-meta">
          ${occasions.length ? `<span class="calendar-count holiday">${occasions.length} le</span>` : ""}
          ${events.length ? `<span class="calendar-count">${events.length} lich</span>` : ""}
          ${notes.length ? `<span class="calendar-count">${notes.length} note</span>` : ""}
        </div>
      </div>
      <div class="calendar-day-content">
        ${
          occasions.length || events.length || notes.length
            ? [
                ...previewItems,
                moreCount ? `<span class="calendar-more">+${moreCount} muc khac</span>` : "",
              ].join("")
            : '<span class="calendar-empty">De trong cho ngay nay.</span>'
        }
      </div>
    </article>
  `;
}

function renderWeekView() {
  const weekStart = startOfWeek(ui.viewAnchorDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return `
    <div class="calendar-scroll">
      <div class="week-board">
        ${days.map((date) => renderWeekColumn(date)).join("")}
      </div>
    </div>
  `;
}

function renderWeekColumn(date) {
  const dateKey = toDateKey(date);
  const occasions = getOccasionsForDate(dateKey);
  const events = getEventsForDate(dateKey);
  const notes = getNotesForDate(dateKey);

  return `
    <article
      class="week-column ${getDayStateClasses(date, date)}"
      data-action="open-day-modal"
      data-date="${dateKey}"
      data-drop-date="${dateKey}"
    >
      <div class="week-column-head">
        <div>
          <div class="week-column-title">${capitalize(weekdayShort.format(date))}</div>
          <div class="week-column-date">${shortDate.format(date)}</div>
        </div>
        <div class="week-column-meta">
          ${occasions.length ? `<span class="calendar-count holiday">${occasions.length}</span>` : ""}
          ${events.length ? `<span class="calendar-count">${events.length}</span>` : ""}
          ${notes.length ? `<span class="calendar-count">${notes.length}</span>` : ""}
        </div>
      </div>
      <div class="week-column-body">
        ${
          occasions.length || events.length || notes.length
            ? [
                ...occasions.map((item) => renderCalendarHoliday(item)),
                ...events.map((item) => renderCalendarEvent(item)),
                ...notes.map((item) => renderCalendarNote(item)),
              ].join("")
            : '<span class="week-empty">Chua co gi duoc gan vao ngay nay.</span>'
        }
      </div>
    </article>
  `;
}

function renderDayView() {
  const selectedDate = fromDateKey(ui.selectedDateKey);
  const occasions = getOccasionsForDate(ui.selectedDateKey);
  const events = getEventsForDate(ui.selectedDateKey);
  const notes = getNotesForDate(ui.selectedDateKey);

  return `
    <div class="day-view-layout">
      <article
        class="day-focus-panel is-selected ${ui.selectedDateKey === todayKey ? "is-today" : ""}"
        data-action="open-day-modal"
        data-date="${ui.selectedDateKey}"
      >
        <div class="day-focus-head">
          <div>
            <div class="day-focus-number">${capitalize(fullDate.format(selectedDate))}</div>
            <p class="hint">Bam vao day de mo popup sua chi tiet event va note.</p>
          </div>
          <div class="calendar-day-meta">
            ${occasions.length ? `<span class="calendar-count holiday">${occasions.length} le</span>` : ""}
            ${events.length ? `<span class="calendar-count">${events.length} lich</span>` : ""}
            ${notes.length ? `<span class="calendar-count">${notes.length} note</span>` : ""}
          </div>
        </div>
        <div class="day-focus-summary">
          ${occasions.length ? renderOccasionCards(occasions) : ""}
          ${events.length ? renderTimelineCards(events) : renderEmptyState("Ngay nay chua co su kien.")}
        </div>
      </article>

      <div class="editor-stack">
        <section class="day-focus-panel">
          <div class="section-title-row">
            <h3>Lich trong ngay</h3>
            <span class="hint">Keo tha o view thang/tuan de doi ngay nhanh</span>
          </div>
          <div class="day-focus-body">
            ${events.length ? renderTimelineCards(events) : renderEmptyState("Chua co lich nao trong ngay nay.")}
          </div>
        </section>

        <section class="day-focus-panel">
          <div class="section-title-row">
            <h3>Ngay dac biet</h3>
            <span class="hint">Le am lich va duong lich</span>
          </div>
          <div class="day-focus-body">
            ${occasions.length ? renderOccasionCards(occasions) : renderEmptyState("Hom nay khong trung ngay dac biet nao.")}
          </div>
        </section>

        <section class="day-focus-panel">
          <div class="section-title-row">
            <h3>Notes da gan ngay</h3>
            <span class="hint">Task, idea, journal</span>
          </div>
          <div class="day-focus-body">
            ${
              notes.length
                ? notes
                    .map(
                      (item) => `
                        <article class="note-mini">
                          <strong>${escapeHtml(item.title)}</strong>
                          <span>${escapeHtml(item.content)}</span>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("Ngay nay chua co note nao duoc gan.")
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderCalendarEvent(item) {
  return `
    <article class="calendar-event-chip" draggable="true" data-drag-event-id="${item.id}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${item.startTime} - ${item.endTime} | ${escapeHtml(item.tag)}</span>
    </article>
  `;
}

function renderCalendarNote(item) {
  return `
    <article class="calendar-note-chip">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.type)}${item.done ? " | done" : ""}</span>
    </article>
  `;
}

function renderCalendarHoliday(item) {
  return `
    <article class="calendar-holiday-chip">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${item.calendarLabel}</span>
    </article>
  `;
}

function renderTimelineCards(items) {
  return items
    .map(
      (item) => `
        <article class="timeline-card">
          <span class="timeline-time">${item.startTime} - ${item.endTime}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.detail || "Khong co ghi chu them.")}</span>
        </article>
      `
    )
    .join("");
}

function renderOccasionCards(items) {
  return items
    .map(
      (item) => `
        <article class="note-mini holiday-mini">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.calendarLabel}</span>
        </article>
      `
    )
    .join("");
}

function renderDayModal() {
  const selectedDate = fromDateKey(ui.selectedDateKey);
  const occasions = getOccasionsForDate(ui.selectedDateKey);
  const events = getEventsForDate(ui.selectedDateKey);
  const notes = getNotesForDate(ui.selectedDateKey);

  elements.dayModalTitle.textContent = capitalize(fullDate.format(selectedDate));
  elements.dayModalSubtitle.textContent = `${occasions.length} le | ${events.length} lich | ${notes.length} note`;
  elements.dayModalHighlights.innerHTML = occasions.length
    ? occasions
        .map(
          (item) => `
            <span class="highlight-pill">
              <strong>${escapeHtml(item.name)}</strong>
              <span>${item.calendarLabel}</span>
            </span>
          `
        )
        .join("")
    : "";

  renderCollection(
    elements.dayModalEvents,
    events,
    (item, index) => renderEventEditor(item, index + 1),
    "Ngay nay chua co su kien nao."
  );

  renderCollection(
    elements.dayModalNotes,
    notes,
    (item, index) => renderNoteEditor(item, index + 1),
    "Ngay nay chua co note nao."
  );

  elements.dayModalEventCreate.innerHTML = renderCreateEventEditor(ui.selectedDateKey);
  elements.dayModalNoteCreate.innerHTML = renderCreateNoteEditor(ui.selectedDateKey);
}

function renderEventEditor(item, index) {
  return `
    <form class="editor-card" data-form="edit-event" data-id="${item.id}">
      <div class="editor-header">
        <div>
          <span class="tag">Event ${index}</span>
          <h4>${escapeHtml(item.title)}</h4>
        </div>
        <span class="hint">Sua roi bam luu. Co the doi ngay ngay trong form.</span>
      </div>
      <div class="editor-grid two">
        <label>
          Tieu de
          <input name="title" type="text" value="${escapeHtml(item.title)}" required />
        </label>
        <label>
          Nhom
          <select name="tag">${renderOptions(EVENT_TAGS, item.tag)}</select>
        </label>
      </div>
      <div class="editor-grid three">
        <label>
          Ngay
          <input name="date" type="date" value="${item.date}" required />
        </label>
        <label>
          Bat dau
          <input name="startTime" type="time" value="${item.startTime}" required />
        </label>
        <label>
          Ket thuc
          <input name="endTime" type="time" value="${item.endTime}" required />
        </label>
      </div>
      <label>
        Ghi chu
        <textarea name="detail" rows="3" maxlength="160">${escapeHtml(item.detail || "")}</textarea>
      </label>
      <div class="editor-actions">
        <div class="hint">ID: ${item.id.slice(0, 8)}</div>
        <div class="item-actions">
          <button class="ghost-button" data-action="delete-event" data-id="${item.id}" type="button">Xoa</button>
          <button class="primary-button" type="submit">Luu su kien</button>
        </div>
      </div>
    </form>
  `;
}

function renderNoteEditor(item, index) {
  return `
    <form class="editor-card" data-form="edit-note" data-id="${item.id}">
      <div class="editor-header">
        <div>
          <span class="tag warm">Note ${index}</span>
          <h4>${escapeHtml(item.title)}</h4>
        </div>
        <span class="hint">Task, idea, journal deu sua truc tiep duoc.</span>
      </div>
      <div class="editor-grid two">
        <label>
          Kieu block
          <select name="type">${renderOptions(NOTE_TYPES, item.type)}</select>
        </label>
        <label>
          Gan vao ngay
          <input name="linkedDate" type="date" value="${item.linkedDate}" />
        </label>
      </div>
      <label>
        Tieu de
        <input name="title" type="text" value="${escapeHtml(item.title)}" required />
      </label>
      <label>
        Noi dung
        <textarea name="content" rows="4" maxlength="260" required>${escapeHtml(item.content)}</textarea>
      </label>
      <div class="checkbox-row">
        <label class="checkbox-pill">
          <input name="pinned" type="checkbox" ${item.pinned ? "checked" : ""} />
          Ghim
        </label>
        <label class="checkbox-pill">
          <input name="done" type="checkbox" ${item.done ? "checked" : ""} />
          Hoan tat
        </label>
      </div>
      <div class="editor-actions">
        <div class="hint">Block ${index}</div>
        <div class="item-actions">
          <button class="ghost-button" data-action="delete-note" data-id="${item.id}" type="button">Xoa</button>
          <button class="primary-button" type="submit">Luu note</button>
        </div>
      </div>
    </form>
  `;
}

function renderCreateEventEditor(dateKey) {
  return `
    <form class="create-editor" data-form="create-event">
      <div class="section-title-row">
        <h3>Them su kien cho ngay nay</h3>
        <span class="hint">${shortDate.format(fromDateKey(dateKey))}</span>
      </div>
      <div class="editor-grid two">
        <label>
          Tieu de
          <input name="title" type="text" placeholder="Workout, meeting..." required />
        </label>
        <label>
          Nhom
          <select name="tag">${renderOptions(EVENT_TAGS, "Focus")}</select>
        </label>
      </div>
      <div class="editor-grid three">
        <label>
          Ngay
          <input name="date" type="date" value="${dateKey}" required />
        </label>
        <label>
          Bat dau
          <input name="startTime" type="time" value="09:00" required />
        </label>
        <label>
          Ket thuc
          <input name="endTime" type="time" value="10:00" required />
        </label>
      </div>
      <label>
        Ghi chu
        <textarea name="detail" rows="3" maxlength="160" placeholder="Can chuan bi gi cho su kien nay?"></textarea>
      </label>
      <div class="editor-actions">
        <div class="hint">Them nhanh ngay trong popup</div>
        <button class="primary-button" type="submit">Tao su kien</button>
      </div>
    </form>
  `;
}

function renderCreateNoteEditor(dateKey) {
  return `
    <form class="create-editor" data-form="create-note">
      <div class="section-title-row">
        <h3>Them note cho ngay nay</h3>
        <span class="hint">${shortDate.format(fromDateKey(dateKey))}</span>
      </div>
      <div class="editor-grid two">
        <label>
          Kieu block
          <select name="type">${renderOptions(NOTE_TYPES, "task")}</select>
        </label>
        <label>
          Gan vao ngay
          <input name="linkedDate" type="date" value="${dateKey}" />
        </label>
      </div>
      <label>
        Tieu de
        <input name="title" type="text" placeholder="Viec can nho, y tuong..." required />
      </label>
      <label>
        Noi dung
        <textarea name="content" rows="4" maxlength="260" placeholder="Ghi nhanh de mo popup la thay." required></textarea>
      </label>
      <div class="editor-actions">
        <div class="hint">Note moi se hien ngay trong lich</div>
        <button class="primary-button" type="submit">Tao note</button>
      </div>
    </form>
  `;
}

function renderNotes() {
  const sortedNotes = [...state.notes].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return Number(right.pinned) - Number(left.pinned);
    }

    return new Date(right.createdAt) - new Date(left.createdAt);
  });

  elements.notesCount.textContent = `${sortedNotes.length} muc`;

  renderCollection(
    elements.notesGrid,
    sortedNotes,
    (item) => `
      <article class="note-card ${item.done ? "is-done" : ""}">
        <header>
          <div>
            <span class="tag ${item.type === "idea" ? "warm" : ""}">${escapeHtml(item.type)}</span>
            <strong>${escapeHtml(item.title)}</strong>
          </div>
          <div class="item-actions">
            <button class="tiny-button" data-action="toggle-pin-note" data-id="${item.id}" type="button">
              ${item.pinned ? "Unpin" : "Pin"}
            </button>
            <button class="tiny-button" data-action="delete-note" data-id="${item.id}" type="button">Xoa</button>
          </div>
        </header>
        <p>${escapeHtml(item.content)}</p>
        <div class="note-footer">
          <div class="note-meta">
            <span class="hint">${capitalize(shortDate.format(new Date(item.createdAt)))}</span>
            ${
              item.linkedDate
                ? `<span class="tag warm">${escapeHtml(shortDate.format(fromDateKey(item.linkedDate)))}</span>`
                : ""
            }
          </div>
          <button class="tiny-button" data-action="toggle-done-note" data-id="${item.id}" type="button">
            ${item.done ? "Mo lai" : "Done"}
          </button>
        </div>
      </article>
    `,
    "Chua co block nao."
  );
}

function getFinanceTotals() {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let incomeMonth = 0;
  let expenseMonth = 0;
  let balance = 0;

  for (const item of state.transactions) {
    const date = fromDateKey(item.date);
    const signedAmount = item.type === "income" ? item.amount : -item.amount;
    balance += signedAmount;

    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      if (item.type === "income") {
        incomeMonth += item.amount;
      } else {
        expenseMonth += item.amount;
      }
    }
  }

  return { incomeMonth, expenseMonth, balance };
}

function getCategoryBreakdown() {
  const month = today.getMonth();
  const year = today.getFullYear();
  const lookup = new Map();

  state.transactions.forEach((item) => {
    const date = fromDateKey(item.date);
    if (item.type !== "expense" || date.getMonth() !== month || date.getFullYear() !== year) {
      return;
    }

    lookup.set(item.category, (lookup.get(item.category) || 0) + item.amount);
  });

  return [...lookup.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
}

function getUpcomingEvents() {
  return [...state.events]
    .filter((item) => toDateTime(item.date, item.startTime) >= stripSeconds(new Date()))
    .sort(
      (left, right) => toDateTime(left.date, left.startTime) - toDateTime(right.date, right.startTime)
    );
}

function getEventsForDate(dateKey) {
  return [...state.events]
    .filter((item) => item.date === dateKey)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function getNotesForDate(dateKey) {
  return [...state.notes]
    .filter((item) => item.linkedDate === dateKey)
    .sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return Number(right.pinned) - Number(left.pinned);
      }

      return new Date(right.createdAt) - new Date(left.createdAt);
    });
}

function getOccasionsForDate(dateKey) {
  const date = fromDateKey(dateKey);
  const solarKey = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const solarOccasions = (SOLAR_OCCASIONS[solarKey] || []).map((name) => ({
    name,
    type: "solar",
    calendarLabel: "Duong lich",
  }));

  const lunarParts = getLunarDateParts(date);
  const lunarKey = lunarParts ? `${lunarParts.month}-${lunarParts.day}` : "";
  const lunarOccasions = (LUNAR_OCCASIONS[lunarKey] || []).map((name) => ({
    name,
    type: "lunar",
    calendarLabel: `Am lich ${lunarParts.day}/${lunarParts.month}`,
  }));

  return [...solarOccasions, ...lunarOccasions];
}

function getLunarDateParts(date) {
  try {
    const parts = lunarFormatter.formatToParts(date);
    const month = Number(extractDigits(parts.find((item) => item.type === "month")?.value || ""));
    const day = Number(extractDigits(parts.find((item) => item.type === "day")?.value || ""));

    if (!month || !day) {
      return null;
    }

    return { month, day };
  } catch (error) {
    return null;
  }
}

function extractDigits(value) {
  const digits = String(value).replace(/\D+/g, "");
  return digits || "";
}

function getCalendarHeading() {
  if (ui.calendarMode === "month") {
    return capitalize(monthLabel.format(ui.viewAnchorDate));
  }

  if (ui.calendarMode === "week") {
    const start = startOfWeek(ui.viewAnchorDate);
    const end = addDays(start, 6);
    return `Tuan ${compactDate.format(start)} - ${compactDate.format(end)}`;
  }

  return capitalize(fullDate.format(fromDateKey(ui.selectedDateKey)));
}

function getCalendarSubheading() {
  if (ui.calendarMode === "month") {
    return "Keo event giua cac ngay de doi lich nhanh, bam vao ngay de mo popup chinh sua.";
  }

  if (ui.calendarMode === "week") {
    return "View tuan giup nhin ro event va note duoc gan theo tung ngay.";
  }

  return "View ngay de nhin sat lich trinh, note va mo popup sua chi tiet.";
}

function getMonthGridDays(viewMonth) {
  const gridStart = startOfWeek(viewMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getDayStateClasses(date, currentMonthRef) {
  const dateKey = toDateKey(date);
  const currentMonth = currentMonthRef.getMonth();
  const classes = [];

  if (date.getMonth() !== currentMonth) {
    classes.push("is-outside");
  }

  if (dateKey === todayKey) {
    classes.push("is-today");
  }

  if (dateKey === ui.selectedDateKey) {
    classes.push("is-selected");
  }

  return classes.join(" ");
}

function renderCollection(container, items, renderItem, emptyMessage) {
  if (!items.length) {
    container.innerHTML = renderEmptyState(emptyMessage);
    return;
  }

  container.innerHTML = items.map((item, index, list) => renderItem(item, index, list)).join("");
}

function renderEmptyState(message) {
  return `
    <div class="empty-state">
      <p>${escapeHtml(message || "Chua co du lieu.")}</p>
    </div>
  `;
}

function renderOptions(options, selectedValue) {
  return options
    .map(
      (option) => `
        <option value="${escapeHtml(option)}" ${option === selectedValue ? "selected" : ""}>
          ${escapeHtml(option)}
        </option>
      `
    )
    .join("");
}

function exportData() {
  const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `life-ledger-${todayKey}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData() {
  elements.importInput.click();
}

async function handleImportChange(event) {
  const [file] = event.currentTarget.files || [];
  if (!file) {
    return;
  }

  try {
    state = normalizeState(JSON.parse(await file.text()));
    ui.calendarMode = "month";
    ui.selectedDateKey = todayKey;
    ui.viewAnchorDate = new Date(today);
    closeDayModal();
    closeMoneyModal();
    persist();
    setDefaultFormValues();
    render();
  } catch (error) {
    alert("File JSON khong hop le.");
  } finally {
    event.currentTarget.value = "";
  }
}

function resetToDemo() {
  state = seedState();
  ui.calendarMode = "month";
  ui.selectedDateKey = todayKey;
  ui.viewAnchorDate = new Date(today);
  closeDayModal();
  closeMoneyModal();
  persist();
  setDefaultFormValues();
  render();
}

function summaryPill(label, value, tone = "") {
  return `
    <article class="summary-pill ${tone ? `is-${tone}` : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function sortByDateDesc(left, right) {
  return toDateTime(right.date, "23:59") - toDateTime(left.date, "00:00");
}

function sortByEntryDateDesc(left, right) {
  const byDate = toDateTime(right.date, "23:59") - toDateTime(left.date, "00:00");
  if (byDate !== 0) {
    return byDate;
  }

  return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
}

function formatMoney(amount) {
  return currency.format(amount);
}

function formatSignedMoney(amount) {
  if (!amount) {
    return formatMoney(0);
  }

  const sign = amount > 0 ? "+" : "-";
  return `${sign}${formatMoney(Math.abs(amount))}`;
}

function formatNav(value) {
  return `${decimalNumber.format(value || 0)} d/CCQ`;
}

function formatUnits(value) {
  return `${unitNumber.format(value || 0)} CCQ`;
}

function getTone(value) {
  if (value > 0.5) {
    return "positive";
  }

  if (value < -0.5) {
    return "negative";
  }

  return "";
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startOfWeek(date) {
  const cloned = stripTime(new Date(date));
  const day = cloned.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cloned.setDate(cloned.getDate() + diff);
  return cloned;
}

function addDays(date, amount) {
  const next = stripTime(new Date(date));
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  const next = stripTime(new Date(date));
  const dayOfMonth = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(dayOfMonth, maxDay));
  return next;
}

function stripTime(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value) {
  return new Date(`${value}T00:00:00`);
}

function toDateTime(dateKey, timeKey) {
  return new Date(`${dateKey}T${timeKey || "00:00"}:00`);
}

function stripSeconds(date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy;
}

function dayDiff(startDate, endDate) {
  return Math.max(0, Math.round((stripTime(endDate) - stripTime(startDate)) / DAY_IN_MS));
}

function getNextRecurringDepositDate(startDateKey, referenceDate) {
  let cursor = stripTime(fromDateKey(startDateKey));
  const reference = stripTime(referenceDate);

  while (cursor <= reference) {
    cursor = addMonths(cursor, 1);
  }

  return toDateKey(cursor);
}

function capitalize(value) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

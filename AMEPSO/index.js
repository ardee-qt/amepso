// ===== E-WALLET SYSTEM =====
// Enhanced JavaScript with validation, persistence, analytics, unified state management, security, and advanced features

class EWalletApp {
    constructor() {
        // ===== UNIFIED STATE MANAGEMENT =====
        this.state = {
            user: null,
            isAuthenticated: false,
            isMobile: false,
            currentPage: 'dashboard',
            sidebarOpen: false,
            pinVerifiedUntil: 0,
            historyFilters: {
                query: '',
                type: 'all',
                sort: 'newest',
                range: 'all'
            },
            upcomingFilters: {
                query: '',
                status: 'all',
                sort: 'due_soon',
                range: '30d'
            }
        };

        this.userData = {
            name: '',
            email: '',
            balance: 5000,
            bills: [],
            transactions: [],
            addFundsHistory: [],
            budget: {
                monthlyLimit: 10000,
                currentSpent: 0,
                category: {}
            },
            settings: {
                darkMode: false,
                currency: '₱',
                timezone: 'Asia/Manila',
                notificationsEnabled: true,
                autoLogout: true,
                sessionTimeout: 30 // minutes
            },
            createdAt: new Date().toISOString(),
            // Smart categorization map
            categoryMap: {
                'electricity': ['ORMECO', 'power', 'electric', 'bolt', 'meralco'],
                'water': ['water', 'MWSS', 'H2O', 'maynilad'],
                'internet': ['internet', 'broadband', 'ISP', 'wifi', 'globe', 'smart'],
                'utilities': ['utility', 'gas', 'phone', 'mobile'],
                'transportation': ['transport', 'taxi', 'bus', 'transit'],
                'other': []
            }
        };

        this.charts = {};
        this.filteredTransactions = [];
        this.securityTokens = new Map();
        this.sessionTimeout = null;

        this._pinVerifyResolver = null;
        this._addFundsSecurityResolver = null;
        this._payBillSecurityResolver = null;

        this._historySearchDebounce = null;
        
        this.loadUserData();
    }

    deepMerge(target, source) {
        if (!source || typeof source !== 'object') return target;
        for (const [key, value] of Object.entries(source)) {
            const canRecurse = value && typeof value === 'object' && !Array.isArray(value);
            const targetVal = target?.[key];
            const canMergeTarget = targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal);

            if (canRecurse && canMergeTarget) {
                this.deepMerge(targetVal, value);
            } else {
                target[key] = value;
            }
        }
        return target;
    }

    // ===== SECURITY PIN (DEMO) =====
    isPinSet() {
        return Boolean(this.getFromStorage('platformPinSalt') && this.getFromStorage('platformPinHash'));
    }

    isPinVerified() {
        return Date.now() < (this.state.pinVerifiedUntil || 0);
    }

    isWeakPin(pin) {
        const common = new Set([
            '000000','111111','222222','333333','444444','555555','666666','777777','888888','999999',
            '123456','654321','121212','212121','112233','332211'
        ]);
        if (common.has(pin)) return true;
        if (/^(\d)\1{5}$/.test(pin)) return true;
        if ('01234567890123456789'.includes(pin)) return true;
        if ('98765432109876543210'.includes(pin)) return true;
        return false;
    }

    async sha256Hex(value) {
        const data = new TextEncoder().encode(value);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPinValue(pin) {
        const lockUntil = this.getPinLockUntil();
        if (lockUntil && Date.now() < lockUntil) {
            const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
            return { ok: false, locked: true, message: `PIN locked. Try again in ${seconds}s` };
        }

        const salt = this.getFromStorage('platformPinSalt');
        const storedHash = this.getFromStorage('platformPinHash');
        if (!salt || !storedHash) {
            return { ok: false, locked: false, message: 'No PIN set' };
        }

        const hash = await this.sha256Hex(`${salt}:${pin}`);
        if (hash === storedHash) {
            this.saveToStorage('platformPinFailedAttempts', '0');
            this.saveToStorage('platformPinLockUntil', '0');
            this.state.pinVerifiedUntil = Date.now() + (5 * 60 * 1000);
            return { ok: true, locked: false, message: 'PIN verified' };
        }

        let attempts = parseInt(this.getFromStorage('platformPinFailedAttempts') || '0', 10);
        if (!Number.isFinite(attempts)) attempts = 0;
        attempts += 1;
        this.saveToStorage('platformPinFailedAttempts', String(attempts));

        const maxAttempts = 3;
        if (attempts >= maxAttempts) {
            const newLockUntil = Date.now() + (5 * 60 * 1000);
            this.saveToStorage('platformPinLockUntil', String(newLockUntil));
            this.saveToStorage('platformPinFailedAttempts', '0');
            return { ok: false, locked: true, message: 'Too many attempts. PIN locked for 5 minutes.' };
        }

        return { ok: false, locked: false, message: `Invalid PIN. Attempts left: ${maxAttempts - attempts}` };
    }

    randomHex(bytes = 16) {
        const buf = new Uint8Array(bytes);
        crypto.getRandomValues(buf);
        return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getPinLockUntil() {
        const lockUntil = parseInt(this.getFromStorage('platformPinLockUntil') || '0', 10);
        return Number.isFinite(lockUntil) ? lockUntil : 0;
    }

    async setPlatformPin(event) {
        if (event) event.preventDefault();

        const password = document.getElementById('pinSetupPassword')?.value || '';
        const pin = (document.getElementById('pinSetupPin')?.value || '').trim();
        const confirm = (document.getElementById('pinSetupConfirm')?.value || '').trim();

        const storedPassword = this.getFromStorage('userPassword') || '';

        if (!storedPassword) {
            this.showNotification('No account password found. Please set/change your password first.', 'error');
            return;
        }

        if (password !== storedPassword) {
            this.showNotification('Invalid account password', 'error');
            return;
        }

        if (!/^\d{6}$/.test(pin)) {
            this.showNotification('PIN must be exactly 6 digits', 'error');
            return;
        }

        if (pin !== confirm) {
            this.showNotification('PINs do not match', 'error');
            return;
        }

        if (this.isWeakPin(pin)) {
            this.showNotification('PIN is too weak. Avoid common, repeated, or sequential PINs.', 'error');
            return;
        }

        const salt = this.randomHex(16);
        const hash = await this.sha256Hex(`${salt}:${pin}`);
        this.saveToStorage('platformPinSalt', salt);
        this.saveToStorage('platformPinHash', hash);
        this.saveToStorage('platformPinFailedAttempts', '0');
        this.saveToStorage('platformPinLockUntil', '0');
        this.state.pinVerifiedUntil = 0;

        if (document.getElementById('pinSetupPassword')) document.getElementById('pinSetupPassword').value = '';
        if (document.getElementById('pinSetupPin')) document.getElementById('pinSetupPin').value = '';
        if (document.getElementById('pinSetupConfirm')) document.getElementById('pinSetupConfirm').value = '';

        this.closeModal('pinSetupModal');
        this.showNotification('Security PIN set successfully', 'success');
    }

    promptForPin() {
        return new Promise(resolve => {
            this._pinVerifyResolver = resolve;
            const input = document.getElementById('pinVerifyPin');
            if (input) input.value = '';
            this.openModal('pinVerifyModal');
            setTimeout(() => input?.focus(), 50);
        });
    }

    cancelPinVerification() {
        this.closeModal('pinVerifyModal');
        if (this._pinVerifyResolver) {
            const resolve = this._pinVerifyResolver;
            this._pinVerifyResolver = null;
            resolve(false);
        }
    }

    // ===== ADD FUNDS SECURITY (FRONTEND ONLY) =====
    promptAddFundsSecurity() {
        return new Promise(resolve => {
            this._addFundsSecurityResolver = resolve;

            const emailEl = document.getElementById('addFundsVerifyEmail');
            const passEl = document.getElementById('addFundsVerifyPassword');
            const pinEl = document.getElementById('addFundsVerifyPin');

            if (emailEl) emailEl.value = this.getFromStorage('userEmail') || this.userData.email || '';
            if (passEl) passEl.value = '';
            if (pinEl) pinEl.value = '';

            this.openModal('addFundsSecurityModal');
            setTimeout(() => (emailEl || passEl || pinEl)?.focus?.(), 50);
        });
    }

    cancelAddFundsSecurity() {
        this.closeModal('addFundsSecurityModal');
        if (this._addFundsSecurityResolver) {
            const resolve = this._addFundsSecurityResolver;
            this._addFundsSecurityResolver = null;
            resolve(false);
        }
    }

    async verifyAddFundsSecurity(event) {
        if (event) event.preventDefault();

        const expectedEmail = (this.getFromStorage('userEmail') || this.userData.email || '').trim().toLowerCase();
        const expectedPassword = this.getFromStorage('userPassword') || '';

        const email = (document.getElementById('addFundsVerifyEmail')?.value || '').trim().toLowerCase();
        const password = document.getElementById('addFundsVerifyPassword')?.value || '';
        const pin = (document.getElementById('addFundsVerifyPin')?.value || '').trim();

        if (!expectedEmail) {
            this.showNotification('No account email found. Please login again.', 'error');
            return;
        }

        if (!expectedPassword) {
            this.showNotification('No account password found. Please set/change your password first.', 'error');
            return;
        }

        if (email !== expectedEmail) {
            this.showNotification('Email does not match your account', 'error');
            return;
        }

        if (password !== expectedPassword) {
            this.showNotification('Incorrect password', 'error');
            return;
        }

        if (!/^\d{6}$/.test(pin)) {
            this.showNotification('PIN must be exactly 6 digits', 'error');
            return;
        }

        if (!this.isPinSet()) {
            this.showNotification('Set your Security PIN first to continue.', 'warning');
            this.closeModal('addFundsSecurityModal');
            this.openModal('pinSetupModal');
            if (this._addFundsSecurityResolver) {
                const resolve = this._addFundsSecurityResolver;
                this._addFundsSecurityResolver = null;
                resolve(false);
            }
            return;
        }

        const result = await this.verifyPinValue(pin);
        if (!result.ok) {
            this.showNotification(result.message, result.locked ? 'warning' : 'error');
            if (result.locked) {
                this.cancelAddFundsSecurity();
            }
            return;
        }

        this.closeModal('addFundsSecurityModal');
        this.showNotification('Verified. Processing add funds…', 'success', 2000);
        if (this._addFundsSecurityResolver) {
            const resolve = this._addFundsSecurityResolver;
            this._addFundsSecurityResolver = null;
            resolve(true);
        }
    }

    // ===== PAY BILL SECURITY (FRONTEND ONLY) =====
    promptPayBillSecurity() {
        return new Promise(resolve => {
            this._payBillSecurityResolver = resolve;

            const emailEl = document.getElementById('payBillVerifyEmail');
            const passEl = document.getElementById('payBillVerifyPassword');
            const pinEl = document.getElementById('payBillVerifyPin');

            if (emailEl) emailEl.value = this.getFromStorage('userEmail') || this.userData.email || '';
            if (passEl) passEl.value = '';
            if (pinEl) pinEl.value = '';

            this.openModal('payBillSecurityModal');
            setTimeout(() => (emailEl || passEl || pinEl)?.focus?.(), 50);
        });
    }

    cancelPayBillSecurity() {
        this.closeModal('payBillSecurityModal');
        if (this._payBillSecurityResolver) {
            const resolve = this._payBillSecurityResolver;
            this._payBillSecurityResolver = null;
            resolve(false);
        }
    }

    async verifyPayBillSecurity(event) {
        if (event) event.preventDefault();

        const expectedEmail = (this.getFromStorage('userEmail') || this.userData.email || '').trim().toLowerCase();
        const expectedPassword = this.getFromStorage('userPassword') || '';

        const email = (document.getElementById('payBillVerifyEmail')?.value || '').trim().toLowerCase();
        const password = document.getElementById('payBillVerifyPassword')?.value || '';
        const pin = (document.getElementById('payBillVerifyPin')?.value || '').trim();

        if (!expectedEmail) {
            this.showNotification('No account email found. Please login again.', 'error');
            return;
        }

        if (!expectedPassword) {
            this.showNotification('No account password found. Please set/change your password first.', 'error');
            return;
        }

        if (email !== expectedEmail) {
            this.showNotification('Email does not match your account', 'error');
            return;
        }

        if (password !== expectedPassword) {
            this.showNotification('Incorrect password', 'error');
            return;
        }

        if (!/^\d{6}$/.test(pin)) {
            this.showNotification('PIN must be exactly 6 digits', 'error');
            return;
        }

        if (!this.isPinSet()) {
            this.showNotification('Set your Security PIN first to continue.', 'warning');
            this.closeModal('payBillSecurityModal');
            this.openModal('pinSetupModal');
            if (this._payBillSecurityResolver) {
                const resolve = this._payBillSecurityResolver;
                this._payBillSecurityResolver = null;
                resolve(false);
            }
            return;
        }

        const result = await this.verifyPinValue(pin);
        if (!result.ok) {
            this.showNotification(result.message, result.locked ? 'warning' : 'error');
            if (result.locked) {
                this.cancelPayBillSecurity();
            }
            return;
        }

        this.closeModal('payBillSecurityModal');
        this.showNotification('Verified. Processing payment…', 'success', 2000);
        if (this._payBillSecurityResolver) {
            const resolve = this._payBillSecurityResolver;
            this._payBillSecurityResolver = null;
            resolve(true);
        }
    }

    async verifyPlatformPin(event) {
        if (event) event.preventDefault();

        const lockUntil = this.getPinLockUntil();
        if (lockUntil && Date.now() < lockUntil) {
            const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
            this.showNotification(`PIN locked. Try again in ${seconds}s`, 'warning');
            return;
        }

        const pin = (document.getElementById('pinVerifyPin')?.value || '').trim();
        if (!/^\d{6}$/.test(pin)) {
            this.showNotification('PIN must be exactly 6 digits', 'error');
            return;
        }

        const salt = this.getFromStorage('platformPinSalt');
        const storedHash = this.getFromStorage('platformPinHash');
        if (!salt || !storedHash) {
            this.showNotification('No PIN set. Please set your Security PIN first.', 'warning');
            this.closeModal('pinVerifyModal');
            this.openModal('pinSetupModal');
            if (this._pinVerifyResolver) {
                const resolve = this._pinVerifyResolver;
                this._pinVerifyResolver = null;
                resolve(false);
            }
            return;
        }

        const hash = await this.sha256Hex(`${salt}:${pin}`);
        if (hash === storedHash) {
            this.saveToStorage('platformPinFailedAttempts', '0');
            this.saveToStorage('platformPinLockUntil', '0');
            this.state.pinVerifiedUntil = Date.now() + (5 * 60 * 1000);
            this.closeModal('pinVerifyModal');
            this.showNotification('PIN verified', 'success', 2000);
            if (this._pinVerifyResolver) {
                const resolve = this._pinVerifyResolver;
                this._pinVerifyResolver = null;
                resolve(true);
            }
            return;
        }

        let attempts = parseInt(this.getFromStorage('platformPinFailedAttempts') || '0', 10);
        if (!Number.isFinite(attempts)) attempts = 0;
        attempts += 1;
        this.saveToStorage('platformPinFailedAttempts', String(attempts));

        const maxAttempts = 3;
        if (attempts >= maxAttempts) {
            const newLockUntil = Date.now() + (5 * 60 * 1000);
            this.saveToStorage('platformPinLockUntil', String(newLockUntil));
            this.saveToStorage('platformPinFailedAttempts', '0');
            this.showNotification('Too many attempts. PIN locked for 5 minutes.', 'warning');
            this.cancelPinVerification();
            return;
        }

        this.showNotification(`Invalid PIN. Attempts left: ${maxAttempts - attempts}`, 'error');
    }

    async ensurePinVerified() {
        if (this.isPinVerified()) return true;

        const lockUntil = this.getPinLockUntil();
        if (lockUntil && Date.now() < lockUntil) {
            const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
            this.showNotification(`PIN locked. Try again in ${seconds}s`, 'warning');
            return false;
        }

        if (!this.isPinSet()) {
            this.showNotification('Set your Security PIN first to continue.', 'warning');
            this.openModal('pinSetupModal');
            return false;
        }

        return await this.promptForPin();
    }

    getNotificationContainer() {
        const candidates = [
            document.getElementById('dashboardNotificationContainer'),
            document.getElementById('welcomeNotificationContainer')
        ].filter(Boolean);

        // Prefer a visible container (display != none)
        return candidates.find(el => el.offsetParent !== null) || candidates[0] || null;
    }

    // ===== INITIALIZATION =====
    init() {
        window.addEventListener('load', () => {
            // Always show welcome screen first
            this.showWelcome();
            this.applySavedTheme();
            this.syncSidebarLayout();
            this.initializeEventListeners();
        });
    }

    syncSidebarLayout() {
        const hasSidebar = Boolean(document.getElementById('dashboardSidebar') || document.querySelector('.dashboard-sidebar'));
        document.body.classList.toggle('has-sidebar', hasSidebar);
    }

    // ===== EVENT LISTENER INITIALIZATION ===== 
    initializeEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        
        if (sidebarToggle) sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        if (sidebarClose) sidebarClose.addEventListener('click', () => this.closeSidebar());
        
        // Close sidebar on link click (mobile)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.state.isMobile) this.closeSidebar();
            });
        });
        
        // Session timeout
        document.addEventListener('mousemove', () => this.resetSessionTimeout());
        document.addEventListener('keypress', () => this.resetSessionTimeout());
        
        // Responsive design
        window.addEventListener('resize', () => this.handleResponsive());
        this.handleResponsive();

        // History toolbar filters
        const historySearch = document.getElementById('historySearchInput');
        const historyType = document.getElementById('historyTypeFilter');
        const historySort = document.getElementById('historySort');

        if (historySearch) {
            historySearch.addEventListener('input', () => {
                if (this._historySearchDebounce) clearTimeout(this._historySearchDebounce);
                this._historySearchDebounce = setTimeout(() => {
                    this.state.historyFilters.query = historySearch.value || '';
                    this.updateBillHistory();
                }, 120);
            });
        }

        if (historyType) {
            historyType.addEventListener('change', () => {
                this.state.historyFilters.type = historyType.value || 'all';
                this.updateBillHistory();
            });
        }

        if (historySort) {
            historySort.addEventListener('change', () => {
                this.state.historyFilters.sort = historySort.value || 'newest';
                this.updateBillHistory();
            });
        }

        // History quick-range chips
        const chipsWrap = document.querySelector('.history-chips');
        if (chipsWrap) {
            chipsWrap.addEventListener('click', (e) => {
                const btn = e.target.closest('button.chip');
                if (!btn) return;
                const range = btn.dataset.range || 'all';
                this.state.historyFilters.range = range;
                chipsWrap.querySelectorAll('button.chip').forEach(b => b.classList.toggle('active', b === btn));
                this.updateBillHistory();
            });
        }

        // History actions
        const historyClearBtn = document.getElementById('historyClearBtn');
        const historyExportBtn = document.getElementById('historyExportBtn');

        if (historyClearBtn) {
            historyClearBtn.addEventListener('click', () => {
                this.resetHistoryFilters();
                this.showNotification('History filters cleared', 'info', 2000);
            });
        }

        if (historyExportBtn) {
            historyExportBtn.addEventListener('click', () => {
                this.exportFilteredHistoryCsv();
            });
        }

        // Escape closes any open modal
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const overlay = document.getElementById('modalOverlay');
            if (overlay && !overlay.classList.contains('hidden')) {
                this.closeAllModals();
            }
        });

        // Upcoming bills toolbar
        const upcomingSearch = document.getElementById('upcomingSearchInput');
        const upcomingStatus = document.getElementById('upcomingStatusFilter');
        const upcomingSort = document.getElementById('upcomingSort');
        const upcomingClear = document.getElementById('upcomingClearBtn');
        const upcomingChips = document.querySelector('.upcoming-chips');

        if (upcomingSearch) {
            upcomingSearch.addEventListener('input', () => {
                if (this._upcomingSearchDebounce) clearTimeout(this._upcomingSearchDebounce);
                this._upcomingSearchDebounce = setTimeout(() => {
                    this.state.upcomingFilters.query = upcomingSearch.value || '';
                    this.updateUpcomingBills();
                }, 120);
            });
        }

        if (upcomingStatus) {
            upcomingStatus.addEventListener('change', () => {
                this.state.upcomingFilters.status = upcomingStatus.value || 'all';
                this.updateUpcomingBills();
            });
        }

        if (upcomingSort) {
            upcomingSort.addEventListener('change', () => {
                this.state.upcomingFilters.sort = upcomingSort.value || 'due_soon';
                this.updateUpcomingBills();
            });
        }

        if (upcomingClear) {
            upcomingClear.addEventListener('click', () => {
                this.resetUpcomingFilters();
                this.showNotification('Upcoming filters cleared', 'info', 2000);
            });
        }

        if (upcomingChips) {
            upcomingChips.addEventListener('click', (e) => {
                const btn = e.target.closest('button.chip');
                if (!btn) return;
                const range = btn.dataset.upcomingRange || '30d';
                this.state.upcomingFilters.range = range;
                upcomingChips.querySelectorAll('button.chip').forEach(b => b.classList.toggle('active', b === btn));
                this.updateUpcomingBills();
            });
        }

    }

    resetUpcomingFilters() {
        this.state.upcomingFilters = {
            query: '',
            status: 'all',
            sort: 'due_soon',
            range: '30d'
        };

        const upcomingSearch = document.getElementById('upcomingSearchInput');
        const upcomingStatus = document.getElementById('upcomingStatusFilter');
        const upcomingSort = document.getElementById('upcomingSort');
        if (upcomingSearch) upcomingSearch.value = '';
        if (upcomingStatus) upcomingStatus.value = 'all';
        if (upcomingSort) upcomingSort.value = 'due_soon';

        const upcomingChips = document.querySelector('.upcoming-chips');
        if (upcomingChips) {
            upcomingChips.querySelectorAll('button.chip').forEach(btn => {
                btn.classList.toggle('active', (btn.dataset.upcomingRange || '') === '30d');
            });
        }

        this.updateUpcomingBills();
    }

    getUpcomingRange(rangeKey) {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

        if (rangeKey === 'overdue') {
            return { mode: 'overdue', start: null, end: startOfToday - 1 };
        }

        if (rangeKey === '7d') {
            return { mode: 'window', start: startOfToday, end: startOfToday + (7 * 24 * 60 * 60 * 1000) };
        }

        if (rangeKey === '30d') {
            return { mode: 'window', start: startOfToday, end: startOfToday + (30 * 24 * 60 * 60 * 1000) };
        }

        return { mode: 'all', start: null, end: null };
    }

    async markUpcomingBillPaid(billId) {
        const bill = (this.userData.bills || []).find(b => String(b.id) === String(billId));
        if (!bill) {
            this.showNotification('Bill not found', 'error');
            return;
        }

        if ((bill.status || '').toLowerCase() === 'paid') {
            this.showNotification('This bill is already marked as paid.', 'info', 2200);
            return;
        }

        const amount = Number(bill.amount) || 0;
        if (!(amount > 0)) {
            this.showNotification('Invalid bill amount', 'error');
            return;
        }

        if (amount > this.userData.balance) {
            this.showNotification(
                `Insufficient balance! Current: ₱${this.userData.balance.toFixed(2)}, Need: ₱${(amount - this.userData.balance).toFixed(2)} more`,
                'error'
            );
            return;
        }

        const verified = await this.promptPayBillSecurity();
        if (!verified) return;

        // Apply payment
        bill.status = 'Paid';
        bill.paymentDate = new Date().toISOString();
        bill.type = bill.type || 'bill';
        bill.referenceNo = bill.referenceNo || this.generateReferenceNumber();

        this.userData.balance -= amount;

        const existsInTx = (this.userData.transactions || []).some(t => String(t.id) === String(bill.id));
        if (!existsInTx) {
            this.userData.transactions.push({ ...bill });
        }

        this.saveUserData();
        this.showNotification(`Marked paid: ₱${amount.toFixed(2)} · Ref: ${bill.referenceNo}`, 'success');
        this.updateDashboard();
    }

    resetHistoryFilters() {
        this.state.historyFilters = {
            query: '',
            type: 'all',
            sort: 'newest',
            range: 'all'
        };

        const historySearch = document.getElementById('historySearchInput');
        const historyType = document.getElementById('historyTypeFilter');
        const historySort = document.getElementById('historySort');

        if (historySearch) historySearch.value = '';
        if (historyType) historyType.value = 'all';
        if (historySort) historySort.value = 'newest';

        const chipsWrap = document.querySelector('.history-chips');
        if (chipsWrap) {
            chipsWrap.querySelectorAll('button.chip').forEach(btn => {
                btn.classList.toggle('active', (btn.dataset.range || 'all') === 'all');
            });
        }

        this.updateBillHistory();
    }

    getFilteredHistoryItems() {
        const query = (this.state.historyFilters?.query || '').trim().toLowerCase();
        const typeFilter = this.state.historyFilters?.type || 'all';
        const sort = this.state.historyFilters?.sort || 'newest';
        const range = this.state.historyFilters?.range || 'all';

        let items = this.getHistoryItems();

        const rangeStart = this.getHistoryRangeStart(range);
        if (rangeStart) {
            items = items.filter(it => {
                const t = new Date(it.dateIso).getTime();
                return Number.isFinite(t) && t >= rangeStart;
            });
        }

        if (typeFilter !== 'all') {
            items = items.filter(it => it.kind === typeFilter);
        }

        if (query) {
            items = items.filter(it => {
                const haystack = `${it.description} ${it.accountNumber} ${it.referenceNo}`.toLowerCase();
                return haystack.includes(query);
            });
        }

        const byDateDesc = (a, b) => new Date(b.dateIso) - new Date(a.dateIso);
        const byDateAsc = (a, b) => new Date(a.dateIso) - new Date(b.dateIso);

        if (sort === 'oldest') {
            items.sort(byDateAsc);
        } else if (sort === 'amount_desc') {
            items.sort((a, b) => (b.amount - a.amount) || byDateDesc(a, b));
        } else if (sort === 'amount_asc') {
            items.sort((a, b) => (a.amount - b.amount) || byDateDesc(a, b));
        } else {
            items.sort(byDateDesc);
        }

        return items;
    }

    exportFilteredHistoryCsv() {
        const allItems = this.getHistoryItems();
        if (!allItems.length) {
            this.showNotification('No transactions to export yet.', 'warning', 2500);
            return;
        }

        const items = this.getFilteredHistoryItems();
        if (!items.length) {
            this.showNotification('No results to export for the current filters.', 'warning', 2500);
            return;
        }

        const csvEscape = (value) => {
            const s = String(value ?? '');
            const escaped = s.replace(/"/g, '""');
            return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        };

        const header = ['Date', 'Time', 'Type', 'Description', 'Account', 'Reference', 'Amount', 'Status'];
        const rows = items.map(it => {
            const d = new Date(it.dateIso);
            const dateLabel = d.toLocaleDateString();
            const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const typeLabel = it.kind === 'deposit' ? 'Add Funds' : 'Bill';
            return [
                dateLabel,
                timeLabel,
                typeLabel,
                it.description,
                it.accountNumber,
                it.referenceNo,
                Number(it.amount || 0).toFixed(2),
                it.status
            ].map(csvEscape).join(',');
        });

        const csv = '\uFEFF' + header.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `amepso-history-${dateStamp}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        this.showNotification('Exported filtered history as CSV.', 'success', 2500);
    }

    getHistoryItems() {
        const billItems = (this.userData.bills || []).map(bill => ({
            kind: 'bill',
            id: bill.id,
            description: bill.description || 'Bill Payment',
            accountNumber: bill.accountNumber || '',
            referenceNo: bill.referenceNo || '',
            amount: Number(bill.amount) || 0,
            status: bill.status || 'Paid',
            dateIso: bill.paymentDate || new Date().toISOString()
        }));

        const depositItems = (this.userData.addFundsHistory || []).map(tx => ({
            kind: 'deposit',
            id: tx.id,
            description: 'Add Funds',
            accountNumber: 'Wallet',
            referenceNo: tx.referenceNo || '',
            amount: Number(tx.amount) || 0,
            status: 'Completed',
            dateIso: tx.date || new Date().toISOString()
        }));

        return [...billItems, ...depositItems];
    }

    getHistoryRangeStart(rangeKey) {
        const now = new Date();
        if (rangeKey === 'today') {
            return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        }
        if (rangeKey === '7d') {
            return now.getTime() - (7 * 24 * 60 * 60 * 1000);
        }
        if (rangeKey === '30d') {
            return now.getTime() - (30 * 24 * 60 * 60 * 1000);
        }
        return null;
    }

    toggleSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            this.state.sidebarOpen = !this.state.sidebarOpen;
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            this.state.sidebarOpen = false;
        }
    }

    handleResponsive() {
        this.state.isMobile = window.innerWidth <= 768;
        if (!this.state.isMobile) this.closeSidebar();
    }

    resetSessionTimeout() {
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
        if (this.userData.settings.autoLogout && this.state.isAuthenticated) {
            this.sessionTimeout = setTimeout(() => {
                this.showNotification('Session expired due to inactivity', 'warning');
                this.logout();
            }, this.userData.settings.sessionTimeout * 60 * 1000);
        }
    }

    smartCategorizeTransaction(description) {
        const desc = (description || '').toLowerCase();
        for (const [category, keywords] of Object.entries(this.userData.categoryMap)) {
            if (keywords.some(keyword => desc.includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        return 'other';
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[<>"']/g, char => ({
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        }[char])).trim();
    }

    validateInput(input, type = 'text', options = {}) {
        const trimmed = this.sanitizeInput(input);
        switch(type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
            case 'phone':
                return /^[0-9\-\+\(\)\s]{7,}$/.test(trimmed);
            case 'currency':
                const num = parseFloat(trimmed);
                return !isNaN(num) && num > 0 && num <= (options.max || 999999);
            case 'password':
                return trimmed.length >= 6;
            case 'text':
                return trimmed.length >= (options.minLength || 3) && trimmed.length <= (options.maxLength || 255);
            default:
                return true;
        }
    }

    // ===== AUTHENTICATION =====
    toggleForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }

    showWelcome() {
        document.getElementById('welcomeSection').classList.remove('hidden');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registerSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
    }

    showLoginForm() {
        document.getElementById('welcomeSection').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('registerSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('welcomeSection').classList.add('hidden');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registerSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = this.sanitizeInput(document.getElementById('loginEmail').value);
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Enhanced Validation
        if (!this.validateInput(email, 'email')) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!this.validateInput(password, 'password')) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        // Disable button during request
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            // Use localStorage directly (backend not needed yet)
            const name = this.sanitizeInput(email.split('@')[0]);
            this.userData.name = name;
            this.userData.email = email;
            this.state.isAuthenticated = true;
            this.state.user = { name, email };
            
            this.saveToStorage('isLoggedIn', 'true');
            this.saveToStorage('userName', name);
            this.saveToStorage('userEmail', email);
            
            if (rememberMe) {
                this.saveToStorage('rememberEmail', email);
            }
            
            this.saveUserData();
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';

            this.showNotification(`Welcome back, ${name}!`, 'success');
            
            // Close modal and overlay
            const loginModal = document.getElementById('loginModal');
            const modalOverlay = document.getElementById('modalOverlay');
            if (loginModal) loginModal.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // Show dashboard after modal closes
            setTimeout(() => {
                this.showDashboard();
                this.initializeCharts();
            }, 300);
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const fullName = this.sanitizeInput(document.getElementById('registerFullName').value);
        const email = this.sanitizeInput(document.getElementById('registerEmail').value);
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const consumerId = this.sanitizeInput(document.getElementById('registerConsumerID').value);
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Enhanced Validation
        if (!this.validateInput(fullName, 'text', { minLength: 3, maxLength: 100 })) {
            this.showNotification('Full name must be between 3-100 characters', 'error');
            return;
        }

        if (!this.validateInput(email, 'email')) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!this.validateInput(password, 'password')) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showNotification('You must agree to the terms and conditions', 'error');
            return;
        }

        // Disable button during request
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        try {
            // Use localStorage directly (backend not needed yet)
            this.userData.name = fullName;
            this.userData.email = email;
            this.userData.balance = 10000; // New user bonus
            this.state.isAuthenticated = true;
            this.state.user = { name: fullName, email };
            
            this.saveToStorage('isLoggedIn', 'true');
            this.saveToStorage('userName', fullName);
            this.saveToStorage('userEmail', email);
            this.saveUserData();
            
            // Clear form
            document.getElementById('registerFullName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';
            document.getElementById('registerConsumerID').value = '';
            document.getElementById('agreeTerms').checked = false;

            this.showNotification(`Account created successfully! Welcome, ${fullName}! You have received ₱10,000 starting balance.`, 'success');
            
            // Close modal and overlay
            const registerModal = document.getElementById('registerModal');
            const modalOverlay = document.getElementById('modalOverlay');
            if (registerModal) registerModal.classList.add('hidden');
            if (modalOverlay) modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // Show dashboard after modal closes
            setTimeout(() => {
                this.showDashboard();
                this.initializeCharts();
            }, 300);
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed', 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }

    // ===== UI MANAGEMENT =====
    showDashboard() {
        // Get user data from storage
        this.userData.name = this.getFromStorage('userName') || this.userData.name;
        this.userData.email = this.getFromStorage('userEmail') || this.userData.email;
        this.state.isAuthenticated = true;
        
        // Hide all sections
        const welcomeSection = document.getElementById('welcomeSection');
        const dashboardSection = document.getElementById('dashboardSection');
        const modalOverlay = document.getElementById('modalOverlay');
        
        if (welcomeSection) welcomeSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        if (modalOverlay) modalOverlay.classList.add('hidden');
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
        
        // Update header
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = this.userData.name;
        
        // Initialize sidebar and responsive design
        this.handleResponsive();
        this.initializeEventListeners();
        
        // Update dashboard content
        this.updateDashboard();
        if (typeof window.showDashboardView === 'function') {
            window.showDashboardView('overview');
        }
        this.resetSessionTimeout();
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session data
            this.removeFromStorage('isLoggedIn');
            this.removeFromStorage('userName');
            this.removeFromStorage('userEmail');
            this.state.isAuthenticated = false;
            this.state.user = null;
            if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
            
            // Reset state
            this.userData.bills = [];
            this.userData.transactions = [];
            this.closeSidebar();
            
            this.showNotification('Logged out successfully', 'success');
            setTimeout(() => this.showWelcome(), 500);
        }
    }

    // ===== PROFILE MANAGEMENT =====
    loadProfileData() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const memberDate = document.getElementById('memberDate');
        const editFullName = document.getElementById('editFullName');
        const editEmail = document.getElementById('editEmail');
        const editPhone = document.getElementById('editPhone');
        const editAddress = document.getElementById('editAddress');

        const createdAt = this.userData.createdAt ? new Date(this.userData.createdAt).toLocaleDateString() : 'N/A';
        const phone = this.getFromStorage('userPhone') || '';
        const address = this.getFromStorage('userAddress') || '';

        profileName.innerHTML = `Name: <strong>${this.escapeHtml(this.userData.name)}</strong>`;
        profileEmail.innerHTML = `Email: <strong>${this.escapeHtml(this.userData.email)}</strong>`;
        memberDate.textContent = createdAt;

        editFullName.value = this.userData.name;
        editEmail.value = this.userData.email;
        editPhone.value = phone;
        editAddress.value = address;
    }

    saveProfileChanges() {
        const fullName = document.getElementById('editFullName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const address = document.getElementById('editAddress').value.trim();

        if (!fullName || fullName.length < 3) {
            this.showNotification('Full name must be at least 3 characters', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        this.userData.name = fullName;
        this.userData.email = email;
        this.saveToStorage('userName', fullName);
        this.saveToStorage('userEmail', email);
        this.saveToStorage('userPhone', phone);
        this.saveToStorage('userAddress', address);
        this.saveUserData();

        document.getElementById('userName').textContent = fullName;
        this.showNotification('Profile updated successfully!', 'success');
        this.loadProfileData();
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('All fields are required', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        // Save new password to storage (in production, this should be hashed on backend)
        this.saveToStorage('userPassword', newPassword);
        this.saveUserData();

        document.getElementById('changePasswordForm').reset();
        this.showNotification('Password changed successfully!', 'success');
    }

    // ===== PAYMENT FUNCTIONALITY =====
    async payElectricityBill(event) {
        event.preventDefault();

        const accountNumber = this.sanitizeInput(document.getElementById('accountNumber').value);
        const billAmount = parseFloat(document.getElementById('billAmount').value);
        const dueDate = document.getElementById('dueDate').value;
        const description = this.sanitizeInput(document.getElementById('description').value);

        // Enhanced Validation
        if (!this.validateInput(accountNumber, 'text', { minLength: 3 })) {
            this.showNotification('Please enter a valid account number (min 3 characters)', 'error');
            return;
        }

        if (!this.validateInput(billAmount.toString(), 'currency', { max: 100000 })) {
            this.showNotification('Please enter a valid bill amount (₱1 - ₱100,000)', 'error');
            return;
        }

        if (!dueDate) {
            this.showNotification('Please select a due date', 'error');
            return;
        }

        if (!this.validateInput(description, 'text', { minLength: 3 })) {
            this.showNotification('Please enter a valid bill description', 'error');
            return;
        }

        // Check balance
        if (billAmount > this.userData.balance) {
            this.showNotification(
                `Insufficient balance! Current: ₱${this.userData.balance.toFixed(2)}, Need: ₱${(billAmount - this.userData.balance).toFixed(2)} more`,
                'error'
            );
            return;
        }

        const verified = await this.promptPayBillSecurity();
        if (!verified) return;

        // Create bill record with smart categorization
        const bill = {
            id: Date.now(),
            accountNumber,
            amount: billAmount,
            dueDate,
            description,
            paymentDate: new Date().toISOString(),
            status: 'Paid',
            type: 'bill',
            referenceNo: this.generateReferenceNumber(),
            category: this.smartCategorizeTransaction(description),
            tags: [],
            notes: ''
        };

        // Process payment
        this.userData.balance -= billAmount;
        this.userData.transactions.push(bill);
        this.userData.bills.push(bill);
        this.saveUserData();

        // Reset form
        document.querySelector('.payment-form').reset();
        
        this.showNotification(
            `Payment of ₱${billAmount.toFixed(2)} successful! Ref: ${bill.referenceNo}`,
            'success'
        );
        
        this.updateDashboard();
    }

    // ===== ADD FUNDS =====
    async addFunds(event) {
        if (event) event.preventDefault();

        const addAmount = parseFloat(document.getElementById('addFundsAmount')?.value);

        if (isNaN(addAmount) || addAmount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (addAmount > 100000) {
            this.showNotification('Maximum amount per transaction is ₱100,000', 'error');
            return;
        }

        // Require email + password + PIN (frontend-only flow)
        const verified = await this.promptAddFundsSecurity();
        if (!verified) return;

        const fundTransaction = {
            id: Date.now(),
            amount: addAmount,
            type: 'deposit',
            date: new Date().toISOString(),
            referenceNo: this.generateReferenceNumber()
        };

        this.userData.balance += addAmount;
        this.userData.addFundsHistory.push(fundTransaction);
        this.saveUserData();

        if (document.getElementById('addFundsAmount')) {
            document.getElementById('addFundsAmount').value = '';
        }

        this.showNotification(`Successfully added ₱${addAmount.toFixed(2)} to your wallet!`, 'success');
        this.updateDashboard();
    }

    // ===== DASHBOARD UPDATES =====
    updateDashboard() {
        this.updateBalance();
        this.updateStats();
        this.updateBillHistory();
        this.checkOverdueBills();
        this.updateUpcomingBills();
    }

    updateBalance() {
        const balanceAmount = document.getElementById('balanceAmount');
        if (balanceAmount) {
            balanceAmount.textContent = '₱' + this.userData.balance.toFixed(2);
        }
    }

    updateStats() {
        // Pending bills
        const pendingBills = this.userData.bills.filter(bill => {
            return new Date(bill.dueDate) > new Date();
        });
        const pendingCount = document.getElementById('pendingBillsCount');
        if (pendingCount) pendingCount.textContent = pendingBills.length;

        // Total paid
        const totalPaid = this.userData.transactions.reduce((sum, trans) => sum + trans.amount, 0);
        const totalPaidEl = document.getElementById('totalPaid');
        if (totalPaidEl) totalPaidEl.textContent = '₱' + totalPaid.toFixed(2);

        // Recent transaction
        if (this.userData.transactions.length > 0) {
            const recent = this.userData.transactions[this.userData.transactions.length - 1];
            const recentEl = document.getElementById('recentTransaction');
            if (recentEl) recentEl.textContent = '₱' + recent.amount.toFixed(2);
        }
    }

    updateBillHistory() {
        const container = document.getElementById('billHistoryContainer');
        if (!container) return;

        const countEl = document.getElementById('historyCount');
        const summaryEl = document.getElementById('historySummary');

        const allItems = this.getHistoryItems();

        if (allItems.length === 0) {
            container.innerHTML = '<p class="no-data">No transactions yet. Start by paying a bill!</p>';
            if (countEl) countEl.textContent = '';
            if (summaryEl) summaryEl.innerHTML = '';
            return;
        }

        const items = this.getFilteredHistoryItems();

        if (countEl) {
            countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
        }

        if (summaryEl) {
            const totalIn = items.filter(i => i.kind === 'deposit').reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const totalOut = items.filter(i => i.kind === 'bill').reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const net = totalIn - totalOut;
            const netClass = net >= 0 ? 'positive' : 'negative';

            summaryEl.innerHTML = `
                <div class="summary-card">
                    <div class="summary-label">Total In</div>
                    <div class="summary-value in">₱${totalIn.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Total Out</div>
                    <div class="summary-value out">₱${totalOut.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Net</div>
                    <div class="summary-value ${netClass}">₱${net.toFixed(2)}</div>
                </div>
            `;
        }

        if (items.length === 0) {
            container.innerHTML = '<p class="no-data">No results. Try a different search or filter.</p>';
            if (summaryEl) summaryEl.innerHTML = '';
            return;
        }

        container.innerHTML = items.map(it => {
            const d = new Date(it.dateIso);
            const dateLabel = d.toLocaleDateString();
            const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const icon = it.kind === 'deposit' ? 'plus' : 'bolt';
            const metaLine1 = it.kind === 'deposit'
                ? `${this.escapeHtml(it.accountNumber)} · Ref: ${this.escapeHtml(it.referenceNo)}`
                : `Account: ${this.escapeHtml(it.accountNumber)} · Ref: ${this.escapeHtml(it.referenceNo)}`;
            const metaLine2 = `${dateLabel} · ${timeLabel}`;

            const statusClass = it.kind === 'deposit' ? 'completed' : 'paid';
            const statusText = this.escapeHtml(it.status);
            const kindBadge = it.kind === 'deposit'
                ? '<span class="history-badge deposit">ADD FUNDS</span>'
                : '<span class="history-badge bill">BILL</span>';

            const receiptBtn = it.kind === 'bill'
                ? `<button class="btn-small" onclick="generatePDFReceipt(${it.id})"><i class="fas fa-receipt"></i> Receipt</button>`
                : '';

            return `
                <div class="bill-item ${it.kind}" role="listitem">
                    <div class="bill-info">
                        <div class="bill-icon">
                            <i class="fas fa-${icon}"></i>
                        </div>
                        <div class="bill-details">
                            <div class="history-title-row">
                                <h4>${this.escapeHtml(it.description)}</h4>
                                ${kindBadge}
                            </div>
                            <p class="history-meta">${metaLine1}</p>
                            <small class="history-meta">${metaLine2}</small>
                        </div>
                    </div>
                    <div class="bill-amount">
                        <span class="amount">₱${it.amount.toFixed(2)}</span>
                        <div class="bill-actions">
                            ${receiptBtn}
                            <span class="status ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateUpcomingBills() {
        const container = document.getElementById('upcomingBillsContainer');
        if (!container) return;

        const countEl = document.getElementById('upcomingCount');

        const query = (this.state.upcomingFilters?.query || '').trim().toLowerCase();
        const statusFilter = this.state.upcomingFilters?.status || 'all';
        const sort = this.state.upcomingFilters?.sort || 'due_soon';
        const rangeKey = this.state.upcomingFilters?.range || '30d';

        const range = this.getUpcomingRange(rangeKey);

        let upcomingBills = (this.userData.bills || []).filter(bill => {
            const dueDate = new Date(bill.dueDate);
            const dueMs = dueDate.getTime();
            if (!Number.isFinite(dueMs)) return false;

            if (range.mode === 'overdue') {
                return dueMs < range.end;
            }
            if (range.mode === 'window') {
                return dueMs >= range.start && dueMs <= range.end;
            }
            return true;
        });

        if (statusFilter !== 'all') {
            upcomingBills = upcomingBills.filter(b => {
                const isPaid = (b.status || '').toLowerCase() === 'paid';
                return statusFilter === 'paid' ? isPaid : !isPaid;
            });
        }

        if (query) {
            upcomingBills = upcomingBills.filter(b => {
                const hay = `${b.description || ''} ${b.accountNumber || ''}`.toLowerCase();
                return hay.includes(query);
            });
        }

        const dueAsc = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
        const dueDesc = (a, b) => new Date(b.dueDate) - new Date(a.dueDate);

        if (sort === 'due_late') {
            upcomingBills.sort(dueDesc);
        } else if (sort === 'amount_desc') {
            upcomingBills.sort((a, b) => (Number(b.amount) - Number(a.amount)) || dueAsc(a, b));
        } else if (sort === 'amount_asc') {
            upcomingBills.sort((a, b) => (Number(a.amount) - Number(b.amount)) || dueAsc(a, b));
        } else {
            upcomingBills.sort(dueAsc);
        }

        if (countEl) {
            countEl.textContent = `${upcomingBills.length} item${upcomingBills.length !== 1 ? 's' : ''}`;
        }

        if (upcomingBills.length === 0) {
            container.innerHTML = '<p class="no-data">No upcoming bills</p>';
            return;
        }

        container.innerHTML = upcomingBills.map(bill => {
            const dueDate = new Date(bill.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const urgency = daysUntilDue <= 3 ? 'urgent' : daysUntilDue <= 7 ? 'warning' : 'normal';
            const isPaid = (bill.status || '').toLowerCase() === 'paid';
            const badgeText = isPaid ? 'Paid' : 'Unpaid';
            const badgeClass = isPaid ? 'paid' : 'unpaid';
            const safeAmount = Number(bill.amount) || 0;

            const actionBtn = isPaid
                ? `<button type="button" class="upcoming-action" disabled aria-disabled="true"><i class="fas fa-check"></i> Paid</button>`
                : `<button type="button" class="upcoming-action" onclick="markUpcomingBillPaid(${bill.id})"><i class="fas fa-check-circle"></i> Mark Paid</button>`;

            return `
                <div class="upcoming-bill ${urgency}">
                    <div class="bill-header">
                        <strong>${this.escapeHtml(bill.description)}</strong>
                        <span class="due-badge">${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="bill-footer">
                        <span>₱${safeAmount.toFixed(2)}</span>
                        <span>${dueDate.toLocaleDateString()}</span>
                    </div>
                    <div class="upcoming-footer">
                        <span class="upcoming-status ${badgeClass}">${badgeText}</span>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    }

    checkOverdueBills() {
        const now = new Date();
        const overdueBills = this.userData.bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate < now && bill.status !== 'Paid';
        });

        const notificationContainer = document.getElementById('dashboardNotificationContainer') || this.getNotificationContainer();
        if (!notificationContainer) return;

        // Clear only overdue notifications
        const overdueNotifs = notificationContainer.querySelectorAll('.notification.overdue');
        overdueNotifs.forEach(el => el.remove());

        overdueBills.forEach(bill => {
            const daysOverdue = Math.floor((now - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24));
            const notification = document.createElement('div');
            notification.className = 'notification overdue warning';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>⚠️ Payment Overdue by ${daysOverdue} day(s)</strong>
                        <p>Account: ${this.escapeHtml(bill.accountNumber)} | Amount: ₱${bill.amount.toFixed(2)} | Due: ${new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="close-notification" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
            `;
            notificationContainer.appendChild(notification);
        });
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = this.getNotificationContainer();
        if (!container) return;

        const notification = document.createElement('div');
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        // Generate unique ID for notification
        const notificationId = `notification-${Date.now()}`;
        notification.id = notificationId;
        notification.className = `notification ${type} notification-enter`;
        
        const titleText = type.charAt(0).toUpperCase() + type.slice(1);
        const progressBar = duration > 0 ? `<div class="notification-progress"></div>` : '';
        
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
                </div>
                <div class="notification-message">
                    <strong class="notification-title">${titleText}</strong>
                    <p class="notification-text">${this.escapeHtml(message)}</p>
                </div>
            </div>
            <button class="notification-close" onclick="document.getElementById('${notificationId}').remove()">
                <i class="fas fa-times"></i>
            </button>
            ${progressBar}
        `;
        
        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.remove('notification-enter');
            notification.classList.add('notification-show');
        }, 10);

        // Auto-dismiss with progress bar animation
        if (duration > 0) {
            const progressElement = notification.querySelector('.notification-progress');
            if (progressElement) {
                progressElement.style.animation = `slideOut ${duration}ms linear forwards`;
            }

            setTimeout(() => {
                notification.classList.remove('notification-show');
                notification.classList.add('notification-exit');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        }
    }

    // ===== UTILITIES =====
    generateReferenceNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `REF-${timestamp}-${random}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fil-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }

    downloadStatement() {
        let csv = 'Transaction Report\n';
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Account Holder: ${this.userData.name}\n`;
        csv += `Current Balance: ₱${this.userData.balance.toFixed(2)}\n\n`;
        csv += 'Date,Description,Account,Amount,Status\n';

        this.userData.transactions.forEach(trans => {
            const date = new Date(trans.paymentDate).toLocaleDateString();
            csv += `${date},${trans.description},${trans.accountNumber},₱${trans.amount.toFixed(2)},${trans.status}\n`;
        });

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `statement-${Date.now()}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.showNotification('Statement downloaded successfully!', 'success');
    }

    // ===== STORAGE MANAGEMENT =====
    saveUserData() {
        this.saveToStorage('userData', JSON.stringify(this.userData));
    }

    loadUserData() {
        const stored = this.getFromStorage('userData');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Merge into defaults so missing keys (like settings.darkMode) don't break UI.
                this.userData = this.deepMerge(this.userData, parsed);
            } catch (e) {
                console.warn('Failed to parse stored userData; using defaults.', e);
            }
        }

        // Guarantee settings exists.
        this.userData.settings = this.userData.settings || {};
        if (typeof this.userData.settings.darkMode !== 'boolean') {
            this.userData.settings.darkMode = (this.getFromStorage('darkMode') === 'true');
        }
    }

    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage error:', e);
            this.showNotification('Storage error occurred', 'error');
        }
    }

    getFromStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    }

    clearAllData() {
        if (confirm('This will delete all your data. Are you sure?')) {
            localStorage.clear();
            this.userData = {
                name: '',
                email: '',
                balance: 5000,
                bills: [],
                transactions: [],
                addFundsHistory: [],
                budget: {
                    monthlyLimit: 10000,
                    currentSpent: 0,
                    category: {}
                },
                settings: {
                    darkMode: false,
                    currency: '₱',
                    timezone: 'Asia/Manila'
                },
                createdAt: new Date().toISOString()
            };
            this.showNotification('All data cleared', 'info');
            this.logout();
        }
    }

    // ===== DARK MODE =====
    toggleDarkMode() {
        this.setDarkMode(!this.userData.settings.darkMode);
    }

    setDarkMode(isDark) {
        this.userData.settings.darkMode = Boolean(isDark);
        this.saveSetting('darkMode', this.userData.settings.darkMode);
        this.saveToStorage('darkMode', String(this.userData.settings.darkMode));
        this.applySavedTheme();
    }

    applySavedTheme() {
        const isDark = Boolean(this.userData?.settings?.darkMode);
        if (isDark) {
            document.body.classList.add('dark-mode');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = false;
        }
    }

    saveSetting(key, value) {
        this.userData.settings[key] = value;
        this.saveUserData();
    }

    // ===== MODAL CONTROL =====
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        if (modal && overlay) {
            this._lastFocusedElement = document.activeElement;
            modal.classList.remove('hidden');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                const focusable = modal.querySelector('input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])');
                focusable?.focus?.();
            }, 50);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        if (modal && overlay) {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';

            try {
                this._lastFocusedElement?.focus?.();
            } catch (_) {}
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modalOverlay');
        modals.forEach(modal => modal.classList.add('hidden'));
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';

        try {
            this._lastFocusedElement?.focus?.();
        } catch (_) {}
    }

    // ===== BUDGET MANAGEMENT =====
    setBudget(event) {
        event.preventDefault();

        const monthlyLimit = parseFloat(document.getElementById('budgetLimit')?.value);

        if (isNaN(monthlyLimit) || monthlyLimit <= 0) {
            this.showNotification('Please enter a valid budget limit', 'error');
            return;
        }

        this.userData.budget.monthlyLimit = monthlyLimit;
        this.saveUserData();
        this.updateBudgetDisplay();
        this.showNotification(`Budget set to ₱${monthlyLimit.toFixed(2)}`, 'success');
    }

    updateBudgetDisplay() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentSpent = this.userData.transactions
            .filter(t => t.paymentDate.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const budgetBar = document.getElementById('budgetProgressBar');
        const budgetText = document.getElementById('budgetText');
        const budgetInput = document.getElementById('budgetLimit');

        if (budgetBar && budgetText) {
            const percentage = Math.min((currentSpent / this.userData.budget.monthlyLimit) * 100, 100);
            budgetBar.style.width = percentage + '%';
            budgetBar.className = 'budget-bar ' + (percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'safe');
            budgetText.textContent = `₱${currentSpent.toFixed(2)} / ₱${this.userData.budget.monthlyLimit.toFixed(2)}`;

            if (percentage > 100) {
                this.showNotification(`Budget exceeded! You've spent ₱${(currentSpent - this.userData.budget.monthlyLimit).toFixed(2)} over budget`, 'warning');
            }
        }

        if (budgetInput) {
            budgetInput.value = this.userData.budget.monthlyLimit;
        }
    }

    // ===== TRANSACTION FILTERING & SEARCH =====
    filterTransactions(event) {
        event.preventDefault();

        const searchTerm = document.getElementById('searchTerm')?.value.toLowerCase() || '';
        const filterType = document.getElementById('filterType')?.value || 'all';
        const filterStatus = document.getElementById('filterStatus')?.value || 'all';
        const startDate = document.getElementById('filterStartDate')?.value;
        const endDate = document.getElementById('filterEndDate')?.value;
        const minAmount = parseFloat(document.getElementById('filterMinAmount')?.value) || 0;
        const maxAmount = parseFloat(document.getElementById('filterMaxAmount')?.value) || Infinity;

        this.filteredTransactions = this.userData.transactions.filter(trans => {
            const matchSearch = !searchTerm || 
                trans.description.toLowerCase().includes(searchTerm) ||
                trans.accountNumber.toLowerCase().includes(searchTerm) ||
                trans.referenceNo.toLowerCase().includes(searchTerm);

            const matchType = filterType === 'all' || trans.type === filterType;
            const matchStatus = filterStatus === 'all' || trans.status === filterStatus;
            const matchAmount = trans.amount >= minAmount && trans.amount <= maxAmount;
            
            const transDate = trans.paymentDate.slice(0, 10);
            const matchDate = (!startDate || transDate >= startDate) && (!endDate || transDate <= endDate);

            return matchSearch && matchType && matchStatus && matchAmount && matchDate;
        });

        this.displayFilteredTransactions();
        this.showNotification(`Found ${this.filteredTransactions.length} transactions`, 'info');
    }

    displayFilteredTransactions() {
        const container = document.getElementById('filteredTransactionsContainer');
        if (!container) return;

        if (this.filteredTransactions.length === 0) {
            container.innerHTML = '<p class="no-data">No transactions match your filters</p>';
            return;
        }

        container.innerHTML = this.filteredTransactions.map(trans => {
            const transDate = new Date(trans.paymentDate);
            return `
                <div class="filtered-transaction-item">
                    <div class="trans-icon">
                        <i class="fas fa-${trans.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div class="trans-details">
                        <h4>${this.escapeHtml(trans.description)}</h4>
                        <p>${this.escapeHtml(trans.accountNumber)} | ${trans.referenceNo}</p>
                        <small>${transDate.toLocaleString()}</small>
                    </div>
                    <div class="trans-amount ${trans.type}">
                        ${trans.type === 'deposit' ? '+' : '-'}₱${trans.amount.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }

    clearFilters() {
        document.getElementById('searchTerm').value = '';
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterStatus').value = 'all';
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        document.getElementById('filterMinAmount').value = '';
        document.getElementById('filterMaxAmount').value = '';
        this.filteredTransactions = [];
        document.getElementById('filteredTransactionsContainer').innerHTML = '<p class="no-data">Use filters to search transactions</p>';
    }

    // ===== CHARTS & ANALYTICS =====
    initializeCharts() {
        // Load Chart.js library
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.drawCharts();
            document.head.appendChild(script);
        } else {
            this.drawCharts();
        }
    }

    drawCharts() {
        this.drawSpendingChart();
        this.drawCategoryChart();
        this.drawComparisonChart();
    }

    drawSpendingChart() {
        const ctx = document.getElementById('spendingChart');
        if (!ctx) return;

        const last12Months = [];
        const spendingData = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7);
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            last12Months.push(monthLabel);
            
            const spent = this.userData.transactions
                .filter(t => t.paymentDate.startsWith(monthKey))
                .reduce((sum, t) => sum + t.amount, 0);
            
            spendingData.push(spent);
        }

        if (this.charts.spending) {
            this.charts.spending.destroy();
        }

        this.charts.spending = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last12Months,
                datasets: [{
                    label: 'Monthly Spending',
                    data: spendingData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' },
                        grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' },
                        grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    drawCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categories = {};
        this.userData.transactions.forEach(trans => {
            const category = trans.category || this.smartCategorizeTransaction(trans.description);
            categories[category] = (categories[category] || 0) + trans.amount;
        });

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c',
                        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                    ],
                    borderColor: document.body.classList.contains('dark-mode') ? '#2a2a2a' : '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' }
                    }
                }
            }
        });
    }

    drawComparisonChart() {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthKey = lastMonth.toISOString().slice(0, 7);

        const currentSpent = this.userData.transactions
            .filter(t => t.paymentDate.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const lastSpent = this.userData.transactions
            .filter(t => t.paymentDate.startsWith(lastMonthKey))
            .reduce((sum, t) => sum + t.amount, 0);

        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['This Month', 'Last Month'],
                datasets: [{
                    label: 'Spending',
                    data: [currentSpent, lastSpent],
                    backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(102, 126, 234, 0.4)'],
                    borderColor: '#667eea',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' },
                        grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        ticks: { color: document.body.classList.contains('dark-mode') ? '#fff' : '#333' },
                        grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    // ===== PDF RECEIPT GENERATION =====
    generatePDFReceipt(transactionId) {
        const trans = this.userData.transactions.find(t => t.id === transactionId);
        if (!trans) {
            this.showNotification('Transaction not found', 'error');
            return;
        }

        const transDate = new Date(trans.paymentDate);
        let pdfContent = `
            ╔════════════════════════════════════╗
            ║       E-WALLET PAYMENT RECEIPT      ║
            ╚════════════════════════════════════╝
            
            Reference No: ${trans.referenceNo}
            Date: ${transDate.toLocaleString()}
            
            ────────────────────────────────────
            PAYMENT DETAILS
            ────────────────────────────────────
            Account Name: ${this.escapeHtml(this.userData.name)}
            Email: ${this.userData.email}
            
            Biller: ${this.escapeHtml(trans.description)}
            Account Number: ${this.escapeHtml(trans.accountNumber)}
            
            ────────────────────────────────────
            AMOUNT
            ────────────────────────────────────
            Amount Paid: ₱${trans.amount.toFixed(2)}
            Status: ${trans.status}
            
            ────────────────────────────────────
            Thank you for your payment!
            ════════════════════════════════════
        `;

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
        element.setAttribute('download', `receipt-${trans.referenceNo}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.showNotification('Receipt downloaded!', 'success');
    }

    // ===== ENHANCED PAYMENT =====
    payElectricityBill(event) {
        event.preventDefault();

        const accountNumber = document.getElementById('accountNumber').value.trim();
        const billAmount = parseFloat(document.getElementById('billAmount').value);
        const dueDate = document.getElementById('dueDate').value;
        const description = document.getElementById('description').value.trim();

        // Enhanced validation
        if (!accountNumber || accountNumber.length < 3) {
            this.showNotification('Please enter a valid account number', 'error');
            return;
        }

        if (isNaN(billAmount) || billAmount <= 0 || billAmount > 100000) {
            this.showNotification('Please enter a valid amount (₱1 - ₱100,000)', 'error');
            return;
        }

        if (!dueDate) {
            this.showNotification('Please select a due date', 'error');
            return;
        }

        if (!description) {
            this.showNotification('Please enter a bill description', 'error');
            return;
        }

        if (billAmount > this.userData.balance) {
            this.showNotification(
                `Insufficient balance! Current: ₱${this.userData.balance.toFixed(2)}, Need: ₱${(billAmount - this.userData.balance).toFixed(2)} more`,
                'error'
            );
            return;
        }

        const bill = {
            id: Date.now(),
            accountNumber,
            amount: billAmount,
            dueDate,
            description,
            paymentDate: new Date().toISOString(),
            status: 'Paid',
            type: 'bill',
            referenceNo: this.generateReferenceNumber(),
            category: 'Utilities'
        };

        this.userData.balance -= billAmount;
        this.userData.transactions.push(bill);
        this.userData.bills.push(bill);
        this.saveUserData();

        document.querySelector('.payment-form').reset();
        this.showNotification(
            `Payment of ₱${billAmount.toFixed(2)} successful! Ref: ${bill.referenceNo}`,
            'success'
        );
        this.updateDashboard();
    }
}

// Initialize the app
const app = new EWalletApp();
app.init();

// ===== NAVIGATION HELPERS =====
function scrollToSection(sectionId) {
    // New UX: prefer view switching over scrolling
    if (typeof window.showDashboardView === 'function') {
        const sectionToView = {
            dashboardOverview: 'overview',
            billHistorySection: 'history',
            upcomingBillsSection: 'upcoming'
        };
        const mapped = sectionToView[sectionId];
        if (mapped) {
            window.showDashboardView(mapped);
            return;
        }
    }

    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumbCurrent');
        const sectionNames = {
            'dashboardOverview': 'Dashboard',
            'analyticsSection': 'Analytics',
            'billHistorySection': 'History'
        };
        if (breadcrumb) breadcrumb.textContent = sectionNames[sectionId] || 'Dashboard';
    }
}

// Global functions for HTML event handlers
function toggleForms() { app.toggleForms(); }
function showWelcome() { app.showWelcome(); }
function showLoginForm() { app.showLoginForm(); }
function showRegisterForm() { app.showRegisterForm(); }
function goToDashboard() { 
    try {
        app.userData.name = app.userData.name || 'User';
        app.saveToStorage('userName', app.userData.name);
        
        // Hide all sections
        document.getElementById('welcomeSection')?.classList.add('hidden');
        document.getElementById('loginSection')?.classList.add('hidden');
        document.getElementById('registerSection')?.classList.add('hidden');
        
        // Show dashboard
        document.getElementById('dashboardSection')?.classList.remove('hidden');
        
        // Update dashboard content
        document.getElementById('userName').textContent = app.userData.name;
        app.updateDashboard();
        app.initializeCharts();
    } catch(err) {
        console.error('Error navigating to dashboard:', err);
    }
}
function handleLogin(e) { app.handleLogin(e); }
function handleRegister(e) { app.handleRegister(e); }
function logout() { app.logout(); }
async function payElectricityBill(e) { await app.payElectricityBill(e); }
async function addFunds(e) { await app.addFunds(e); }
function downloadStatement() { app.downloadStatement(); }
function markUpcomingBillPaid(billId) { return app.markUpcomingBillPaid(billId); }
function toggleDarkMode() { app.toggleDarkMode(); }
function setBudget(e) { app.setBudget(e); }
function filterTransactions(e) { app.filterTransactions(e); }
function clearFilters() { app.clearFilters(); }
function generatePDFReceipt(id) { app.generatePDFReceipt(id); }
function openModal(modalId) { app.openModal(modalId); if(modalId === 'profileModal') app.loadProfileData(); }
function closeModal(modalId) { app.closeModal(modalId); }
function closeAllModals() { app.closeAllModals(); }
function saveProfileChanges(e) { e.preventDefault(); app.saveProfileChanges(); }
function changePassword(e) { e.preventDefault(); app.changePassword(); }
function setPlatformPin(e) { app.setPlatformPin(e); }
function verifyPlatformPin(e) { app.verifyPlatformPin(e); }
function cancelPinVerification() { app.cancelPinVerification(); }
function verifyAddFundsSecurity(e) { app.verifyAddFundsSecurity(e); }
function cancelAddFundsSecurity() { app.cancelAddFundsSecurity(); }
function verifyPayBillSecurity(e) { app.verifyPayBillSecurity(e); }
function cancelPayBillSecurity() { app.cancelPayBillSecurity(); }
async function setPlatformPin(e) { await app.setPlatformPin(e); }
async function verifyPlatformPin(e) { await app.verifyPlatformPin(e); }
function cancelPinVerification() { app.cancelPinVerification(); }

// ===== PASSWORD STRENGTH INDICATOR =====
function checkPasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthText = document.getElementById('strengthText').querySelector('span');
    
    if (!strengthMeter) return;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    strengthMeter.className = 'strength-meter';
    
    if (strength === 0) {
        strengthMeter.classList.add('weak');
        strengthText.textContent = 'weak';
    } else if (strength <= 2) {
        strengthMeter.classList.add('fair');
        strengthText.textContent = 'fair';
    } else if (strength <= 3) {
        strengthMeter.classList.add('good');
        strengthText.textContent = 'good';
    } else {
        strengthMeter.classList.add('strong');
        strengthText.textContent = 'strong';
    }
    
    strengthMeter.style.width = (strength * 20) + '%';
}

// ===== MODAL SWITCHING =====
function switchAuthModal(showModal, hideModal) {
    closeModal(hideModal);
    setTimeout(() => openModal(showModal), 300);
}

// Add event listener for password strength when page loads
document.addEventListener('DOMContentLoaded', function() {
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', checkPasswordStrength);
    }
    
    // Pre-fill email if remembered
    const rememberEmail = localStorage.getItem('rememberEmail');
    if (rememberEmail) {
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
            loginEmail.value = rememberEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }

    // Balance menu toggle
    const balanceMenuToggle = document.querySelector('.balance-menu-toggle');
    const balanceDropdown = document.querySelector('.balance-dropdown');
    
    if (balanceMenuToggle && balanceDropdown) {
        balanceMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            balanceDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.balance-menu')) {
                balanceDropdown.classList.remove('active');
            }
        });
    }
});

// ===== CLEAR DATA FUNCTION =====
function clearAllData() {
    const confirmed = confirm('⚠️ WARNING: This will delete ALL your data including:\n\n• Account balance\n• Bills history\n• Transactions\n• User profile\n\nThis action CANNOT be undone. Continue?');
    
    if (confirmed) {
        const finalConfirm = confirm('🔒 Final confirmation: Delete all data permanently?');
        
        if (finalConfirm) {
            try {
                // Clear localStorage
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userData');
                localStorage.removeItem('authToken');
                localStorage.removeItem('rememberEmail');
                
                // Clear sessionStorage
                sessionStorage.clear();
                
                // Show success message
                app.showNotification('success', 'Data Cleared', 'All data has been permanently deleted. Redirecting to welcome screen...');
                
                // Redirect after short delay
                setTimeout(() => {
                    // Reset app state
                    app.userData = {
                        name: '',
                        email: '',
                        balance: 0,
                        bills: [],
                        transactions: [],
                        addFundsHistory: [],
                        budget: {
                            monthlyLimit: 10000,
                            currentSpent: 0,
                            category: {}
                        },
                        settings: {
                            darkMode: false,
                            currency: '₱',
                            timezone: 'Asia/Manila',
                            notificationsEnabled: true,
                            autoLogout: true,
                            sessionTimeout: 30
                        },
                        createdAt: new Date().toISOString(),
                        categoryMap: {
                            'electricity': ['ORMECO', 'power', 'electric', 'bolt', 'meralco'],
                            'water': ['water', 'MWSS', 'H2O', 'maynilad'],
                            'internet': ['internet', 'broadband', 'ISP', 'wifi', 'globe', 'smart'],
                            'utilities': ['utility', 'gas', 'phone', 'mobile'],
                            'transportation': ['transport', 'taxi', 'bus', 'transit'],
                            'other': []
                        }
                    };
                    
                    app.state.isAuthenticated = false;
                    
                    // Hide dashboard, show welcome
                    const dashboardSection = document.getElementById('dashboardSection');
                    const welcomeSection = document.getElementById('welcomeSection');
                    
                    if (dashboardSection) dashboardSection.classList.add('hidden');
                    if (welcomeSection) welcomeSection.classList.remove('hidden');
                    
                    // Close dropdown
                    const balanceDropdown = document.querySelector('.balance-dropdown');
                    if (balanceDropdown) balanceDropdown.classList.remove('active');
                }, 1500);
            } catch (error) {
                app.showNotification('error', 'Error', 'Failed to clear data: ' + error.message);
            }
        }
    }
}

// ===== EXPORT DATA FUNCTION =====
function exportData() {
    try {
        const exportedData = {
            user: app.userData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // Create JSON string
        const dataStr = JSON.stringify(exportedData, null, 2);
        
        // Create blob
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `amepso-export-${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        app.showNotification('success', 'Export Complete', 'Your data has been exported as JSON file.');
        
        // Close dropdown
        const balanceDropdown = document.querySelector('.balance-dropdown');
        if (balanceDropdown) balanceDropdown.classList.remove('active');
    } catch (error) {
        app.showNotification('error', 'Export Failed', 'Failed to export data: ' + error.message);
    }
}

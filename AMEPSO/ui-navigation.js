// Mobile-first navigation: bottom tabs + view switching.
// Kept separate from index.js so UI navigation logic stays modular.

(() => {
    const VIEW_LABELS = {
        overview: 'Dashboard',
        history: 'History',
        upcoming: 'Upcoming Bills',
        more: 'More'
    };

    function setTitle(viewId) {
        const title = document.getElementById('breadcrumbCurrent');
        if (!title) return;
        title.textContent = VIEW_LABELS[viewId] || 'Dashboard';
    }

    function setActiveTab(viewId) {
        const tabs = document.querySelectorAll('#bottomNav .tab-btn[data-view]');
        tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
    }

    function showDashboardView(viewId) {
        const views = document.querySelectorAll('#dashboardSection .dashboard-view');
        if (!views.length) return;

        let matched = false;
        views.forEach(view => {
            const isActive = view.dataset.view === viewId;
            view.classList.toggle('active', isActive);
            if (isActive) matched = true;
        });

        const finalViewId = matched ? viewId : 'overview';
        if (!matched) {
            views.forEach(view => view.classList.toggle('active', view.dataset.view === finalViewId));
        }

        setActiveTab(finalViewId);
        setTitle(finalViewId);

        const activeView = Array.from(views).find(v => v.classList.contains('active'));
        if (activeView) activeView.scrollTop = 0;

        const main = document.getElementById('mobileMain');
        if (main) main.scrollTop = 0;
    }

    function handleNavClick(event) {
        const target = event.target.closest('[data-view],[data-modal],[data-action]');
        if (!target) return;

        // Only handle dashboard clicks.
        const dashboard = document.getElementById('dashboardSection');
        if (!dashboard || dashboard.classList.contains('hidden')) return;
        if (!dashboard.contains(target)) return;

        event.preventDefault?.();

        const viewId = target.dataset.view;
        const modalId = target.dataset.modal;
        const actionName = target.dataset.action;

        if (viewId) {
            showDashboardView(viewId);
            return;
        }

        if (modalId && typeof window.openModal === 'function') {
            window.openModal(modalId);
            return;
        }

        if (actionName && typeof window[actionName] === 'function') {
            window[actionName]();
        }
    }

    function initDashboardNavigation() {
        const dashboard = document.getElementById('dashboardSection');
        if (!dashboard) return;

        dashboard.removeEventListener('click', handleNavClick);
        dashboard.addEventListener('click', handleNavClick);

        const activeTab = document.querySelector('#bottomNav .tab-btn.active[data-view]');
        showDashboardView(activeTab?.dataset?.view || 'overview');
    }

    window.showDashboardView = showDashboardView;
    window.initDashboardNavigation = initDashboardNavigation;

    document.addEventListener('DOMContentLoaded', () => {
        initDashboardNavigation();
    });
})();

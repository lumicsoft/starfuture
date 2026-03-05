document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname;
    const isAuthPage = document.getElementById('auth-page') || path.includes('register.html') || path.includes('login.html');
    
    // --- 1. Footer Loader Logic (Naya Add Kiya) ---
    // Ye check karega agar page par 'footer-placeholder' hai toh footer.html load kar dega
    const footerElem = document.getElementById('footer-placeholder');
    if (footerElem) {
        fetch('footer.html')
            .then(response => response.text())
            .then(data => {
                footerElem.innerHTML = data;
                if (window.lucide) window.lucide.createIcons();
            })
            .catch(err => console.error("Footer load nahi ho paya:", err));
    }

    if (isAuthPage) return;

    // --- 2. Desktop Navigation (StarFuture Branded) ---
    const navHTML = `
        <nav class="fixed top-0 left-0 w-full z-[100] bg-black/40 backdrop-blur-md border-b border-white/5">
            <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div class="flex items-center gap-2 cursor-pointer" onclick="location.href='index1.html'">
                    <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-3">
                        <i data-lucide="star" class="text-black w-6 h-6 fill-black"></i>
                    </div>
                    <div class="flex flex-col leading-none">
                        <span class="text-xl font-black orbitron tracking-tighter uppercase text-white">STAR</span>
                        <span class="text-[10px] font-bold orbitron tracking-[0.3em] text-yellow-500">FUTURE</span>
                    </div>
                </div>
                
                <div class="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onclick="location.href='index1.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron uppercase transition-all ${path.includes('index1.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">Dashboard</button>
                    <button onclick="location.href='referral.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron uppercase transition-all ${path.includes('referral.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">Team</button>
                    <button onclick="location.href='leadership.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron uppercase transition-all ${path.includes('leadership.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">Clubs</button>
                    <button onclick="location.href='history.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron uppercase transition-all ${path.includes('history.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">History</button>
                </div>

                <div class="flex items-center gap-2">
                    <button id="connect-btn" onclick="handleLogin()" class="px-5 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[10px] font-black orbitron hover:bg-yellow-500 hover:text-black transition-all text-yellow-500 uppercase tracking-widest">Connect Wallet</button>
                    <button onclick="handleLogout()" class="hidden md:flex w-9 h-9 items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <i data-lucide="power" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </nav>
        <div class="h-20"></div>
    `;

    // --- 3. Mobile Navigation ---
    const mobileNavHTML = `
        <div id="menu-overlay" onclick="toggleMobileMenu()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] hidden transition-all duration-300"></div>
        <div id="mobile-drawer" class="fixed bottom-0 left-0 w-full bg-[#0a0a0a] border-t border-yellow-500/20 rounded-t-[35px] z-[9999] translate-y-full transition-transform duration-500 ease-in-out p-8 shadow-[0_-20px_50px_rgba(234,179,8,0.15)]">
            <div class="flex flex-col gap-4">
                <div class="w-16 h-1.5 bg-yellow-500/20 rounded-full mx-auto mb-6"></div>
                <button onclick="location.href='leadership.html'" class="flex items-center justify-between p-5 bg-white/5 rounded-2xl text-gray-300 orbitron text-xs font-bold border border-white/5">
                    <div class="flex items-center gap-4"><i data-lucide="crown" class="w-5 h-5 text-yellow-500"></i> ROYALTY CLUBS</div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
                </button>
                <button onclick="location.href='history.html'" class="flex items-center justify-between p-5 bg-white/5 rounded-2xl text-gray-300 orbitron text-xs font-bold border border-white/5">
                    <div class="flex items-center gap-4"><i data-lucide="refresh-ccw" class="w-5 h-5 text-blue-500"></i> P2P TRANSACTIONS</div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
                </button>
                <button onclick="handleLogout()" class="flex items-center gap-4 p-5 bg-red-500/10 rounded-2xl text-red-500 orbitron text-xs font-bold border border-red-500/10 mt-2">
                    <i data-lucide="log-out" class="w-5 h-5"></i> DISCONNECT WALLET
                </button>
                <button onclick="toggleMobileMenu()" class="mt-4 py-2 text-gray-600 orbitron text-[10px] font-black uppercase tracking-[0.3em]">Dismiss</button>
            </div>
        </div>
        <div class="fixed bottom-6 left-6 right-6 md:hidden z-[9000]">
            <div class="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex justify-around items-center p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <a href="index1.html" class="flex flex-col items-center gap-1.5 ${path.includes('index1.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="layout-grid" class="w-5 h-5"></i>
                    <span class="text-[9px] font-bold orbitron uppercase tracking-wider">Home</span>
                </a>
                <a href="referral.html" class="flex flex-col items-center gap-1.5 ${path.includes('referral.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="users-2" class="w-5 h-5"></i>
                    <span class="text-[9px] font-bold orbitron uppercase tracking-wider">Team</span>
                </a>
                <button onclick="toggleMobileMenu()" class="flex flex-col items-center gap-1.5 text-gray-500">
                    <i data-lucide="align-right" class="w-5 h-5"></i>
                    <span class="text-[9px] font-bold orbitron uppercase tracking-wider">Menu</span>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);
    if (window.lucide) window.lucide.createIcons();
});

// Menu Toggle Function
window.toggleMobileMenu = function() {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('menu-overlay');
    if (drawer.classList.contains('translate-y-full')) {
        drawer.classList.remove('translate-y-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
    } else {
        drawer.classList.add('translate-y-full');
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

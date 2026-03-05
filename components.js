document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname;
    const isAuthPage = document.getElementById('auth-page') || path.includes('register.html') || path.includes('login.html');
    
    // --- 1. Footer Loader ---
    const footerElem = document.getElementById('footer-placeholder');
    if (footerElem) {
        fetch('footer.html')
            .then(response => response.text())
            .then(data => {
                footerElem.innerHTML = data;
                if (window.lucide) window.lucide.createIcons();
            })
            .catch(err => console.error("Footer error:", err));
    }

    if (isAuthPage) return;

    // --- 2. Desktop & Mobile Header (Logout shifted to Top) ---
    const navHTML = `
        <nav class="fixed top-0 left-0 w-full z-[100] bg-black/40 backdrop-blur-md border-b border-white/5">
            <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center gap-2 cursor-pointer" onclick="location.href='index1.html'">
                    <div class="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-3">
                        <i data-lucide="star" class="text-black w-5 h-5 fill-black"></i>
                    </div>
                    <div class="flex flex-col leading-none">
                        <span class="text-lg font-black orbitron tracking-tighter uppercase text-white">STAR</span>
                        <span class="text-[8px] font-bold orbitron tracking-[0.3em] text-yellow-500">FUTURE</span>
                    </div>
                </div>
                
                <div class="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onclick="location.href='index1.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron transition-all ${path.includes('index1.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">DASHBOARD</button>
                    <button onclick="location.href='referral.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron transition-all ${path.includes('referral.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">TEAM</button>
                    <button onclick="location.href='leadership.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron transition-all ${path.includes('leadership.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">CLUBS</button>
                    <button onclick="location.href='history.html'" class="px-4 py-2 rounded-lg text-[11px] font-bold orbitron transition-all ${path.includes('history.html') ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}">HISTORY</button>
                </div>

                <div class="flex items-center gap-2">
                    <button id="connect-btn" onclick="handleLogin()" class="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[9px] font-black orbitron text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all">CONNECT</button>
                    <button onclick="handleLogout()" class="w-9 h-9 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <i data-lucide="power" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </nav>
        <div class="h-20"></div>
    `;

    // --- 3. Mobile Bottom Navigation (4 Main Options) ---
    const mobileNavHTML = `
        <div id="menu-overlay" onclick="toggleMobileMenu()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] hidden transition-all duration-300"></div>

        <div id="mobile-drawer" class="fixed bottom-0 left-0 w-full bg-[#0a0a0a] border-t border-yellow-500/20 rounded-t-[35px] z-[9999] translate-y-full transition-transform duration-500 ease-in-out p-8 shadow-[0_-20px_50px_rgba(234,179,8,0.15)]">
            <div class="flex flex-col gap-4 text-center">
                <div class="w-16 h-1.5 bg-yellow-500/20 rounded-full mx-auto mb-4"></div>
                <p class="orbitron text-gray-500 text-[10px] uppercase font-bold tracking-widest">More Options</p>
                <button onclick="location.href='profile.html'" class="p-4 bg-white/5 rounded-2xl text-gray-300 orbitron text-xs font-bold border border-white/5">MY PROFILE</button>
                <button onclick="toggleMobileMenu()" class="mt-4 py-2 text-gray-600 orbitron text-[10px] font-black uppercase tracking-[0.3em]">Close</button>
            </div>
        </div>

        <div class="fixed bottom-6 left-4 right-4 md:hidden z-[9000]">
            <div class="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex justify-around items-center p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <a href="index1.html" class="flex flex-col items-center gap-1 ${path.includes('index1.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="layout-grid" class="w-5 h-5"></i>
                    <span class="text-[8px] font-bold orbitron uppercase tracking-tighter">Home</span>
                </a>
                <a href="referral.html" class="flex flex-col items-center gap-1 ${path.includes('referral.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="users-2" class="w-5 h-5"></i>
                    <span class="text-[8px] font-bold orbitron uppercase tracking-tighter">Team</span>
                </a>
                <a href="leadership.html" class="flex flex-col items-center gap-1 ${path.includes('leadership.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="crown" class="w-5 h-5"></i>
                    <span class="text-[8px] font-bold orbitron uppercase tracking-tighter">Clubs</span>
                </a>
                <a href="history.html" class="flex flex-col items-center gap-1 ${path.includes('history.html') ? 'text-yellow-500' : 'text-gray-500'}">
                    <i data-lucide="refresh-ccw" class="w-5 h-5"></i>
                    <span class="text-[8px] font-bold orbitron uppercase tracking-tighter">History</span>
                </a>
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

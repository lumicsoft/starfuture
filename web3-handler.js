let provider, signer, contract;

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0x0ffdA42a922aDbB3ACd26a532B0A40Cc42b3a520"; 
const USDT_TOKEN_ADDRESS = "0x3b66b1e08f55af26c8ea14a73da64b6bc8d799de"; // BSC USDT
const TESTNET_CHAIN_ID = 97; 
const REGISTRATION_FEE = "15";

// --- RANK CONFIG ---
const RANK_DETAILS = [
    { name: "NONE", roi: "0%", targetTeam: 0, targetVolume: 0 },
    { name: "Star1", roi: "1.00%", targetTeam: 1, targetVolume: 5 },
    { name: "Star2", roi: "2.00%", targetTeam: 2, targetVolume: 10 },
    { name: "Star3", roi: "3.00%", targetTeam: 3, targetVolume: 25 },
    { name: "Star4", roi: "4.00%", targetTeam: 4, targetVolume: 50},
    { name: "Star5", roi: "5.00%", targetTeam: 5, targetVolume: 100 },
    { name: "Kings Star", roi: "7.00%", targetTeam: 6, targetVolume: 500},
    { name: "Master King", roi: "7.50%", targetTeam: 7, targetVolume: 1000 }
];

// --- ABI (Exactly same + 2 history functions + 3 matrix functions) ---
const CONTRACT_ABI = [
    "function register(address _ref) external",
    "function withdraw(uint256 _amt) external",
    "function claimReward() external",
    "function isRegistered(address) view returns (bool)",
    "function referrer(address) view returns (address)",
    "function userStats(address, uint256) view returns (uint256)", 
    "function userIncomes(address, uint256) view returns (uint256)", 
    "function rewardFund() view returns (uint256)",
    "function getUserBasicStats(address _user) external view returns (uint256 team, uint256 directs, uint256 totalEarned)",
    "function getUserAccountStats(address _user) external view returns (string memory currentClub, uint256 availableBalance, uint256 withdrawn)",
    "function getMatrixIncomeReport(address _user) external view returns (uint256 dMagic, uint256 c1, uint256 c2, uint256 c3, uint256 c4)",
    "function getAdvancedIncomeReport(address _user) external view returns (uint256 g1, uint256 g2, uint256 g3, uint256 rwd)",
    "function getUserHistory(address _user) external view returns (tuple(string txType, uint256 amount, string detail, uint256 timestamp)[])",
    "function getLevelTeam(address _account, uint256 _level) external view returns (address[] memory)",
    // NEW MATRIX SYNC FUNCTIONS
    "function getMagicPoolCounts() external view returns (uint256[6])",
    "function getClubCounts() external view returns (uint256[4])",
    "function getGTCounts() external view returns (uint256[3])"
];

const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)", "function allowance(address owner, address spender) public view returns (uint256)"];

const calculateGlobalROI = () => 0.90;

function checkReferralURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refAddr = urlParams.get('ref');
    const refField = document.getElementById('reg-referrer');
    if (refAddr && ethers.utils.isAddress(refAddr) && refField) {
        refField.value = refAddr;
    }
}

async function init() {
    checkReferralURL();
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            window.signer = provider.getSigner();
            signer = window.signer;
            window.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            contract = window.contract;

            if (accounts && accounts.length > 0) {
                if (localStorage.getItem('manualLogout') !== 'true') {
                    await setupApp(accounts[0]);
                } else {
                    updateNavbar(accounts[0]);
                }
            }
        } catch (error) { console.error("Init Error", error); }
    } else { alert("Wallet not detected!"); }
}

window.checkWalletSilently = async function() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) return accounts[0];
    }
    return null;
};

// --- CORE LOGIC ---

window.handleRegister = async function() {
    const regBtn = document.getElementById('register-btn');
    const refInput = document.getElementById('reg-referrer');
    let referrer = refInput ? refInput.value.trim() : "";
    if (!referrer || !ethers.utils.isAddress(referrer)) {
        referrer = "0x0000000000000000000000000000000000000000";
    }

    try {
        const network = await provider.getNetwork();
        if (network.chainId !== 97) {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x61' }] });
        }

        if(regBtn) { regBtn.disabled = true; regBtn.innerText = "CHECKING USDT..."; }

        const usdtContract = new ethers.Contract(USDT_TOKEN_ADDRESS, ERC20_ABI, signer);
        const feeWei = ethers.utils.parseUnits(REGISTRATION_FEE, 18);
        const userAddr = await signer.getAddress();
        const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESS);
        
        if (allowance.lt(feeWei)) {
            if(regBtn) regBtn.innerText = "APPROVING USDT...";
            const appTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await appTx.wait();
        }

        if(regBtn) regBtn.innerText = "CONFIRMING...";
        const tx = await contract.register(referrer, { gasLimit: 800000 });
        await tx.wait();

        alert("Account Activated Successfully!");
        window.location.href = "index1.html";
    } catch (err) {
        alert("Registration Error: " + (err.reason || err.message));
        if(regBtn) { regBtn.disabled = false; regBtn.innerText = "REGISTER NOW"; }
    }
};

window.handleWithdraw = async function() {
    const withdrawBtn = document.getElementById('withdrawBtn');
    const originalText = withdrawBtn.innerText;
    try {
        withdrawBtn.disabled = true;
        withdrawBtn.innerText = "SIGNING...";
        const userAddr = await signer.getAddress();
        const accountStats = await contract.getUserAccountStats(userAddr);
        const available = accountStats.availableBalance;

        if(available.eq(0)) {
            alert("Nothing to withdraw");
            withdrawBtn.disabled = false;
            withdrawBtn.innerText = originalText;
            return;
        }

        const tx = await contract.withdraw(available);
        withdrawBtn.innerText = "WITHDRAWING...";
        await tx.wait();
        alert("Withdrawal successful!");
        location.reload(); 
    } catch (err) {
        alert("Withdraw failed: " + (err.reason || err.message));
        withdrawBtn.innerText = originalText;
        withdrawBtn.disabled = false;
    }
};

window.handleClaimRewards = async function() {
    const claimBtn = document.getElementById('claimBtn');
    const originalText = claimBtn.innerText;
    try {
        claimBtn.disabled = true;
        claimBtn.innerText = "SIGNING...";
        const tx = await contract.claimReward(); 
        claimBtn.innerText = "CLAIMING...";
        await tx.wait();
        alert("Rewards Claimed Successfully!");
        location.reload(); 
    } catch (err) {
        alert("Claim failed: " + (err.reason || err.message));
        claimBtn.innerText = originalText;
        claimBtn.disabled = false;
    }
};

window.handleLogin = async function() {
    try {
        if (!window.ethereum) return alert("Wallet not detected!");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        const registered = await contract.isRegistered(userAddress);
        if (registered) {
            localStorage.setItem('userAddress', userAddress);
            localStorage.removeItem('manualLogout');
            window.location.href = "index1.html";
        } else {
            alert("Not registered!");
            window.location.href = "register.html";
        }
    } catch (err) { alert("Login failed"); }
};

window.handleLogout = function() {
    if (confirm("Disconnect and Logout?")) {
        localStorage.clear(); 
        localStorage.setItem('manualLogout', 'true');
        window.location.href = "index.html"; 
    }
}

// --- SETUP APP ---
async function setupApp(address) {
    try {
        // Add small check for contract initialization
        if (!window.contract) {
            window.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        }
        const isRegistered = await window.contract.isRegistered(address);
        const path = window.location.pathname;
        window.userData = { isRegistered };

        if (!isRegistered && !path.includes('register.html') && !path.includes('login.html')) {
            window.location.href = "register.html";
            return;
        }
        
        updateNavbar(address);
        const logoutIcon = document.getElementById('logout-icon-btn');
        if (logoutIcon) logoutIcon.style.display = 'flex';

        if (path.includes('index1.html')) {
            setTimeout(() => fetchAllData(address), 300);
            setTimeout(() => updateLiveMatrixStatus(), 500); 
        }
        if (path.includes('leadership.html')) {
            setTimeout(() => fetchLeadershipData(address), 300);
        }
        if (path.includes('history.html')) {
            setTimeout(() => fetchUserHistory(address), 300);
        }
        if (path.includes('team.html')) {
            setTimeout(() => fetchLevelTeam(address), 300);
        }
    } catch (err) { console.error("Setup Error", err); }
}

async function fetchAllData(address) {
    try {
        const activeContract = window.contract || contract;
        // Check if contract exists before calling
        if(!activeContract) return;

        const [basic, account, matrix, advanced, fund, isRegistered] = await Promise.all([
            activeContract.getUserBasicStats(address).catch(() => [[0],[0],[0]]),
            activeContract.getUserAccountStats(address).catch(() => ["", 0, 0]),
            activeContract.getMatrixIncomeReport(address).catch(() => [0,0,0,0,0]),
            activeContract.getAdvancedIncomeReport(address).catch(() => [0,0,0,0]),
            activeContract.rewardFund().catch(() => 0),
            activeContract.isRegistered(address).catch(() => false)
        ]);

        const shortAddr = address.substring(0, 6) + "..." + address.substring(38);
        updateText('user-address', shortAddr);
        updateText('full-address', address);
        updateText('username-display', "ACTIVE USER"); 
        updateText('rank-display', account[0] || "NO RANK");

        updateText('team-count', basic[0].toString());
        updateText('directs-count', basic[1].toString());
        updateText('total-earned', format(basic[2]));
        updateText('available-balance', format(account[1])); 
        updateText('withdrawable', format(account[1])); 
        updateText('total-withdrawn', format(account[2])); 
        updateText('reward-fund', format(fund));

        updateText('income-magic', format(matrix[0]));
        updateText('income-club1', format(matrix[1]));
        updateText('income-club2', format(matrix[2]));
        updateText('income-club3', format(matrix[3]));
        updateText('income-club4', format(matrix[4]));
        
        updateText('income-gt1', format(advanced[0]));
        updateText('income-gt2', format(advanced[1]));
        updateText('income-gt3', format(advanced[2]));
        updateText('income-reward', format(advanced[3]));

        const registerPath = window.location.pathname.includes('index1.html') ? window.location.pathname.replace('index1.html', 'register.html') : '/register.html';
        const baseUrl = window.location.origin + registerPath;
        const refField = document.getElementById('refURL');
        if(refField) refField.value = `${baseUrl}?ref=${address}`;

        const statusText = document.getElementById('main-status-text');
        if(statusText) {
            statusText.innerText = "CONNECTED";
            statusText.className = "text-xs font-black orbitron text-green-500";
        }
    } catch (err) { console.error("Data Sync Error:", err); }
}

async function fetchLeadershipData(address) {
    try {
        const activeContract = window.contract || contract;
        const directs = await activeContract.userStats(address, 0);
        const team = await activeContract.userStats(address, 1);
        const totalClaimed = await activeContract.userStats(address, 2);
        const account = await activeContract.getUserAccountStats(address);

        updateText('current-team-count', team.toString());
        updateText('directs-count', directs.toString());
        updateText('rank-reward-claimed', format(totalClaimed));
       updateText('available-balance-leader', format(account[1])); 
        updateText('current-rank-display', account[0]); 
    } catch (err) { console.error("Leadership Error:", err); }
}

async function fetchUserHistory(address) {
    try {
        const history = await contract.getUserHistory(address);
        const container = document.getElementById('history-table-body');
        if (!container) return;
        container.innerHTML = history.map(tx => `
            <tr>
                <td>${tx.txType}</td>
                <td>${format(tx.amount)}</td>
                <td>${tx.detail}</td>
                <td>${new Date(tx.timestamp.toNumber()*1000).toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function updateLiveMatrixStatus() {
    if (!window.contract) return;
    try {
        const magicCounts = await window.contract.getMagicPoolCounts();
        const clubCounts = await window.contract.getClubCounts();
        const gtCounts = await window.contract.getGTCounts();

        // --- MAGIC POOL (Normal 2, 4, 8, 16, 32, 64) ---
        const magicStages = [
            { label: "Stage 1", count: magicCounts[0].toNumber(), target: 2 },
            { label: "Stage 2", count: magicCounts[1].toNumber(), target: 4 },
            { label: "Stage 3", count: magicCounts[2].toNumber(), target: 8 },
            { label: "Stage 4", count: magicCounts[3].toNumber(), target: 16 },
            { label: "Stage 5", count: magicCounts[4].toNumber(), target: 32 },
            { label: "Stage 6", count: magicCounts[5].toNumber(), target: 64 }
        ];
        renderMatrixGroup('magic-pool-status', magicStages, 'blue');

        // --- ALL CLUBS (Har Club ki 3 Stages: 2, 4, 8) ---
        const clubStages = [];
        const clubNames = ["Club 1", "Club 2", "Club 3", "Club 4"];
        
        clubCounts.forEach((count, i) => {
            const val = count.toNumber();
            clubStages.push({ label: `${clubNames[i]} S1`, count: val, target: 2 });
            clubStages.push({ label: `${clubNames[i]} S2`, count: val, target: 4 });
            clubStages.push({ label: `${clubNames[i]} S3`, count: val, target: 8 });
        });
        renderMatrixGroup('club-status', clubStages, 'yellow');

        // --- ALL GT (Har GT ki 2 Stages: 2, 4) ---
        const gtStages = [];
        const gtNames = ["GT 1", "GT 2", "GT 3"];

        gtCounts.forEach((count, i) => {
            const val = count.toNumber();
            gtStages.push({ label: `${gtNames[i]} S1`, count: val, target: 2 });
            gtStages.push({ label: `${gtNames[i]} S2`, count: val, target: 4 });
        });
        renderMatrixGroup('gt-status', gtStages, 'purple');

    } catch (error) { 
        console.error("Live Matrix Update Error:", error); 
    }
}

// Render function wahi rakha hai jo aapne diya tha
function renderMatrixGroup(containerId, stages, colorTheme) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    const colors = { 
        blue: 'from-blue-600 to-cyan-400', 
        yellow: 'from-yellow-600 to-orange-400', 
        purple: 'from-purple-600 to-pink-400' 
    };

    stages.forEach(s => {
        let currentLevelFill = s.count % s.target;
        // Agar target hit ho gaya (modulo 0), toh full bar (target) dikhao
        if (s.count > 0 && currentLevelFill === 0) currentLevelFill = s.target; 
        
        const percentage = (currentLevelFill / s.target) * 100;
        html += `
            <div class="mb-4">
                <div class="flex justify-between text-[11px] orbitron mb-1">
                    <span class="text-gray-400 uppercase font-bold">${s.label}</span>
                    <span class="text-white">${currentLevelFill}/${s.target}</span>
                </div>
                <div class="h-2 bg-white/5 rounded-full border border-white/10 p-[1px]">
                    <div class="h-full bg-gradient-to-r ${colors[colorTheme]} rounded-full transition-all duration-1000" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

setInterval(updateLiveMatrixStatus, 15000);

async function fetchLevelTeam(address) {
    try {
        const container = document.getElementById('level-team-data');
        if (!container) return;
        let html = "";
        for(let i=1; i<=20; i++) {
            const levelMembers = await contract.getLevelTeam(address, i);
            if(levelMembers.length > 0) {
                html += `<div>Level ${i}: ${levelMembers.length} Members</div>`;
            }
        }
        container.innerHTML = html;
    } catch (e) { console.error(e); }
}

const format = (val) => {
    try { return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(2); } 
    catch (e) { return "0.00"; }
};

const updateText = (id, val) => {
    const elements = document.querySelectorAll(`[id="${id}"]`); 
    elements.forEach(el => { el.innerText = val; });
};

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);



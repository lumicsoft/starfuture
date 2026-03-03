let provider, signer, contract;

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0x9bDEC6D06A695B1981280B201A841bD27EF9a36e"; 
const USDT_TOKEN_ADDRESS = "0x3b66b1e08f55af26c8ea14a73da64b6bc8d799de"; // BSC USDT
const TESTNET_CHAIN_ID = 97; 
const REGISTRATION_FEE = "15";

// --- RANK CONFIG (Star1 to Master King) ---
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

// --- ABI (Full Updated for USDT Contract) ---
const CONTRACT_ABI = [
    // Write Functions
    "function register(address _ref) external",
    "function withdraw(uint256 _amt) external",
    "function claimReward() external",
    
    // View Functions (Mappings)
    "function isRegistered(address) view returns (bool)",
    "function referrer(address) view returns (address)",
    "function userStats(address, uint256) view returns (uint256)", // Mapping with index
    "function userIncomes(address, uint256) view returns (uint256)", // Mapping with index
    "function rewardFund() view returns (uint256)",
    
    // Explicit View Functions (Jo aapne contract ke niche likhe hain)
    "function getUserBasicStats(address _user) external view returns (uint256 team, uint256 directs, uint256 totalEarned)",
    "function getUserAccountStats(address _user) external view returns (string memory currentClub, uint256 availableBalance, uint256 withdrawn)",
    "function getMatrixIncomeReport(address _user) external view returns (uint256 dMagic, uint256 c1, uint256 c2, uint256 c3, uint256 c4)",
    "function getAdvancedIncomeReport(address _user) external view returns (uint256 g1, uint256 g2, uint256 g3, uint256 rwd)"
];
const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)", "function allowance(address owner, address spender) public view returns (uint256)"];

// ROI calculation (0.9% fixed)
const calculateGlobalROI = () => 0.90;

// --- 1. AUTO-FILL LOGIC ---
function checkReferralURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refAddr = urlParams.get('ref');
    const refField = document.getElementById('reg-referrer');

    if (refAddr && ethers.utils.isAddress(refAddr) && refField) {
        refField.value = refAddr;
        console.log("Referral address auto-filled:", refAddr);
    }
}

// --- INITIALIZATION ---
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
        } catch (error) { 
            console.error("Init Error", error); 
        }
    } else { 
        alert("Wallet not detected! Please open this site inside Trust Wallet or MetaMask browser."); 
    }
}


// --- CORE LOGIC ---
// --- FINAL REGISTRATION FUNCTION (HTML Synced) ---
window.handleRegister = async function() {
    // 1. Aapke HTML ke mutabiq IDs
    const regBtn = document.getElementById('register-btn');
    const refInput = document.getElementById('reg-referrer');
    
    // Referrer address nikalna
    let referrer = refInput ? refInput.value.trim() : "";
    
    // Agar input khali hai ya galat address hai, toh zero address (Admin) use hoga
    if (!referrer || !ethers.utils.isAddress(referrer)) {
        referrer = "0x0000000000000000000000000000000000000000";
    }

    try {
        // 2. Network Check (BSC Testnet: 97)
        const network = await provider.getNetwork();
        if (network.chainId !== 97) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }], // 97 in Hex
                });
            } catch (switchError) {
                alert("Please switch your wallet to BSC Testnet manually!");
                return;
            }
        }

        // 3. UI Status Update
        if(regBtn) {
            regBtn.disabled = true;
            regBtn.innerText = "CHECKING USDT...";
        }

        // 4. USDT Approval Logic
        // REGISTRATION_FEE upar define honi chahiye, e.g., const REGISTRATION_FEE = "10";
        const usdtContract = new ethers.Contract(USDT_TOKEN_ADDRESS, ERC20_ABI, signer);
        const feeWei = ethers.utils.parseUnits(REGISTRATION_FEE || "10", 18);
        const userAddr = await signer.getAddress();

        // Check allowance
        const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESS);
        
        if (allowance.lt(feeWei)) {
            if(regBtn) regBtn.innerText = "APPROVING USDT...";
            // Unlimited approval taaki user ko baar-baar approve na karna pade
            const appTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await appTx.wait();
        }

        // 5. Smart Contract Call
        if(regBtn) regBtn.innerText = "CONFIRMING...";
        console.log("Registering via Referrer:", referrer);

        // register function ko call karna
        const tx = await contract.register(referrer, {
            gasLimit: 800000 // Matrix calculations ke liye safe limit
        });

        if(regBtn) regBtn.innerText = "TRANSACTION MINING...";
        await tx.wait();

        // 6. Success
        alert("Account Activated Successfully!");
        window.location.href = "index1.html";

    } catch (err) {
        console.error("Register Error:", err);
        
        let errorMsg = err.reason || err.message || "Transaction Failed";
        
        if (err.code === 4001) {
            errorMsg = "User rejected the transaction.";
        } else if (errorMsg.includes("Referrer")) {
            errorMsg = "Referrer is not active. Use a valid referrer or Admin address.";
        }

        alert("Registration Error: " + errorMsg);

        // Error aane par button wapas normal karna
        if(regBtn) {
            regBtn.disabled = false;
            regBtn.innerText = "REGISTER NOW";
        }
    }
};

window.handleWithdraw = async function() {
   
    const withdrawBtn = document.getElementById('withdrawBtn'); // Ensure karein ID sahi ho
    const originalText = withdrawBtn.innerText;

    try {
        withdrawBtn.disabled = true;
        withdrawBtn.innerText = "SIGNING...";

        const tx = await contract.withdraw();
        
        withdrawBtn.innerText = "WITHDRAWING...";
        console.log("Transaction Hash:", tx.hash);
        
        await tx.wait();
        
        // 6. Success
        alert("Withdrawal successful!");
        location.reload(); 

    } catch (err) {
      
        console.error("Withdraw Error:", err);
       
        const errorMessage = err.reason || err.message || "User rejected or error occurred";
        alert("Withdraw failed: " + errorMessage);
       
        withdrawBtn.innerText = originalText;
        withdrawBtn.disabled = false;
    }
};


window.handleClaimRewards = async function() {
    // 1. Button aur uska original text (UI reset ke liye)
    const claimBtn = document.getElementById('claimBtn'); // Check karein aapki HTML ID yahi ho
    const originalText = claimBtn.innerText;

    try {
        // 2. UI Updates: Double-click rokne ke liye
        claimBtn.disabled = true;
        claimBtn.innerText = "SIGNING...";

      
        const tx = await contract.claimRewards(); 
        
        claimBtn.innerText = "CLAIMING...";
        console.log("Claim Transaction Hash:", tx.hash);
       
        await tx.wait();
        
        // 6. Success Notification
        alert("Rewards Claimed Successfully!");
        
        location.reload(); 

    } catch (err) {
        console.error("Claim Error:", err);
        
        const errorMessage = err.reason || err.message || "User rejected or error occurred";
        alert("Claim failed: " + errorMessage);
        
        claimBtn.innerText = originalText;
        claimBtn.disabled = false;
    }
};
// --- FINAL LOGIN FUNCTION ---
window.handleLogin = async function() {
    try {
        // 1. Check if Wallet is installed
        if (!window.ethereum) {
            alert("MetaMask/Trust Wallet not detected!");
            return;
        }

        // 2. Request Accounts (Connect Wallet)
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // 3. Network Check (BSC Testnet: 97)
        const network = await provider.getNetwork();
        if (network.chainId !== 97) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }], // 97 in Hex
                });
            } catch (err) {
                alert("Please switch to BSC Testnet manually!");
                return;
            }
        }

        // 4. Check User Registration Status
        // Naye contract mein 'userStats' function id return karta hai
        const stats = await contract.userStats(userAddress);
        
        // ethers.js mein BigNumber hota hai, isliye .gt(0) use kiya hai
        if (stats.id.gt(0)) {
            // Success: User registered hai
            localStorage.setItem('userAddress', userAddress);
            localStorage.removeItem('manualLogout');
            
            // Redirect to Dashboard
            window.location.href = "index1.html";
        } else {
            // Fail: User registered nahi hai
            alert("This wallet address is NOT registered in the system!");
            window.location.href = "register.html";
        }

    } catch (err) {
        console.error("Login Error:", err);
        alert("Login failed: " + (err.reason || err.message || "Unknown Error"));
    }
};

window.handleLogout = function() {
    if (confirm("Disconnect and Logout?")) {
       
        localStorage.clear(); 
        
        localStorage.setItem('manualLogout', 'true');
        
        window.location.href = "index.html"; 
    }
}

function showLogoutIcon(address) {
    const btn = document.getElementById('connect-btn');
    const logout = document.getElementById('logout-icon-btn');
    if (btn) btn.innerText = address.substring(0, 6) + "..." + address.substring(38);
    if (logout) logout.style.display = 'flex'; 
}

async function setupApp(address) {
    try {
        const network = await provider.getNetwork();
        if (network.chainId !== 97) { 
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }],
                });
            } catch (err) {
                alert("Please switch to BSC Testnet!");
                return; 
            }
        }
        
        // Naye contract mein userStats check karega
        const userData = await contract.userStats(address);
        const isRegistered = userData.id.gt(0); 
        const path = window.location.pathname;

        window.userData = window.userData || {};
        window.userData.isRegistered = isRegistered;

        // Registration Redirection Logic
        if (!isRegistered) {
            if (!path.includes('register.html') && !path.includes('login.html')) {
                window.location.href = "register.html"; 
                return; 
            }
        } else {
            if (path.includes('register.html') || path.includes('login.html') || path.endsWith('/') || path.endsWith('index.html')) {
                window.location.href = "index1.html";
                return;
            }
        }

        updateNavbar(address);
        showLogoutIcon(address); 

        if (path.includes('index1.html')) {
            setTimeout(() => fetchAllData(address), 300);
            start8HourCountdown(); 
        }
        if (path.includes('leadership.html')) {
            setTimeout(() => fetchLeadershipData(address), 300);
        }
        if (path.includes('history.html')) {
            setTimeout(() => window.showHistory('deposit'), 300);
        }
    } catch (err) {
        console.error("Setup Error:", err);
    }
}

// --- HISTORY LOGIC ---
window.showHistory = async function(category) {
    const container = document.getElementById('history-container');
    if(!container) return;
    
    container.innerHTML = `<div class="p-10 text-center text-yellow-500 italic animate-pulse">Fetching ${category.toUpperCase()} Records...</div>`;
  
    const typeMap = {
        'deposit': ['DEPOSIT'],
        'compounding': ['REINVEST'],
        'withdrawal': ['WITHDRAW', 'PRINCIPAL_WITHDRAW'],
        'income': ['ROI_INCOME', 'LEVEL_INCOME', 'RANK_INCOME']
    };

    const allowedTypes = typeMap[category] || [];
    const logs = await window.fetchBlockchainHistory(allowedTypes);

    if (logs.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-gray-500">No ${category} records found.</div>`;
        return;
    }

    container.innerHTML = logs.map(item => `
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 flex justify-between items-center hover:bg-white/10 transition-all">
            <div>
                <h4 class="font-bold ${item.color}">${item.type.replace('_', ' ')}</h4>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest">${item.detail}</p>
                <p class="text-[10px] text-gray-500 mt-1">${item.date} | ${item.time}</p>
            </div>
            <div class="text-right">
                <span class="text-lg font-black text-white">${item.amount}</span>
                <p class="text-[10px] text-gray-500 font-bold">USDT</p>
            </div>
        </div>
    `).join('');
}

window.fetchBlockchainHistory = async function(allowedTypes) {
    try {
        // --- TRUST WALLET FIX ---
        let address = localStorage.getItem('userAddress');
        
        if (!address && window.signer) {
            address = await window.signer.getAddress();
        }

        if (!address || address === "undefined") {
            console.log("History Error: No address found yet");
            return [];
        }

        const activeContract = window.contract || contract;
        if (!activeContract) return [];

        const rawHistory = await activeContract.getUserHistory(address);
        
        return rawHistory
            .filter(item => {
                const txType = item.txType.toUpperCase();
                return allowedTypes.includes(txType);
            }) 
            .map(item => {
                const txType = item.txType.toUpperCase();
                const dt = new Date(item.timestamp.toNumber() * 1000);
                
                let colorClass = 'text-cyan-400';
                if(txType.includes('INCOME')) colorClass = 'text-green-400';
                if(txType.includes('WITHDRAW')) colorClass = 'text-red-400';

                return {
                    type: txType,
                    amount: format(item.amount),
                    detail: item.detail,
                    date: dt.toLocaleDateString(),
                    time: dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    ts: item.timestamp.toNumber(),
                    color: colorClass
                };
            })
            .sort((a,b) => b.ts - a.ts); // Newest transactions first
    } catch (e) { 
        console.error("History Fetch Error:", e);
        return []; 
    }
}
async function fetchAllData(address) {
    try {
        const activeContract = window.contract || contract;
        if (!activeContract) {
            console.error("Contract not ready yet!");
            return;
        }

        // --- 1. CONTRACT SE DATA FETCH KARNA (Optimized for your Contract) ---
        // Hum contract ke explicitly banaye gaye view functions use karenge
        const [basic, account, matrix, advanced, fund] = await Promise.all([
            activeContract.getUserBasicStats(address),    // team, directs, totalEarned
            activeContract.getUserAccountStats(address),  // currentClub, availableBalance, withdrawn
            activeContract.getMatrixIncomeReport(address),// dMagic, c1, c2, c3, c4
            activeContract.getAdvancedIncomeReport(address), // g1, g2, g3, rwd
            activeContract.rewardFund()
        ]);

        // --- 2. BASIC INFO & ADDRESS ---
        // Address ko full aur short dono jagah update karenge
        updateText('user-address', address.substring(0, 6) + "..." + address.substring(38));
        updateText('full-address', address); // Agar kahin full dikhana ho
        updateText('username-display', "ACTIVE USER"); 
        updateText('rank-display', account.currentClub);

        // --- 3. MAIN STATS (Cards) ---
        updateText('team-count', basic.team.toString());
        updateText('directs-count', basic.directs.toString());
        updateText('total-earned', format(basic.totalEarned));
        updateText('available-balance', format(account.availableBalance));
        updateText('withdrawable', format(account.availableBalance)); // Withdraw modal ke liye
        updateText('total-withdrawn', format(account.withdrawn));
        updateText('reward-fund', format(fund));

        // --- 4. INCOME BREAKDOWN (Matrix) ---
        updateText('income-magic', format(matrix.dMagic));
        updateText('income-club1', format(matrix.c1));
        updateText('income-club2', format(matrix.c2));
        updateText('income-club3', format(matrix.c3));
        updateText('income-club4', format(matrix.c4));
        
        // --- 5. GT STAGES & REWARDS ---
        updateText('income-gt1', format(advanced.g1));
        updateText('income-gt2', format(advanced.g2));
        updateText('income-gt3', format(advanced.g3));
        updateText('income-reward', format(advanced.rwd));

        // --- 6. REFERRAL URL LOGIC ---
        const baseUrl = window.location.origin + window.location.pathname.replace('index1.html', 'register.html');
        const refField = document.getElementById('refURL');
        if(refField) {
            refField.value = `${baseUrl}?ref=${address}`;
        }

        // --- 7. UI ENHANCEMENTS (Wallet Status) ---
        const statusText = document.getElementById('main-status-text');
        if(statusText) {
            statusText.innerText = "CONNECTED";
            statusText.className = "text-xs font-black orbitron text-green-500";
        }

        // Agar user register hai toh register button disable karna (Login page ke liye)
        const isRegistered = await activeContract.isRegistered(address);
        if (isRegistered) {
            const regBtn = document.getElementById('register-btn');
            if(regBtn) {
                regBtn.innerText = "ALREADY ACTIVE";
                regBtn.disabled = true;
                regBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

    } catch (err) { 
        console.error("Data Sync Error:", err);
        // CALL_EXCEPTION handle karne ke liye alert (optional)
        if(err.code === 'CALL_EXCEPTION') {
            console.log("Please ensure you are on BSC Testnet!");
        }
    }
}
// --- UTILS (Inhe fetchAllData ke bahar hi rehne dein) ---
function getClubName(id) {
    const clubs = ["NO CLUB", "CLUB 1", "CLUB 2", "CLUB 3", "CLUB 4"];
    return clubs[id] || "NO CLUB";
}

const format = (val) => {
    try { 
        return parseFloat(ethers.utils.formatUnits(val, 18)).toFixed(2); 
    } catch (e) { 
        return "0.00"; 
    }
};

const updateText = (id, val) => {
    const elements = document.querySelectorAll(`[id="${id}"]`); 
    if(elements.length > 0) {
        elements.forEach(el => {
            el.innerText = val; 
        });
    }
};
// --- LEADERSHIP DATA (Corrected for RPC Mode) ---
async function fetchLeadershipData(address) {
    try {
        const activeContract = window.contract || contract;
        if (!activeContract) return;

        // Naye contract mein stats aur incomes se hi data milega
        const [stats, incomes] = await Promise.all([
            activeContract.userStats(address), 
            activeContract.userIncomes(address)
        ]);

        // Naye contract ke variable names ke hisaab se update
        updateText('current-team-count', stats.totalTeam.toString());
        updateText('directs-count', stats.totalReferrals.toString());
        updateText('rank-reward-claimed', format(stats.totalRewardClaimed));
        updateText('available-balance-leader', format(incomes.availableBalance));

        // Club Status dikhane ke liye
        const clubName = getClubName(stats.currentClub);
        updateText('current-rank-display', clubName);

    } catch (err) { 
        console.error("Leadership Data Error:", err); 
    }
}



function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);













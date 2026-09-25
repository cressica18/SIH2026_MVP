import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, IndianRupee, ShieldCheck, X, AlertCircle, Loader2 } from 'lucide-react';

interface AepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerName: string;
  defaultAmount?: number;
  advanceId?: string;
  onSuccess: (amount: number, txnRef: string) => void;
}

export const AepsModal: React.FC<AepsModalProps> = ({
  isOpen,
  onClose,
  farmerName,
  defaultAmount = 20000,
  advanceId,
  onSuccess,
}) => {
  const [aadhaarLast4, setAadhaarLast4] = useState('4521');
  const [amount, setAmount] = useState(defaultAmount);
  const [authStep, setAuthStep] = useState<'input' | 'scanning' | 'success' | 'error'>('input');
  const [txnRef, setTxnRef] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount);
      setAuthStep('input');
      setSimError(null);
      setTxnRef('');
      setIsSimulating(false);
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const handleStartBiometric = async () => {
    if (!advanceId) {
      setSimError('No advance request found. Please request an advance first.');
      setAuthStep('error');
      return;
    }

    if (!aadhaarLast4 || !/^\d{4}$/.test(aadhaarLast4.trim())) {
      setSimError('Please enter a valid 4-digit Aadhaar number.');
      setAuthStep('error');
      return;
    }

    const withdrawalAmt = Number(amount);
    if (isNaN(withdrawalAmt) || withdrawalAmt <= 0) {
      setSimError('Please enter a valid withdrawal amount.');
      setAuthStep('error');
      return;
    }

    setIsSimulating(true);
    setSimError(null);
    setAuthStep('scanning');
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/finance/aeps/simulate-cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ advanceId, aadhaarLast4 }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSimError(err.error || 'AEPS simulation failed');
        setAuthStep('error');
        setIsSimulating(false);
        return;
      }
      const data = await res.json();
      const newTxnRef = data.advance.aepsTxnRef;
      const disbursedAmount = data.advance.amountRequested || amount;
      setTxnRef(newTxnRef);
      setAmount(disbursedAmount);
      setAuthStep('success');
      onSuccess(disbursedAmount, newTxnRef);
    } catch (err) {
      setSimError('Failed to connect to AEPS simulation service');
      setAuthStep('error');
    } finally {
      setIsSimulating(false);
    }
  };

  const resetModal = () => {
    setAuthStep('input');
    setSimError(null);
    onClose();
  };

  const handleRetry = () => {
    setAuthStep('input');
    setSimError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bg-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-bg-850 rounded-3xl shadow-2xl border border-bg-700 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-harvest-900/50 border-b border-harvest-700 text-cream-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bg-800 rounded-lg border border-bg-700">
              <Fingerprint className="w-5 h-5 text-harvest-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-cream-50">
                AEPS Biometric Cash-Out Counter
              </h3>
              <p className="text-xs text-harvest-300 font-semibold">
                Aadhaar Enabled Payment System (Simulated BC Agent)
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-1 text-cream-400 hover:text-cream-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {authStep === 'input' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-900/30 border border-teal-700 rounded-xl text-xs text-teal-100 flex items-start gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <p>
                  No smartphone or bank branch visit required. Farmers withdraw liquidity directly via village Banking Correspondent (Bank Mitra) using Aadhaar fingerprint.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-300 mb-1">
                  Beneficiary Account Holder
                </label>
                <input
                  type="text"
                  disabled
                  value={farmerName}
                  className="w-full px-3 py-2 text-sm bg-bg-750 border border-bg-700 rounded-xl text-cream-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-300 mb-1">
                  Aadhaar Number (Last 4 Digits)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-bg-750 border border-bg-700 rounded-xl text-cream-500 text-sm tracking-widest font-mono font-bold">
                    •••• ••••
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    className="w-24 px-3 py-2 text-sm font-mono text-center tracking-widest border border-harvest-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-harvest-500 font-black text-cream-50 bg-bg-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-300 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-cream-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    step={1000}
                    min={1000}
                    max={50000}
                    className="w-full pl-8 pr-3 py-2 text-sm font-black text-cream-50 border border-bg-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-harvest-500 bg-bg-800"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartBiometric}
                  disabled={isSimulating}
                  className="w-full py-3 bg-gradient-to-r from-harvest-600 to-copper-600 hover:from-harvest-500 hover:to-copper-500 text-bg-950 font-bold text-sm rounded-xl shadow-lg shadow-harvest-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Simulating AEPS...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5" />
                      <span>Scan Biometric Fingerprint (Authenticate)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {authStep === 'scanning' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-24 h-24 rounded-full bg-harvest-900/30 border-4 border-harvest-500/40 flex items-center justify-center animate-pulse">
                <Fingerprint className="w-14 h-14 text-harvest-400" />
                <div className="absolute inset-x-2 h-1 bg-harvest-400/80 rounded-full animate-bounce shadow-xs" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-cream-50">
                  Simulating AEPS Cash-Out...
                </h4>
                <p className="text-xs text-cream-400 font-medium mt-1">
                  Transmitting to NPCI gateway (SIMULATED — no real banking)
                </p>
              </div>
              {isSimulating && (
                <Loader2 className="w-6 h-6 text-harvest-400 animate-spin" />
              )}
            </div>
          )}

          {authStep === 'error' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-copper-900/30 flex items-center justify-center text-copper-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-copper-300">
                  AEPS Simulation Failed
                </h4>
                <p className="text-xs text-cream-400 font-medium mt-0.5">
                  {simError || 'An error occurred during AEPS simulation'}
                </p>
              </div>
              <div className="p-3.5 bg-bg-750 border border-bg-700 rounded-xl text-left font-mono text-xs space-y-1.5 text-cream-300">
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">Advance ID:</span>
                  <span className="font-bold text-cream-50">{advanceId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">Aadhaar Auth:</span>
                  <span className="font-bold">•••• •••• {aadhaarLast4} (Simulated)</span>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full py-2.5 bg-bg-800 hover:bg-bg-750 text-cream-50 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-bg-700"
              >
                Retry Simulation
              </button>
              <button
                onClick={resetModal}
                className="w-full py-2.5 bg-bg-750 hover:bg-bg-700 text-cream-50 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-bg-700"
              >
                Cancel
              </button>
            </div>
          )}

          {authStep === 'success' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-forest-900/30 flex items-center justify-center text-forest-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-forest-300">
                  AEPS Cash-Out Authenticated!
                </h4>
                <p className="text-xs text-cream-400 font-semibold mt-0.5">
                  ₹{amount.toLocaleString('en-IN')} disbursed in cash by Bank Mitra
                </p>
              </div>

              <div className="p-3.5 bg-bg-750 border border-bg-700 rounded-xl text-left font-mono text-xs space-y-1.5 text-cream-300">
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">Txn Ref:</span>
                  <span className="font-black text-cream-50">{txnRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">Aadhaar Auth:</span>
                  <span className="font-bold">•••• •••• {aadhaarLast4} (UIDAI Success)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">BC Agent:</span>
                  <span className="font-bold text-cream-50">BC-PIMPALGAON-04 (MahaGramin Bank)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500 font-bold">Timestamp:</span>
                  <span className="font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <button
                onClick={resetModal}
                className="w-full py-2.5 bg-bg-800 hover:bg-bg-750 text-cream-50 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-bg-700"
              >
                Close Receipt
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-bg-700 text-[11px] text-cream-500 font-medium flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Simulated AEPS interface with mock NPCI settlement. No real banking integration.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
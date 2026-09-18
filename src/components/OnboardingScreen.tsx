import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export function OnboardingScreen({ onComplete }: { onComplete: (profile: any) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common
  const [name, setName] = useState(user?.name || '');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  
  // Farmer specific
  const [village, setVillage] = useState('');
  const [landSizeAcres, setLandSizeAcres] = useState('2');
  const [primaryCrops, setPrimaryCrops] = useState('Tomato, Onion');

  // Buyer specific
  const [businessName, setBusinessName] = useState('');
  const [buyerType, setBuyerType] = useState('consumer');

  // Logistics specific
  const [vehicleType, setVehicleType] = useState('Tata Ace (1 Ton)');
  const [capacityKg, setCapacityKg] = useState('1000');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('50');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let payload: any = { name, district, state };

    if (user?.role === 'farmer') {
      payload = {
        ...payload,
        village,
        landSizeAcres: Number(landSizeAcres),
        primaryCrops: primaryCrops.split(',').map((c) => c.trim()),
      };
    } else if (user?.role === 'buyer') {
      payload = {
        ...payload,
        businessName,
        buyerType,
      };
    } else if (user?.role === 'logistics') {
      payload = {
        ...payload,
        vehicleType,
        capacityKg: Number(capacityKg),
        serviceRadiusKm: Number(serviceRadiusKm),
      };
    }

    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const data = await res.json();
      onComplete(data.profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-emerald-800 mb-6">Complete Your Profile</h2>
        <p className="text-sm text-stone-600 mb-6">
          Welcome to Vasundhara! Please fill in some details to get started as a {user?.role}.
        </p>

        {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Full Name</label>
            <input
              required
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">State</label>
            <input
              required
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Maharashtra"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">District</label>
            <input
              required
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Pune"
            />
          </div>

          {user?.role === 'farmer' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Village</label>
                <input
                  required
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Land Size (Acres)</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={landSizeAcres}
                  onChange={(e) => setLandSizeAcres(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Primary Crops (comma separated)</label>
                <input
                  required
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={primaryCrops}
                  onChange={(e) => setPrimaryCrops(e.target.value)}
                />
              </div>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Business Name</label>
                <input
                  required
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Buyer Type</label>
                <select
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value)}
                >
                  <option value="consumer">Consumer</option>
                  <option value="processor">Processor</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>
            </>
          )}

          {user?.role === 'logistics' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Vehicle Type</label>
                <input
                  required
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Capacity (Kg)</label>
                <input
                  required
                  type="number"
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Service Radius (Km)</label>
                <input
                  required
                  type="number"
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-sm"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

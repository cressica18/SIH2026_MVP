import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Recycle, Factory, ShieldCheck } from 'lucide-react';
import { Card, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export function OnboardingScreen({ onComplete }: { onComplete: (profile: any) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common fields
  const [name, setName] = useState(user?.name || '');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  // Collector specific
  const [area, setArea] = useState('');
  const [collectorVehicleType, setCollectorVehicleType] = useState('cycle');
  const [collectionRadiusKm, setCollectionRadiusKm] = useState('10');
  const [primaryMaterials, setPrimaryMaterials] = useState('copper, plastic, ewaste');

  // Recycler specific
  const [recyclerBusinessName, setRecyclerBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('MPCB/RO/2024/00100');
  const [acceptedMaterials, setAcceptedMaterials] = useState('metal, ewaste, plastic');
  const [capacityKgPerDay, setCapacityKgPerDay] = useState('5000');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let payload: any = { name, district, state };

    if (user?.role === 'collector') {
      payload = {
        ...payload,
        area,
        vehicleType: collectorVehicleType,
        collectionRadiusKm: Number(collectionRadiusKm),
        primaryMaterials: primaryMaterials.split(',').map((m) => m.trim()),
      };
    } else if (user?.role === 'recycler') {
      payload = {
        ...payload,
        businessName: recyclerBusinessName,
        licenseNumber,
        acceptedMaterials: acceptedMaterials.split(',').map((m) => m.trim()),
        capacityKgPerDay: Number(capacityKgPerDay),
      };
    }

    try {
      const token = localStorage.getItem('kabadiwala_token');
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

  const roleIcon = user?.role === 'collector' ? <Recycle className="w-6 h-6 text-copper-500" /> :
                   user?.role === 'recycler' ? <Factory className="w-6 h-6 text-teal-500" /> :
                   <ShieldCheck className="w-6 h-6 text-purple-600" />;

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      <Card variant="elevated" padding="lg" className="max-w-md w-full bg-white shadow-2xl space-y-5 border border-stone-200">
        <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-300 shrink-0">
            {roleIcon}
          </div>
          <div>
            <CardTitle className="text-xl font-black text-stone-900">Complete Profile</CardTitle>
            <CardDescription className="text-xs text-stone-600 font-semibold">
              Fill in your registration details as a <span className="font-bold text-stone-900 capitalize">{user?.role}</span>.
            </CardDescription>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">Full Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">State</label>
              <Input
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">District</label>
              <Input
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </div>
          </div>

          {user?.role === 'collector' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Area / Locality</label>
                <Input
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dharavi, Sector 5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Vehicle Type</label>
                  <Select
                    options={[
                      { value: 'cycle', label: 'Cycle / Handcart' },
                      { value: 'auto', label: 'Three-Wheeler Auto' },
                      { value: 'tempo', label: 'Small Tempo (1 Ton)' },
                    ]}
                    value={collectorVehicleType}
                    onChange={(e) => setCollectorVehicleType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Collection Radius (Km)</label>
                  <Input
                    required
                    type="number"
                    value={collectionRadiusKm}
                    onChange={(e) => setCollectionRadiusKm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Primary Scrap Materials</label>
                <Input
                  required
                  value={primaryMaterials}
                  onChange={(e) => setPrimaryMaterials(e.target.value)}
                  placeholder="copper, plastic, ewaste"
                />
              </div>
            </>
          )}

          {user?.role === 'recycler' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Recycling Plant / Business Name</label>
                <Input
                  required
                  value={recyclerBusinessName}
                  onChange={(e) => setRecyclerBusinessName(e.target.value)}
                  placeholder="e.g. EcoRecycle India Pvt Ltd"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">License / Registration No.</label>
                <Input
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MPCB/RO/2024/00100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Accepted Materials</label>
                  <Input
                    required
                    value={acceptedMaterials}
                    onChange={(e) => setAcceptedMaterials(e.target.value)}
                    placeholder="metal, ewaste, plastic"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Capacity (Kg/Day)</label>
                  <Input
                    required
                    type="number"
                    value={capacityKgPerDay}
                    onChange={(e) => setCapacityKgPerDay(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            className="mt-4"
          >
            Complete Profile
          </Button>
        </form>
      </Card>
    </div>
  );
}

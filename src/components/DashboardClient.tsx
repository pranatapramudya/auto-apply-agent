'use client';

import React, { useState, useMemo } from 'react';

type Prospect = {
  id: string;
  businessName: string;
  category: string | null;
  city: string | null;
  whatsappNumber: string;
  rating: number | null;
  status: string;
  scrapedAt: Date;
  lastContactedAt: Date | null;
  notes: string | null;
};

interface DashboardClientProps {
  prospects: Prospect[];
}

export default function DashboardClient({ prospects }: DashboardClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [activeCity, setActiveCity] = useState<string>('Semua');
  const [activeStatus, setActiveStatus] = useState<string>('Semua');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu State

  // Extract unique filter options
  const categories = useMemo(() => {
    const cats = new Set<string>();
    prospects.forEach((p) => { if (p.category) cats.add(p.category); });
    return ['Semua', ...Array.from(cats)];
  }, [prospects]);

  const cities = useMemo(() => {
    const cts = new Set<string>();
    prospects.forEach((p) => { if (p.city) cts.add(p.city); });
    return ['Semua', ...Array.from(cts)];
  }, [prospects]);

  const statuses = ['Semua', 'PENDING', 'CONTACTED', 'HOT_LEAD', 'CLOSED'];

  // Filter prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
      const matchCity = activeCity === 'Semua' || p.city === activeCity;
      const matchStatus = activeStatus === 'Semua' || p.status === activeStatus;
      return matchCat && matchCity && matchStatus;
    });
  }, [prospects, activeCategory, activeCity, activeStatus]);

  // Calculate stats for the filtered prospects
  const stats = useMemo(() => {
    return {
      total: filteredProspects.length,
      pending: filteredProspects.filter((p) => p.status === 'PENDING').length,
      contacted: filteredProspects.filter((p) => p.status === 'CONTACTED').length,
      hotLeads: filteredProspects.filter((p) => p.status === 'HOT_LEAD').length,
    };
  }, [filteredProspects]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HOT_LEAD':
        return <span className="inline-flex items-center rounded-full bg-orange-100/80 px-2.5 py-1 text-[11px] font-semibold text-orange-700 border border-orange-200 whitespace-nowrap">Hot Lead</span>;
      case 'CONTACTED':
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 whitespace-nowrap">Contacted</span>;
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">Pending</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 whitespace-nowrap">Closed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-900 text-white p-1.5 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radar"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">One Salesman</span>
              <span className="text-lg font-bold tracking-tight text-slate-900 sm:hidden">OneSalesman</span>
            </div>
            
            {/* Right side - Profile/Menu dummy */}
            <div className="flex items-center gap-4">
              <button 
                className="text-slate-500 hover:text-slate-900 p-2 md:hidden rounded-md transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                )}
              </button>
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Admin</span>
                <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-slate-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg absolute w-full left-0 transition-all">
            <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 mb-2">
              <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-slate-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="font-medium text-slate-900">Admin</div>
                <div className="text-xs text-slate-500">admin@onesalesman.com</div>
              </div>
            </div>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 bg-slate-50">Dashboard</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50">Settings</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50">Sign Out</a>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
          
          {/* Header Section */}
          <header>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your scraped Google Maps leads efficiently.</p>
          </header>

          {/* Stats Grid: grid-cols-2 for mobile, md:grid-cols-4 for desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="flex flex-col bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
              <dt className="text-xs md:text-sm font-medium text-slate-500 mb-1">Total</dt>
              <dd className="text-2xl md:text-3xl font-bold text-slate-900">{stats.total}</dd>
            </div>
            <div className="flex flex-col bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
              <dt className="text-xs md:text-sm font-medium text-slate-500 mb-1">Pending</dt>
              <dd className="text-2xl md:text-3xl font-bold text-slate-900">{stats.pending}</dd>
            </div>
            <div className="flex flex-col bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
              <dt className="text-xs md:text-sm font-medium text-slate-500 mb-1">Contacted</dt>
              <dd className="text-2xl md:text-3xl font-bold text-slate-900">{stats.contacted}</dd>
            </div>
            <div className="flex flex-col bg-white p-4 md:p-5 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30">
              <dt className="text-xs md:text-sm font-medium text-orange-600 mb-1 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                Hot Leads
              </dt>
              <dd className="text-2xl md:text-3xl font-bold text-orange-600">{stats.hotLeads}</dd>
            </div>
          </div>

          {/* Filter Bar: flex-col on mobile, grid grid-cols-1 md:grid-cols-3 on desktop */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <label htmlFor="category" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Category
              </label>
              <select
                id="category"
                className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50/50 border transition-all cursor-pointer text-slate-700 font-medium"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full">
              <label htmlFor="city" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                City
              </label>
              <select
                id="city"
                className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50/50 border transition-all cursor-pointer text-slate-700 font-medium"
                value={activeCity}
                onChange={(e) => setActiveCity(e.target.value)}
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="status" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Status
              </label>
              <select
                id="status"
                className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-10 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50/50 border transition-all cursor-pointer text-slate-700 font-medium"
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
              >
                {statuses.map((stat) => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Area: using overflow-x-auto w-full and whitespace-nowrap */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 sm:pl-5 pr-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Business Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">City</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">WhatsApp</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Added On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProspects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center px-4">
                          <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm text-slate-600 font-medium">No prospects found.</p>
                          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or scrape new data.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <tr 
                        key={prospect.id} 
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="whitespace-nowrap py-3.5 pl-4 sm:pl-5 pr-3 text-sm font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span>{prospect.businessName}</span>
                            <span className="text-xs text-slate-500 sm:hidden mt-0.5">{prospect.category || '-'}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{prospect.category || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600 hidden md:table-cell">{prospect.city || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600 font-mono text-xs">{prospect.whatsappNumber}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm">{getStatusBadge(prospect.status)}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                          {new Date(prospect.scrapedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

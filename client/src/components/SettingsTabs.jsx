import React from 'react';

const tabs = [
  { key: 'entreprise', label: 'Entreprise' },
  { key: 'sequences', label: 'Sequences & Taxes' },
  { key: 'security', label: 'Securite' }
];

export default function SettingsTabs({ activeTab, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-2 shadow-[var(--pf-shadow-sm)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-[10px] px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-[var(--pf-neutral-900)] text-white' : 'text-[var(--pf-neutral-700)] hover:bg-[var(--pf-neutral-100)]'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

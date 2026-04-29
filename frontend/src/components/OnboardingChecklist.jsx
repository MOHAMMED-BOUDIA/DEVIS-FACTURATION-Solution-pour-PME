import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

export default function OnboardingChecklist({ steps = [] }) {
  const completed = steps.filter((s) => s.done).length;
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <Card title="Getting started" subtitle={`${completed}/${steps.length} etapes completees`}>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--pf-neutral-100)]">
        <div className="h-full bg-[var(--pf-primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center justify-between rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] p-3">
            <div className="flex items-start gap-3">
              {step.done ? <CheckCircle2 size={18} className="mt-0.5 text-[var(--pf-success)]" /> : <Circle size={18} className="mt-0.5 text-[var(--pf-neutral-500)]" />}
              <div>
                <p className="text-sm font-semibold text-[var(--pf-neutral-900)]">{step.title}</p>
                <p className="text-xs text-[var(--pf-neutral-600)]">{step.description}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={step.onClick}>
              Ouvrir
              <ArrowRight size={14} />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

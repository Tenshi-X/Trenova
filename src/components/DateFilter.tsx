'use client';

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, X, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';

interface DateFilterProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (dates: { start: Date | null; end: Date | null }) => void;
}

// Custom Input Component to mimic Material Design
const CustomDateInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick, placeholder, label, onClear }, ref) => (
        <div className="relative group min-w-[140px]">
            <button
                onClick={onClick}
                ref={ref}
                type="button"
                className={clsx(
                    "relative w-full flex items-center justify-between px-3 py-2.5",
                    "bg-white dark:bg-slate-900", 
                    "border border-slate-200 dark:border-slate-800",
                    "rounded-xl transition-all duration-200",
                    "hover:border-neon/50 focus:border-neon focus:ring-2 focus:ring-neon/20",
                    "group-hover:shadow-sm text-left"
                )}
            >
                <div>
                    <span className={clsx(
                        "block text-[10px] font-bold uppercase tracking-wider mb-0.5 transition-colors",
                         // Label logic: always visible, colored if value present
                        value ? "text-neon" : "text-slate-400 group-hover:text-neon/70"
                    )}>
                        {label}
                    </span>
                    <span className={clsx(
                        "block text-xs font-bold truncate",
                        value ? "text-slate-700 dark:text-slate-200" : "text-slate-400 italic"
                    )}>
                        {value || placeholder}
                    </span>
                </div>
                <div className="pl-2">
                    <Calendar size={16} className={clsx(
                        "transition-colors",
                        value ? "text-neon" : "text-slate-400 group-hover:text-neon/70"
                    )} />
                </div>
            </button>

            {value && onClear && (
                <button 
                   onClick={(e) => {
                       e.stopPropagation();
                       onClear();
                   }}
                   className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform z-10"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    )
);

CustomDateInput.displayName = 'CustomDateInput';

export default function DateFilter({ startDate, endDate, onChange }: DateFilterProps) {
    const { t } = useLanguage();

    const handleStartChange = (date: Date | null) => {
        onChange({ start: date, end: endDate });
    };

    const handleEndChange = (date: Date | null) => {
        onChange({ start: startDate, end: date });
    };

    return (
        <div className="flex items-center gap-3">
             <div className="relative z-20">
                <DatePicker
                    selected={startDate}
                    onChange={handleStartChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    customInput={<CustomDateInput label={t('filter_start_date')} placeholder={t('filter_select_date')} onClear={() => handleStartChange(null)} />}
                    dateFormat="dd MMM yyyy"
                    portalId="root-portal" // Use portal to avoid overflow clipping
                    popperClassName="!z-[9999]"
                />
             </div>

            <div className="text-slate-300 dark:text-slate-700">
                <ArrowRight size={16} />
            </div>

            <div className="relative z-10">
                <DatePicker
                    selected={endDate}
                    onChange={handleEndChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || undefined}
                    customInput={<CustomDateInput label={t('filter_end_date')} placeholder={t('filter_select_date')} onClear={() => handleEndChange(null)} />}
                    dateFormat="dd MMM yyyy"
                    portalId="root-portal"
                    popperClassName="!z-[9999]"
                />
            </div>
        </div>
    );
}

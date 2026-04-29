import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Calendar } from 'lucide-react';

// Initialize French locale for dayjs
dayjs.locale('fr');

/**
 * Universal Date Picker for the PME solution.
 * Enforces future year blocking (Current year or earlier only).
 * 
 * @param {Object} props
 * @param {dayjs.Dayjs | string | Date} props.value - Selected date
 * @param {Function} props.onChange - Selection handler
 * @param {string} props.mode - 'full' (DD/MM/YYYY) or 'month' (views: year, month)
 * @param {string} props.label - Optional label for the field
 * @param {boolean} props.allowFutureDates - If true, ignores the future year block
 * @param {string} props.className - Extra tailwind classes
 */
const AppDatePicker = ({ 
  value, 
  onChange, 
  mode = 'full', 
  label,
  allowFutureDates = false,
  className = '' 
}) => {
  const isMonthMode = mode === 'month';
  
  // Constraint Logic: Block future years unless explicitly allowed
  const maxDate = allowFutureDates ? undefined : dayjs().endOf('year');

  // Convert incoming value to dayjs object reliably
  const dateValue = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div className={`space-y-2 ${className}`}>
        {label && (
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <DatePicker
          value={dateValue}
          onChange={(newValue) => {
            const nextDate = newValue?.toDate ? newValue.toDate() : (newValue ? new Date(newValue) : null);
            if (typeof onChange === 'function') {
              onChange(nextDate);
            }
          }}
          views={isMonthMode ? ['year', 'month'] : ['year', 'month', 'day']}
          format={isMonthMode ? 'MMMM YYYY' : 'DD/MM/YYYY'}
          maxDate={maxDate}
          
          slotProps={{
            textField: {
              variant: 'standard',
              fullWidth: true,
              sx: {
                '& .MuiInputBase-input': {
                  padding: 0,
                  fontSize: '0.875rem',
                  fontWeight: 900,
                  color: '#1e293b',
                  textTransform: isMonthMode ? 'capitalize' : 'none',
                  letterSpacing: '-0.025em',
                  cursor: 'pointer',
                },
              },
            },
            input: {
              disableUnderline: true,
              readOnly: true,
              className: `group flex items-center bg-white border border-slate-200/60 rounded-full px-6 py-4 shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all duration-300 cursor-pointer`,
              startAdornment: (
                <div className="mr-3 p-1.5 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
              ),
            },
            popper: {
              placement: 'bottom-end',
              sx: {
                zIndex: 9999,
                '& .MuiPaper-root': {
                  marginTop: '12px',
                  borderRadius: '2rem',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)',
                  padding: '12px',
                },
                '& .MuiPickersDay-root': {
                  fontWeight: 700,
                  borderRadius: '12px',
                  '&.Mui-selected': {
                    backgroundColor: '#0f172a !important',
                    boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.4)',
                  },
                },
                '& .MuiPickersMonth-monthButton, & .MuiPickersYear-yearButton': {
                  fontWeight: 800,
                  borderRadius: '16px',
                  '&.Mui-selected': {
                    backgroundColor: '#0f172a !important',
                  },
                },
              },
            },
          }}
        />
      </div>
    </LocalizationProvider>
  );
};

export default AppDatePicker;